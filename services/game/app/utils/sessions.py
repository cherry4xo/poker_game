import json
from random import randint, choice
from typing import List, Optional
from operator import is_not
from functools import partial
from enum import Enum
from uuid import uuid4, UUID

from fastapi import WebSocket
from pydantic import UUID4

from app.utils.redis import r, ping_redis_connection
from app.utils.broadcast import Broadcaster
from app.utils.player import Player, PlayerStatus, Deck, Card, Hand, dict_to_pokerhand
from app import settings


class AbstractSessionFactory(object):
    def create_session(self):
        raise NotImplementedError()


class SessionStatus(Enum):
    LOBBY = 1
    GAME = 2
    PAUSED = 3


# number of checks in game
class SessionStage(Enum):
    PREFLOP = 0
    FLOP = 1
    TURN = 2
    RIVER = 3
    SHOWDOWN = 4


class Session(Broadcaster):
    # COMPLETE
    def __init__(
        self,
        uuid: Optional[UUID4] = None,
        max_players: Optional[int] = None,
        small_blind: Optional[float] = settings.DEFAULT_SMALL_BLIND,
        big_blind: Optional[float] = settings.DEFAULT_BIG_BLIND,
        players: List[Player] = [],
        seats: List[Optional[UUID4]] = [],
        status: Optional[SessionStatus] = SessionStatus.LOBBY,
        stage: Optional[SessionStage] = SessionStage.PREFLOP,
        board: Hand = Hand(),
        current_player: Optional[int] = None,
        dealer: Optional[int] = None,
        current_bet: Optional[float] = None,
        total_bet: Optional[float] = None,
        owner: Optional[UUID4] = None,
        data: Optional[dict] = None,
    ) -> None:
        super().__init__(players)
        self.max_players: int = max_players or settings.DEFAULT_MAX_PLAYERS
        if seats == []:
            seats = [None for _ in range(self.max_players)]
        self.id: UUID4 = uuid or uuid4()
        self.seats: List[Optional[UUID4]] = seats
        self.small_blind: float = small_blind
        self.big_blind: float = big_blind
        self.status: SessionStatus = status
        self.stage: SessionStage = stage
        self.board: Hand = board
        self.current_player: Optional[int] = current_player
        self.dealer: Optional[int] = dealer
        self.current_bet: Optional[float] = current_bet
        self.total_bet: Optional[float] = total_bet
        self.owner: Optional[UUID4] = owner
        self.deck: Deck = Deck()
        seats_dict = [str(seat) for seat in self.seats]
        if data is None:
            self.data = {
                "id": str(self.id),
                "status": self.status.value,
                "seats": seats_dict,
                "small_blind": self.small_blind,
                "big_blind": self.big_blind,
                "max_players": self.max_players,
                "players": [player.dict for player in self.players],
                "stage": self.stage.value,
                "board": self.board.dict,
                "current_player": self.current_player,
                "dealer": self.dealer,
                "current_bet": self.current_bet,
                "total_bet": self.total_bet,
                "owner": str(self.owner) if self.owner is not None else None
            }
        else:
            self.data = data

    # COMPLETE
    @classmethod
    async def create(
        cls,
        uuid: Optional[UUID4] = None,
        max_players: Optional[int] = None,
        small_blind: Optional[float] = settings.DEFAULT_SMALL_BLIND,
        big_blind: Optional[float] = settings.DEFAULT_BIG_BLIND,
        players: List[Player] = [],
        seats: List[Optional[UUID4]] = [],
        status: Optional[SessionStatus] = SessionStatus.LOBBY,
        stage: Optional[SessionStage] = SessionStage.PREFLOP,
        board: Hand = Hand(),
        current_player: Optional[int] = None,
        dealer: Optional[int] = None,
        current_bet: Optional[float] = None,
        total_bet: Optional[float] = None,
        owner: Optional[UUID4] = None,
        data: Optional[dict] = None
    ) -> "Session":
        """creates new Session object

        Args:
            uuid (Optional[UUID4], optional): session uuid. Defaults to None.
            max_players (Optional[int], optional): session max players count. Defaults to None.
            small_blind (Optional[float], optional): game small blind. Defaults to None.
            big_blind (Optional[float], optional): game big blind. Defaults to None.
            players (List[Player], optional): list of Player objects. Defaults to [].
            seats (List[Optional[UUID4]], optional): list of seats(not None is busy). Defaults to [].
            status (Optional[SessionStatus], optional): game status(lobby, pause, game). Defaults to SessionStatus.LOBBY.
            stage (Optional[SessionStage], optional): game stage(null, first, second, third, fourth). Defaults to SessionStage.PREFLOP.
            board (Hand, optional): game board cards(5 pieces)
            current_player (Optional[int], optional): game current player(number of seat). Defaults to None.
            dealer (Optional[int], optional): current game dealer(number of seat). Defaults to None.
            current_bet (Optional[float], optional): game current bet. Defaults to None.
            total_bet (Optional[float], optional): game total bet. Defaults to None.
            owner (Optional[UUID4], optional): game lobby creator(owner) uuid. Defaults to None.
            data (Optional[dict], optional): all the game info. Defaults to None.

        Returns:
            Session: Session object
        """        
        session = cls(
            uuid=uuid,
            max_players=max_players,
            small_blind=small_blind,
            big_blind=big_blind,
            players=players,
            seats=seats,
            status=status,
            stage=stage,
            board=board,
            current_player=current_player,
            dealer=dealer,
            current_bet=current_bet,
            total_bet=total_bet,
            owner=owner,
            data=data,
        )
        await session.set_data(data=session.data)
        return session

    # COMPLETE
    @classmethod
    async def get_data_by_uuid(cls, session_id: UUID4) -> dict:
        """get dict game info by Session object uuid

        Args:
            session_id (UUID4): Session object uuid

        Returns:
            dict: Session info dict formatted
        """        
        async with r.pipeline(transaction=True) as pipe:
            data_json = (await (pipe.get(f"session:{session_id}").execute()))[0]
        data: dict = json.loads(data_json)
        return data

    # COMPLETE
    # NOTE for existing Session object
    async def get_data(self) -> dict:
        async with r.pipeline(transaction=True) as pipe:
            data_json = (await (pipe.get(f"session:{self.id}").execute()))[0]
        data: dict = json.loads(data_json)
        self.data = data
        self.id = UUID(data["id"])
        self.status = SessionStatus(data['status'])
        self.seats = [UUID(seat) if seat != "None" else None for seat in data["seats"]]
        self.small_blind = data["small_blind"]
        self.big_blind = data["big_blind"]
        self.max_players = data["max_players"]
        self.stage = SessionStage(data['stage'])
        board = dict_to_pokerhand(hand_dict=data["board"])
        self.board = board
        self.current_player = data["current_player"]
        self.dealer = data["dealer"]
        self.current_bet = data["current_bet"]
        self.total_bet = data["total_bet"]
        for player_data in data["players"]:
            player = self.get_player(player_id=player_data["id"])
            if player is not None:
                player.name = player["name"]
                player.balance = player["balance"]
                player.hand = dict_to_pokerhand(player["hand"])
                player.currentbet = player["currentbet"]
                player.status = PlayerStatus(data['status'])
        return data    

    async def set_data(self, data: dict) -> None:
        data_json = json.dumps(data, default=str)
        async with r.pipeline(transaction=True) as pipe:
            await (pipe.set(f"session:{self.id}", data_json).execute())
        self.data = data
    
    async def add_player(self, player: Player) -> bool:
        await self.get_data()
        if len(self.players) < self.max_players:
            self.players.append(player)
            await self.save()
            await self.send_all_data(self.data)
            return True
        return False
    
    def get_random_player(self) -> Player:
        player_id = choice(list(filter(partial(is_not, None), self.players)))
        return self.get_player(player_id=player_id.id)
    
    async def _get_next_busy_seat(self, user_id: UUID4) -> int:
        await self.get_data()
        player_seat = self.seats.index(user_id)
        seat_index = (player_seat + 1) % self.max_players
        next_player_seat = self.seats[seat_index]
        while next_player_seat is None:
            seat_index = (seat_index + 1) % self.max_players
            next_player_seat = self.seats[seat_index]
        return seat_index
    
    async def _get_player_by_index(self, index: int) -> Player:
        await self.get_data()
        player_id = self.seats[index]
        player = self.get_player(player_id=player_id)
        return player
    
    async def _get_index_by_player(self, player_id: UUID4) -> int:
        await self.get_data()
        try:
            return self.seats.index(player_id)
        except ValueError:
            return -1

    # COMPLETE
    # NOTE for existing Session object
    async def remove_player(self, user_id: UUID4) -> bool:
        await self.get_data()
        player = self.get_player(player_id=user_id)
        if player is None:
            return False
        self.players.remove(player)
        if user_id in self.seats:
            player_seat = self.seats.index(user_id)
            self.seats[player_seat] = None
            seat_index = await self._get_next_busy_seat(user_id=user_id)
            if self.current_player == player_seat:
                self.current_player == seat_index
            if self.dealer == player_seat:
                self.dealer == seat_index
        if self.owner == str(user_id):
            new_owner_index = randint(0, len(self.players) - 1)
            self.owner = self.players[new_owner_index].id
        for seat in self.seats:
            if seat == user_id:
                seat = None
        await self.save()
        await self.send_all_data(self.data)
        return True
    
    # COMPLETE
    @classmethod
    async def delete(cls, session_id: UUID4) -> bool:
        session = await cls.get_session_by_uuid(session_id=session_id)
        if session is None:
            return False
        async with r.pipeline(transaction=True) as pipe:
            await (pipe.delete(f"session:{session_id}").execute())
        return True
    
    # COMPLETE
    async def save(self) -> None:
        """accept changes in Session object data
        """
        self.data = {
                "id": str(self.id),
                "status": self.status.value,
                "seats": [str(seat) for seat in self.seats],
                "small_blind": self.small_blind,
                "big_blind": self.big_blind,
                "max_players": self.max_players,
                "players": [player.dict for player in self.players],
                "stage": self.stage.value,
                "board": self.board.dict,
                "current_player": self.current_player,
                "dealer": self.dealer,
                "current_bet": self.current_bet,
                "total_bet": self.total_bet
            }
        await self.set_data(data=self.data)

    async def take_seat(self, player_id: UUID4, seat_num: int) -> dict:
        await self.get_data()
        if self.seats[seat_num] is not None:
            return {
                "type": "error",
                "message": "this seat is already taken"
            }
        if player_id in self.seats:
            player_seat = self.seats.index(player_id)
            self.seats[player_seat] = None
        self.seats[seat_num] = player_id
        await self.save()
        return {
            "type": "success",
            "message": f"player's seat: {seat_num}"
        }
        
    async def start_game(self) -> dict:
        data = await self.get_data()
        if len(data["players"]) < 2:
            return {
                "type": "error",
                "message": "not enough players to start game"
            }
        
        self.total_bet = 0.0
        self.current_bet = 0.0
        self.status = SessionStatus.GAME
        self.stage = SessionStage.PREFLOP
        self.board.cards.clear()
        
        for _ in range(5):
            card = self.deck.deal_card()
            self.board.add_card(card)

        for player in self.players:
            player.hand.cards.clear()
            player.status = PlayerStatus.PLAYING
            for _ in range(2):
                card = self.deck.deal_card()
                player.hand.add_card(card)

        await self.save()

        dealer = self.get_random_player()
        self.dealer = await self._get_index_by_player(player_id=dealer.id)
        await dealer._bet(self.small_blind)
        self.total_bet += self.small_blind
        self.current_bet = self.small_blind
        await self.save()
        next_player_index = await self._get_next_busy_seat(dealer.id)
        next_player_id = self.seats[next_player_index]
        next_player = self.get_player(player_id=next_player_id)
        await next_player._bet(self.big_blind)
        self.total_bet += self.big_blind
        self.current_bet = self.big_blind
        self.current_player = next_player_index
        await self.save()

        return {
            "type": "success",
            "message": "started game",
            "data": self.data
        }
    
    async def bet(self, player_id: UUID4, value: float) -> dict:
        await self.get_data()
        user_seat = await self._get_index_by_player(player_id=player_id)
        if user_seat == -1 or user_seat != self.current_player:
            return {
                "type": "error",
                "message": "now is not this user move"
            }
        player = self.get_player(player_id=player_id)
        total_value = await player._bet(value)
        self.total_bet += total_value
        self.current_bet += total_value
        await self.save()
        next_player_index = await self._get_next_busy_seat(player.id)
        self.current_player = next_player_index
        await self.save()

        return {
            "type": "success",
            "message": "user betted",
            "data": self.data
        }
    
    async def call(self, player_id: UUID4) -> dict:
        await self.get_data()
        user_seat = await self._get_index_by_player(player_id=player_id)
        if user_seat == -1 or user_seat != self.current_player:
            return {
                "type": "error",
                "message": "now is not this user move"
            }
        player = self.get_player(player_id=player_id)
        delta = await player._call(bet=self.current_bet)
        self.total_bet += delta
        await self.save()
        next_player_index = await self._get_next_busy_seat(player.id)
        self.current_player = next_player_index
        await self.save()

        return {
            "type": "success",
            "message": "user called",
            "data": self.data
        }
    
    async def raise_bet(self, player_id: UUID4, value: float) -> dict:
        await self.get_data()
        user_seat = await self._get_index_by_player(player_id=player_id)
        if user_seat == -1 or user_seat != self.current_player:
            return {
                "type": "error",
                "message": "now is not this user move"
            }
        player = self.get_player(player_id=player_id)
        delta = await player._raise(value=value)
        self.total_bet += delta
        self.current_bet = player.currentbet
        await self.save()
        next_player_index = await self._get_next_busy_seat(player.id)
        self.current_player = next_player_index
        await self.save()

        return {
            "type": "success",
            "message": "user raised",
            "data": self.data
        }
    
    async def pass_board(self, player_id: UUID4) -> dict:
        await self.get_data()
        user_seat = await self._get_index_by_player(player_id=player_id)
        if user_seat == -1 or user_seat != self.current_player:
            return {
                "type": "error",
                "message": "now is not this user move"
            }
        player = self.get_player(player_id=player_id)
        await player._pass()
        self.seats[user_seat] = None
        await self.save()

        return {
            "type": "success",
            "message": "user passed",
            "data": self.data
        }
    
    async def get_winners(self) -> List[int]:
        best_hand = None
        best_player = None

        for index, player_id in enumerate(self.seats):
            if player_id is None:
                continue
            player = self.get_player(player_id=player_id)
            for card in self.board.cards:
                player.hand.add_card(card=card)
            player_hand = player.hand
            hand_value = player_hand.evaluate()
            if best_hand is None or hand_value[0] > best_hand[0]:
                best_hand = hand_value
                best_player = index
            elif hand_value[0] == best_hand[0]:
                for card1, card2 in zip(hand_value[1], best_hand[1]):
                    rank_value1 = player_hand.rank_value(card1[0])
                    rank_value2 = player_hand.rank_value(card2[0])
                    if rank_value1 > rank_value2:
                        best_hand = hand_value
                        best_player = index
                        break
                    elif rank_value1 < rank_value2:
                        break

        winners = [best_player]
        for index, player_id in enumerate(self.seats):
            if player_id is None:
                continue
            player = self.get_player(player_id=player_id)
            if index == best_player:
                continue
            player_hand = player.hand
            hand_value = player_hand.evaluate()
            if hand_value[0] == best_hand[0]:
                is_tie = True
                for card1, card2 in zip(hand_value[1], best_hand[1]):
                    rank_value1 = player_hand.rank_value(card1[0])
                    rank_value2 = player_hand.rank_value(card2[0])
                    if rank_value1 != rank_value2:
                        is_tie = False
                        break
                if is_tie:
                    winners.append(index)

        if len(winners) == 1:
            return winners
        else:
            # Compare the highest cards of the tied players
            highest_card_winners = []
            highest_card_value = -1
            for winner in winners:
                player = await self._get_player_by_index(index=winner)
                player_hand = player.hand
                highest_card = max(player_hand.cards, key=lambda card: player_hand.rank_value(card.rank))
                highest_card_rank_value = player_hand.rank_value(highest_card.rank)
                if highest_card_rank_value > highest_card_value:
                    highest_card_value = highest_card_rank_value
                    highest_card_winners = [winner]
                elif highest_card_rank_value == highest_card_value:
                    highest_card_winners.append(winner)

            if len(highest_card_winners) == 1:
                return highest_card_winners
            else:
                # Compare the remaining cards of the tied players
                final_winners = []
                for winner in highest_card_winners:
                    player = await self._get_player_by_index(index=winner)
                    player_hand = player.hand
                    remaining_cards = sorted(player_hand.cards, key=lambda card: player_hand.rank_value(card.rank), reverse=True)
                    if not final_winners:
                        final_winners.append(winner)
                    else:
                        current_winner_player = await self._get_player_by_index(index=final_winners[0])
                        current_winner_hand = current_winner_player.hand
                        current_winner_remaining_cards = sorted(current_winner_hand.cards, key=lambda card: current_winner_hand.rank_value(card.rank), reverse=True)
                        for card1, card2 in zip(remaining_cards, current_winner_remaining_cards):
                            rank_value1 = player_hand.rank_value(card1.rank)
                            rank_value2 = current_winner_hand.rank_value(card2.rank)
                            if rank_value1 > rank_value2:
                                final_winners = [winner]
                                break
                            elif rank_value1 < rank_value2:
                                break
                        else:
                            final_winners.append(winner)

                return final_winners
    
    async def check(self, player_id: UUID4) -> dict:
        await self.get_data()
        user_seat = await self._get_index_by_player(player_id=player_id)
        if user_seat == -1 or user_seat != self.current_player:
            return {
                "type": "error",
                "message": "now is not this user move"
            }
        for seat in self.seats:
            if seat is not None:
                player = self.get_player(player_id=seat)
                if player.currentbet != self.current_bet:
                    if player.balance != 0:
                        return {
                            "type": "success",
                            "message": "not_ready_for_check"
                        }
                    
        for seat in self.seats:
            if seat is not None:
                player = self.get_player(player_id=seat)
                player.currentbet = 0.0
                
        self.current_bet = 0.0
        self.stage = SessionStage((self.stage.value + 1) % 5)
        self.current_player = self.dealer
        await self.save()

        if self.stage == SessionStage.SHOWDOWN:
            winners = await self.get_winners()

            return {
                "type": "success",
                "message": "ends",
                "winners": winners
            }

        return {
            "type": "success",
            "message": "checked",
            "data": self.data
        }


    # # TODO complete
    # def add_player(self, user: Player) -> bool:
    #     """add player into current session

    #     Args:
    #         user (Player): Player object

    #     Returns:
    #         bool: True if added successfully, False if not
    #     """        
    #     if len(self.players_id_list) < self.max_players:
    #         self.players_id_list.append(user)
    #         return True
    #     return False

    # # TODO complete
    # def remove_player(self, user_id: UUID4) -> bool:
    #     """remove player from current session

    #     Args:
    #         user_id (UUID4): Player object uuid

    #     Returns:
    #         bool: True if removed successfully, False if not
    #     """        
    #     for player in self.players_id_list:
    #         if player.id == user_id:
    #             self.players_id_list.remove(player)
    #             return True
    #     return False

    # # COMPLETE
    # @classmethod
    # async def add_player_by_uuid(cls, player: Player, session_id: UUID4) -> bool:
    #     """add player into players_id_list of Session object with <session_id> uuid

    #     Args:
    #         player (Player): Player object
    #         session_id (UUID4): Session object uuid to add player into

    #     Returns:
    #         bool: True if added successfully, False if not
    #     """ 
    #     data = await cls.get_data_by_uuid(session_id=session_id)
    #     if len(data["players"]) < data["players"]:
    #         data["players"].append(player.dict)
    #         await cls.set_data_by_uuid(session_id=session_id, data_json=data)
    #         return True
    #     return False

    # # COMPLETE
    # # TODO maybe bug when 1 player
    # @classmethod
    # async def remove_player_by_uuid(cls, user_id: UUID4, session_id: UUID4) -> bool:
    #     """remove player from players_id_list of Session object with <session_id> uuid

    #     Args:
    #         user_id (UUID4): Player object uuid
    #         session_id (UUID4): Session object uuid to remove player from

    #     Returns:
    #         bool: True if removed successfully, False if not
    #     """    
    #     data = await cls.get_data_by_uuid(session_id=session_id)
    #     if not(str(user_id) in data["players"]):
    #         return False
    #     data["players"].remove(str(user_id))
    #     player_seat = data["seats"].index(str(user_id))
    #     seat_index = (player_seat + 1) % data["max_players"]
    #     next_player_seat = data["seats"][seat_index]
    #     while next_player_seat is None:
    #         seat_index = (seat_index + 1) % data["max_players"]
    #         next_player_seat = data["seats"][seat_index]
    #     if data["current_player"] == player_seat:
    #         data["current_player"] == next_player_seat
    #     if data["dealer"] == player_seat:
    #         data["dealer"] == next_player_seat
    #     if data["owner"] == str(user_id):
    #         new_owner_index = randint(0, len(data["players"]) - 1)
    #         data["owner"] = data["players"][new_owner_index]["id"]
    
    #     data["seats"] = list(map(lambda x: x.replace(str(user_id), None), data["seats"]))
    #     await cls.set_data_by_uuid(session_id=session_id, data_json=data)
    #     return True

    # # COMPLETE
    # @classmethod
    # async def get_session_by_uuid(cls, session_id: UUID4) -> Optional["Session"]:
    #     """get Session object by uuid

    #     Args:
    #         session_id (UUID4): Session object uuid 

    #     Returns:
    #         Session: Session object
    #     """        
    #     async with r.pipeline(transaction=True) as pipe:
    #         data_json = await (pipe.get(f"session:{session_id}").execute())[0]
    #     data: dict = json.loads(data_json)
    #     if data == {}:
    #         return None
    #     players = [Player.create(data=user_data) for user_data in data["players"]]
    #     seats = [UUID(uuid) for uuid in data["seats"]]
    #     session = Session(uuid=data["id"],
    #                       max_players=data["max_players"],
    #                       small_blind=data["small_blind"],
    #                       big_blind=data["big_blind"],
    #                       players=players,
    #                       seats=seats,
    #                       status=SessionStatus[f"{data['status']}"],
    #                       stage=SessionStage[f"{data['stage']}"],
    #                       current_player=data["current_player"],
    #                       dealer=data["dealer"],
    #                       current_bet=data["current_bet"],
    #                       total_bet=data["total_bet"],
    #                       owner=data["owner"],
    #                       data=data)
    #     return session
    
    # # COMPLETE
    # @classmethod
    # async def set_data_by_uuid(cls, session_id: UUID4, data: dict) -> None:
    #     """set or override Session info

    #     Args:
    #         session_id (UUID4): Session object uuid data to override
    #         data_json (str): data json formatted
    #     """        
    #     data_json = json.dumps(data)
    #     async with r.pipeline(transaction=True) as pipe:
    #         await (pipe.set(f"session:{session_id}", data_json).execute())


class SessionsContainer:
    # COMPLETE
    def __init__(self) -> None:
        self.sessions: List[Session] = []
        self.factory: SessionFactory = create_factory()

    # COMPLETE
    async def find_session_by_uuid(self, session_id: UUID4) -> Optional[Session]:
        """finds session by its uuid

        Args:
            session_id (UUID4): sought session uuid

        Returns:
            Optional[Session]: Session object with <session_id> if exists
        """
        session = await Session.get_session_by_uuid(session_id=session_id)
        return session
    
    def get_session(self, session_id: UUID4) -> Optional[Session]:
        for session in self.sessions:
            if session.id == session_id:
                return session
        return None

    # COMPLETE
    async def create_session(self, max_players: int = None) -> Session:
        """creates session and appends it in sessions_container

        Args:
            max_players (int, optional): session max players. Defaults to None.

        Returns:
            Session: created Session object
        """        
        session = await self.factory.create_session(max_players)
        self.sessions.append(session)
        return session

    # COMPLETE
    async def remove_session_by_uuid(self, uuid: UUID4) -> bool:
        """deletes Session object and removes it from sessions_container

        Args:
            uuid (UUID4): uuid of Session for deletion

        Returns:
            bool: True if deleted, False if not
        """
        session = self.get_session(session_id=uuid)
        if session is None:
            return False
        try:
            self.sessions.remove(session)
        except ValueError:
            return False
        return True

    # COMPLETE
    async def find_user_session(self, uuid: UUID4) -> Optional[Session]:
        """finds user's current session

        Args:
            uuid (UUID4): user uuid

        Returns:
            Optional[Session]: Session object that user playing in
        """
        for session in self.sessions:
            for player in session.players:
                if player.id == uuid:
                    return session
        return None
    
    # COMPLETE
    async def get_session_by_uuid(self, uuid: UUID4) -> Optional[Session]:
        """find and get Session object by its uuid

        Args:
            uuid (UUID4): sought Session object uuid

        Returns:
            Optional[Session]: Session object if exists
        """        
        return await Session.get_session_by_uuid(session_id=uuid)
    
    # COMPLETE
    async def add_user(self, user_id: UUID4, session_id: UUID4) -> bool:
        """adds user uuid into Session object with <session_id> uuid

        Args:
            user_id (UUID4): user uuid
            session_id (UUID4): Session object uuid

        Returns:
            bool: True if added successfully, False if not
        """        
        if await self.find_user_session(uuid=user_id) is not None:
            return False
        if await self.get_session_by_uuid(uuid=session_id) is None:
            return False
        player = Player(uuid=user_id)
        return await Session.add_player(player=player, session_id=session_id)
    
    # COMPLETE
    async def remove_player(self, user_id: UUID4) -> bool:
        """remove player from his session if it exists

        Args:
            user_id (UUID4): Player object uuid

        Returns:
            bool: True if deleted successfully, False if not
        """        
        user_session = await self.find_user_session(uuid=user_id)
        if user_session is None:
            return False
        return await Session.remove_player(user_id=user_id, session_id=user_session.id)
    

class SessionFactory(AbstractSessionFactory):
    async def create_session(self, owner: UUID4, max_players: int = None) -> Session:
        """create concrete session

        Args:
            owner (UUID4): new game owner uuid
            max_players (int, optional): max game players count. Defaults to None.

        Returns:
            Session: created Session object 
        """        
        return await Session.create(owner=owner, max_players=max_players)
    

def create_factory() -> SessionFactory:
    return SessionFactory()


def create_session_container() -> SessionsContainer:
    return SessionsContainer()


sessions_container = create_session_container()