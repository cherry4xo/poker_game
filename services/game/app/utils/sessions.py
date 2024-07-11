from typing import List
from uuid import uuid4

from pydantic import UUID4


class AbstractSessionFactory(object):
    def create_session(self):
        raise NotImplementedError()
    

class SessionsContainer:
    def __init__(self) -> None:
        self.sessions: List[Session] = []
        self.factory: SessionFactory = create_factory()

    def create_session(self) -> None:
        self.sessions.append(self.factory.create_session())

    def remove_session_by_uuid(self, uuid: UUID4) -> bool:
        for session in self.sessions:
            if session.session_id == uuid:
                self.sessions.remove(session)
                return True
        return False


class Session:
    def __init__(self, user_id_list: list[UUID4] = None) -> None:
        user_id_list = user_id_list or []
        self.session_id: UUID4 = uuid4()
        self.players_id_list: List[UUID4] = user_id_list

    def add_player(self, user_id: UUID4) -> None:
        self.players_id_list.append(user_id)
    
    def remove_player(self, user_id: UUID4) -> None:
        self.players_id_list.remove(user_id)


class SessionFactory(AbstractSessionFactory):
    def create_session(self):
        return Session([])
    

def create_factory() -> SessionFactory:
    return SessionFactory()


def create_session_container() -> SessionsContainer:
    return SessionsContainer()