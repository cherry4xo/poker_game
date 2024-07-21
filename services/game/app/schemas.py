import uuid
from datetime import datetime, timedelta
from typing import Optional, List

from pydantic import BaseModel, UUID4, validator


class BaseProperties(BaseModel):
    @validator("uuid", pre=True, always=True, check_fields=False)
    def default_hashed_id(cls, v):
        return v or uuid.uuid4()


class SessionCreateOut(BaseModel):
    uuid: UUID4
    players_id_list: List[UUID4] = []


class JWTTokenPayload(BaseModel):
    user_uuid: UUID4 = None
    token_kind: str = None