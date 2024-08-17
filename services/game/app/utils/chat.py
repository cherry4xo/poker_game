import json
from datetime import datetime
from random import randint
from typing import List, Optional
from operator import is_not
from functools import partial
from enum import Enum
from uuid import uuid4, UUID
from copy import deepcopy

from pydantic import UUID4, BaseModel

from app.utils.redis import r, ping_redis_connection
from app.utils.player import Player
from app import settings


class UserMessage(BaseModel):
    player_id: UUID4
    username: str
    message: str
    timestamp: datetime = datetime.now()


class Message:
    def __init__(self, player_id: UUID4, username: str, message: str, timestamp: datetime = datetime.now()) -> None:
        self.player_id = player_id
        self.username = username
        self.message = message
        self.timestamp = timestamp

    def __str__(self) -> str:
        return f"{self.timestamp}::{self.player_id}::{self.username}::{self.message}"
    

class Chat:
    def __init__(self, session_id: UUID4) -> None:
        self.session_id = session_id

    async def send_message(self, message: UserMessage):
        message_data = message.__str__()
        async with r.pipeline(transaction=True) as pipe:
            (await (pipe.rpush(f"message:{self.session_id}", message_data).execute()))

    async def get_all_messages(self):
        async with r.pipeline(transaction=True) as pipe:
            messages = (await (pipe.lrange(f"message:{self.session_id}", 0, -1).execute()))[0]
            print(messages)
            message_objects = []
            for message in messages:
                message_str = message.split("::")
                message_obj = Message(player_id=UUID(message_str[1]),
                                      username=message_str[2],
                                      message=message_str[3],
                                      timestamp=datetime.fromisoformat(message_str[0]))
                message_objects.append(message_obj)
            return message_objects

    @property
    async def list(self) -> dict:
        messages = await self.get_all_messages()
        return [message.__str__() for message in messages]
        