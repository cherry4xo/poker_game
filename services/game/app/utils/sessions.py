import json
from typing import List, Optional
from enum import Enum
from uuid import uuid4, UUID

from fastapi import WebSocket
from pydantic import UUID4

from app.utils.redis import r, ping_redis_connection
from app import settings


class PlayerStatus(Enum):
    NOT_READY = 0
    READY = 1
    PLAYING = 2
    STAYING = 3
    PASS = 4


class Player:
    def __init__(self, uuid: UUID4, name: str, balance: float = None) -> None:
        self.id = uuid
        self.name = name
        self.balance = balance or settings.DEFAULT_START_BALANCE
        self.hand = []
        self.currentbet = 0
        self.handscore = 0
        self.status = PlayerStatus.NOT_READY

    @classmethod
    async def create(cls, data: dict) -> "Player":
        player = Player(uuid=data["id"],
                        name=data["name"],
                        balance=data["balance"])
        player.hand = data["hand"]
        player.currentbet = data["currentbet"]
        player.handscore = data["handscore"]
        player.status = PlayerStatus[f"{data['status']}"]
        return player
    
    async def _bet(self, value: float) -> Optional[float]:
        try:
            self.balance -= value
            self.currentbet += value
            self.status = PlayerStatus.STAYING
            return value
        except Exception:
            return None
        
    async def _call(self, bet: float) -> Optional[float]:
        try:
            delta = bet - self.currentbet
            self.balance -= delta
            self.status = PlayerStatus.STAYING
            return delta
        except Exception:
            return None
        
    async def _pass(self) -> bool:
        try:
            self.status = PlayerStatus.PASS
            return True
        except Exception:
            return None
        
    async def _raise(self, value: float) -> Optional[float]:
        try:
            self.balance -= value
            self.currentbet += value
            self.status = PlayerStatus.STAYING
        except Exception:
            return None

    def __dict__(self) -> dict:
        data = {
            "id": self.id,
            "name": self.name,
            "balance": self.balance,
            "hand": self.hand,
            "currentbet": self.currentbet,
            "handscore": self.handscore,
            "status": self.status.name
        }
        return data


class AbstractSessionFactory(object):
    def create_session(self):
        raise NotImplementedError()


class SessionStatus(Enum):
    LOBBY = 1
    GAME = 2
    PAUSED = 3


# number of checks in game
class SessionStage(Enum):
    NULL = 0
    FIRST = 1
    SECOND = 2
    THIRD = 3
    FOURTH = 4


class Session:
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
        stage: Optional[SessionStage] = SessionStage.NULL,
        current_player: Optional[int] = None,
        dealer: Optional[int] = None,
        current_bet: Optional[float] = None,
        total_bet: Optional[float] = None,
        data: Optional[dict] = None
    ) -> None:
        if seats == []:
            seats = [None for _ in range(max_players)]
        self.id: UUID4 = uuid or uuid4()
        self.seats: List[Optional[UUID4]] = seats
        self.small_blind: float = small_blind
        self.big_blind: float = big_blind
        self.status: SessionStatus = status
        self.max_players: int = max_players or settings.DEFAULT_MAX_PLAYERS
        self.players: List[Player] = players
        self.stage: SessionStage = stage
        self.current_player: Optional[int] = current_player
        self.dealer: Optional[int] = dealer
        self.current_bet: Optional[float] = current_bet
        self.total_bet: Optional[float] = total_bet
        seats_dict = [str(seat) for seat in self.seats]
        if data is None:
            self.data = {
                "id": str(self.id),
                "status": self.status.name,
                "seats": seats_dict,
                "small_blind": self.small_blind,
                "big_blind": self.big_blind,
                "max_players": self.max_players,
                "players": [player.__dict__() for player in self.players],
                "stage": self.stage.name,
                "current_player": self.current_player,
                "dealer": self.dealer,
                "current_bet": self.current_bet,
                "total_bet": self.total_bet
            }
        else:
            self.data = data

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
            data_json = await (pipe.get(f"session:{session_id}").execute())
        data: dict = json.loads(data_json)
        return data
    
    # COMPLETE
    @classmethod
    async def get_session_by_uuid(cls, session_id: UUID4) -> Optional["Session"]:
        """get Session object by uuid

        Args:
            session_id (UUID4): Session object uuid 

        Returns:
            Session: Session object
        """        
        async with r.pipeline(transaction=True) as pipe:
            data_json = await (pipe.get(f"session:{session_id}").execute())
        data: dict = json.loads(data_json)
        if data == {}:
            return None
        players = [Player.create(data=user_data) for user_data in data["players"]]
        seats = [UUID(uuid) for uuid in data["seats"]]
        session = Session(uuid=data["id"],
                          max_players=data["max_players"],
                          small_blind=data["small_blind"],
                          big_blind=data["big_blind"],
                          players=players,
                          seats=seats,
                          status=SessionStatus[f"{data['status']}"],
                          stage=SessionStage[f"{data['stage']}"],
                          current_player=data["current_player"],
                          dealer=data["dealer"],
                          current_bet=data["current_bet"],
                          total_bet=data["total_bet"],
                          data=data)
        return session
    
    # COMPLETE
    @classmethod
    async def set_data(cls, session_id: UUID4, data_json: str) -> None:
        """set or override Session info

        Args:
            session_id (UUID4): Session object uuid data to override
            data_json (str): data json formatted
        """        
        async with r.pipeline(transaction=True) as pipe:
            await (pipe.set(f"session:{session_id}", data_json).execute())

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
        stage: Optional[SessionStage] = SessionStage.NULL,
        current_player: Optional[int] = None,
        dealer: Optional[int] = None,
        current_bet: Optional[float] = None,
        total_bet: Optional[float] = None,
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
            stage (Optional[SessionStage], optional): game stage(null, first, second, third, fourth). Defaults to SessionStage.NULL.
            current_player (Optional[int], optional): game current player(number of seat). Defaults to None.
            dealer (Optional[int], optional): current game dealer(number of seat). Defaults to None.
            current_bet (Optional[float], optional): game current bet. Defaults to None.
            total_bet (Optional[float], optional): game total bet. Defaults to None.
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
            current_player=current_player,
            dealer=dealer,
            current_bet=current_bet,
            total_bet=total_bet,
            data=data,
        )
        data_json = json.dumps(session.data)
        await cls.set_data(session_id=session.id, data_json=data_json)
        return session
    
    # COMPLETE
    @classmethod
    async def add_player(cls, player: Player, session_id: UUID4) -> bool:
        """add player into players_id_list of Session object with <session_id> uuid

        Args:
            player (Player): Player object
            session_id (UUID4): Session object uuid to add player into

        Returns:
            bool: True if added successfully, False if not
        """ 
        data = await cls.get_data_by_uuid(session_id=session_id)
        if len(data["players"]) < data["players"]:
            data["players"].append(player.__dict__())
            data_json = json.dumps(data)
            await cls.set_data(session_id=session_id, data_json=data_json)
            return True
        return False
    
    # COMPLETE
    # TODO maybe bug when 1 player
    @classmethod
    async def remove_player(cls, user_id: UUID4, session_id: UUID4) -> bool:
        """remove player from players_id_list of Session object with <session_id> uuid

        Args:
            user_id (UUID4): Player object uuid
            session_id (UUID4): Session object uuid to remove player from

        Returns:
            bool: True if removed successfully, False if not
        """    
        data = await cls.get_data_by_uuid(session_id=session_id)
        if not(str(user_id) in data["players"]):
            return False
        data["players"].remove(str(user_id))
        player_seat = data["seats"].index(str(user_id))
        seat_index = (player_seat + 1) % data["max_players"]
        next_player_seat = data["seats"][seat_index]
        while next_player_seat is None:
            seat_index = (seat_index + 1) % data["max_players"]
            next_player_seat = data["seats"][seat_index]
        if data["current_player"] == player_seat:
            data["current_player"] == next_player_seat
        if data["dealer"] == player_seat:
            data["dealer"] == next_player_seat
    
        data["seats"] = list(map(lambda x: x.replace(str(user_id), None), data["seats"]))
        data_json = json.dumps(data)
        await cls.set_data(session_id=session_id, data_json=data_json)
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
        data = {
                "id": str(self.id),
                "status": self.status.name,
                "seats": [str(seat) for seat in self.seats],
                "small_blind": self.small_blind,
                "big_blind": self.big_blind,
                "max_players": self.max_players,
                "players": [player.__dict__() for player in self.players],
                "stage": self.stage.name,
                "current_player": self.current_player,
                "dealer": self.dealer,
                "current_bet": self.current_bet,
                "total_bet": self.total_bet
            }
        data_json = json.dumps(data)
        await self.set_data(session_id=self.id, data_json=data_json)
    
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


class SessionsContainer:
    # COMPLETE
    def __init__(self) -> None:
        self.sessions: List[UUID4] = []
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

    # COMPLETE
    async def create_session(self, max_players: int = None) -> Session:
        """creates session and appends it in sessions_container

        Args:
            max_players (int, optional): session max players. Defaults to None.

        Returns:
            Session: created Session object
        """        
        session = await self.factory.create_session(max_players)
        self.sessions.append(session.id)
        return session

    # COMPLETE
    async def remove_session_by_uuid(self, uuid: UUID4) -> bool:
        """deletes Session object and removes it from sessions_container

        Args:
            uuid (UUID4): uuid of Session for deletion

        Returns:
            bool: True if deleted, False if not
        """
        flag = await Session.delete(session_id=uuid)
        if not flag:
            return False
        try:
            self.sessions.remove(uuid)
        except ValueError:
            return False

    # COMPLETE
    async def find_user_session(self, uuid: UUID4) -> Optional[Session]:
        """finds user's current session

        Args:
            uuid (UUID4): user uuid

        Returns:
            Optional[Session]: Session object that user playing in
        """
        for session_id in self.sessions:
            session = await Session.get_session_by_uuid(session_id=session_id)
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
    async def create_session(self, max_players: int = None):
        return await Session.create(max_players)
    

def create_factory() -> SessionFactory:
    return SessionFactory()


def create_session_container() -> SessionsContainer:
    return SessionsContainer()


sessions_container = create_session_container()