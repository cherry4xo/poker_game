import json
from typing import List, Optional
from uuid import uuid4

from fastapi import WebSocket
from pydantic import UUID4

from app.utils.redis import r, ping_redis_connection
from app import settings


class Player:
    def __init__(self, uuid: UUID4, name: str, balance: float = None) -> None:
        self.id = uuid4()
        self.name = name
        self.balance = balance or settings.DEFAULT_START_BALANCE
        self.hand = []
        self.currentbet = 0
        self.handscore = 0

    @classmethod
    async def create(cls, data: dict) -> "Player":
        player = Player(uuid=data["id"],
                        name=data["name"],
                        balance=data["balance"])
        player.hand = data["hand"]
        player.currentbet = data["currentbet"]
        player.handscore = data["handscore"]
        return player

    def __dict__(self) -> dict:
        data = {
            "id": self.id,
            "name": self.name,
            "balance": self.balance,
            "hand": self.hand,
            "currentbet": self.currentbet,
            "handscore": self.handscore
        }
        return data


class AbstractSessionFactory(object):
    def create_session(self):
        raise NotImplementedError()


class Session:
    def __init__(self, 
                 uuid: UUID4, 
                 max_players: int = None, 
                 user_id_list: list[Player] = None, 
                 data: dict = None) -> None:
        user_id_list = user_id_list or []
        max_players = max_players or settings.DEFAULT_MAX_PLAYERS
        self.id: UUID4 = uuid
        self.max_players = max_players
        self.players_id_list: List[Player] = user_id_list
        self.data: dict = {} or data

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
        players = [Player.create(data=user_data) for user_data in data["players_id_list"]]
        session = Session(uuid=data["id"], 
                          max_players=data["max_players"],
                          user_id_list=players,
                          data=data)
        return session
    
    @classmethod
    async def set_data(cls, session_id: UUID4, data_json: str) -> None:
        """set or override Session info

        Args:
            session_id (UUID4): Session object uuid data to override
            data_json (str): data json formatted
        """        
        async with r.pipeline(transaction=True) as pipe:
            await (pipe.set(f"session:{session_id}", data_json).execute())

    @classmethod
    async def create(cls, max_players: int = None, user_list: list[Player] = None) -> "Session":
        """create new Session object

        Args:
            max_players (int, optional): max players in Session. Defaults to None.
            user_list (list[Player], optional): Session objects players if exist. Defaults to None.

        Returns:
            Session: created Session object
        """        
        session_id = str(uuid4())
        session = cls(uuid=session_id, max_players=max_players, user_id_list=user_list)
        user_list: list[Player] = user_list or []
        max_players = max_players or settings.DEFAULT_MAX_PLAYERS
        # self.id: UUID4 = uuid4()
        # self.players_id_list: List[UUID4] = user_id_list
        data = {
            "id": session_id,
            "max_players": max_players,
            "players_id_list": [user.__dict__() for user in user_list]
        }
        data_json = json.dumps(data)
        await cls.set_data(session_id, data_json)
        return session

    @classmethod
    async def add_player(cls, user: Player, session_id: UUID4) -> bool:
        """add player into players_id_list of Session object with <session_id> uuid

        Args:
            user (Player): Player object
            session_id (UUID4): Session object uuid to add player into

        Returns:
            bool: True if added successfully, False if not
        """        
        data = await cls.get_data_by_uuid(session_id)
        if len(data["players_id_list"]) < data["max_players"]:
            data["players_id_list"].append(user.__dict__())
            data_json = json.dumps(data)
            await cls.set_data(session_id, data_json)
            return True
        return False
    
    @classmethod
    async def remove_player(cls, user_id: UUID4, session_id: UUID4) -> bool:
        """remove player from players_id_list of Session object with <session_id> uuid

        Args:
            user_id (UUID4): Player object uuid
            session_id (UUID4): Session object uuid to remove player from

        Returns:
            bool: True if removed successfully, False if not
        """        
        data = await cls.get_data_by_uuid(session_id)
        for user in data["players_id_list"]:
            if user["id"] == user_id:
                data["players_id_list"].remove(user)
                data_json = json.dumps(data)
                await cls.set_data(session_id, data_json)
                return True
        return False
    
    async def save(self) -> None:
        """accept changes in Session object data
        """        
        data = {
            "id": self.id,
            "max_players": self.max_players,
            "players_id_list": [user.__dict__() for user in self.players_id_list]
        }
        data_json = json.dumps(data)
        await self.set_data(session_id=self.id, data_json=data_json)
    
    def add_player(self, user: Player) -> bool:
        """add player into current session

        Args:
            user (Player): Player object

        Returns:
            bool: True if added successfully, False if not
        """        
        if len(self.players_id_list) < self.max_players:
            self.players_id_list.append(user)
            return True
        return False

    def remove_player(self, user_id: UUID4) -> bool:
        """remove player from current session

        Args:
            user_id (UUID4): Player object uuid

        Returns:
            bool: True if removed successfully, False if not
        """        
        for player in self.players_id_list:
            if player.id == user_id:
                self.players_id_list.remove(player)
                return True
        return False


class SessionsContainer:
    def __init__(self) -> None:
        self.sessions: List[UUID4] = []
        self.factory: SessionFactory = create_factory()

    async def find_session_by_uuid(self, session_id: UUID4) -> Optional[Session]:
        """finds session by its uuid

        Args:
            session_id (UUID4): sought session uuid

        Returns:
            Optional[Session]: Session object with <session_id> if exists
        """
        session = await Session.get_session_by_uuid(session_id=session_id)
        return session

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

    async def remove_session_by_uuid(self, uuid: UUID4) -> bool:
        """deletes Session object and removes it from sessions_container

        Args:
            uuid (UUID4): uuid of Session for deletion

        Returns:
            bool: True if deleted, False if not
        """
        try:
            self.sessions.remove(uuid)
            return True
        except ValueError:
            return False

    async def find_user_session(self, uuid: UUID4) -> Optional[Session]:
        """finds user's current session

        Args:
            uuid (UUID4): user uuid

        Returns:
            Optional[Session]: Session object that user playing in
        """
        for session_id in self.sessions:
            session = await Session.get_session_by_uuid(session_id=session_id)
            for player in session.players_id_list:
                if player.id == uuid:
                    return session
        return None
    
    async def get_session_by_uuid(self, uuid: UUID4) -> Optional[Session]:
        """find and get Session object by its uuid

        Args:
            uuid (UUID4): sought Session object uuid

        Returns:
            Optional[Session]: Session object if exists
        """        
        return await Session.get_session_by_uuid(session_id=uuid)
    
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
        session = await self.get_session_by_uuid(uuid=session_id)
        player = Player(uuid=user_id)
        return session.add_player(player)


class SessionFactory(AbstractSessionFactory):
    async def create_session(self, max_players: int = None):
        return await Session.create(max_players)
    

def create_factory() -> SessionFactory:
    return SessionFactory()


def create_session_container() -> SessionsContainer:
    return SessionsContainer()


sessions_container = create_session_container()