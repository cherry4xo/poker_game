import json
from typing import List, Optional
from uuid import uuid4

from fastapi import WebSocket
from pydantic import UUID4

from app.utils.redis import r, ping_redis_connection
from app import settings


class Player:
    def __init__(self, websocket: WebSocket, uuid: UUID4, name: str, balance: float = None) -> None:
        self.id = uuid4
        self.name = name
        self.balance = balance or settings.DEFAULT_START_BALANCE
        self.hand = []
        self.currentbet = 0
        self.handscore = 0
        self.websocket = websocket


class AbstractSessionFactory(object):
    def create_session(self):
        raise NotImplementedError()


class Session:
    # def __init__(self, max_players: int = None, user_id_list: list[UUID4] = None) -> None:
    #     session_id = str(uuid4())
    #     user_id_list = user_id_list or []
    #     max_players = max_players or settings.DEFAULT_MAX_PLAYERS
    #     # self.id: UUID4 = uuid4()
    #     # self.players_id_list: List[UUID4] = user_id_list
    #     data = {
    #         "id": session_id,
    #         "max_players": max_players,
    #         "players_id_list": user_id_list
    #     }

    #     async with r.pipeline(transaction=True) as pipe:
    #         pipe.set(f"session:{session_id}", data)
    @classmethod
    async def get_data_by_uuid(cls, session_id: UUID4) -> dict:
        async with r.pipeline(transaction=True) as pipe:
            data_json = await (pipe.get(f"session:{session_id}").execute())
        data: dict = json.loads(data_json)
        return data
    
    @classmethod
    async def set_data(cls, session_id: UUID4, data_json: str) -> None:
        async with r.pipeline(transaction=True) as pipe:
            await (pipe.set(f"session:{session_id}", data_json).execute())

    @classmethod
    async def create(cls, max_players: int = None, user_id_list: list[UUID4] = None) -> dict:
        session_id = str(uuid4())
        user_id_list = user_id_list or []
        max_players = max_players or settings.DEFAULT_MAX_PLAYERS
        # self.id: UUID4 = uuid4()
        # self.players_id_list: List[UUID4] = user_id_list
        data = {
            "id": session_id,
            "max_players": max_players,
            "players_id_list": user_id_list
        }
        data_json = json.dumps(data)
        await cls.set_data(session_id, data_json)
        return data_json

    @classmethod
    async def add_player(cls, user_id: UUID4, session_id: UUID4) -> bool:
        data = await cls.get_data_by_uuid(session_id)
        if len(data["players_id_list"]) < data["max_players"]:
            data["players_id_list"].append(str(user_id))
            data_json = json.dumps(data)
            await cls.set_data(session_id, data_json)
            return True
        return False
    
    @classmethod
    async def remove_player(cls, user_id: UUID4, session_id: UUID4) -> bool:
        data = await cls.get_data_by_uuid(session_id)
        if str(user_id) in data["players_id_list"]:
            data["players_id_list"].remove(user_id)
            data_json = json.dumps(data)
            await cls.set_data(session_id, data_json)
            return True
        return False


class SessionsContainer:
    def __init__(self) -> None:
        self.sessions: List[Session] = []
        self.factory: SessionFactory = create_factory()

    def create_session(self, max_players: int = None) -> Session:
        session = self.factory.create_session(max_players)
        self.sessions.append()
        return session

    def remove_session_by_uuid(self, uuid: UUID4) -> bool:
        for session in self.sessions:
            if session.id == uuid:
                self.sessions.remove(session)
                return True
        return False
    
    def find_user_session(self, uuid: UUID4) -> Optional[Session]:
        for session in self.sessions:
            if uuid in session.players_id_list:
                return session
        return None
    
    def get_session_by_uuid(self, uuid: UUID4) -> Optional[Session]:
        for session in self.sessions:
            if uuid in session.id:
                return session
        return None
    
    def add_user(self, user_id: UUID4, session_id: UUID4) -> bool:
        if self.find_user_session(user_id) is not None:
            return False
        session = self.get_session_by_uuid(session_id)
        return session.add_player(user_id)


class SessionFactory(AbstractSessionFactory):
    def create_session(self, max_players: int = None):
        return Session(max_players)
    

def create_factory() -> SessionFactory:
    return SessionFactory()


def create_session_container() -> SessionsContainer:
    return SessionsContainer()


sessions_container = create_session_container()