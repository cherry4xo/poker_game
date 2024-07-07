import uuid
from typing import Optional
from datetime import date, datetime

from pydantic import BaseModel, validator, UUID4, EmailStr


class BaseProperties(BaseModel):
    @validator("uuid", pre=True, always=True, check_fields=False)
    def default_hashed_id(cls, v):
        return v or uuid.uuid4()


class BaseUser(BaseProperties):
    uuid: Optional[UUID4] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    registration_date: Optional[date] = None
    is_admin: Optional[bool] = None


class UserCreate(BaseProperties):
    username: str
    email: EmailStr
    password: str


class UserOut(BaseUser):
    uuid: UUID4
    username: str
    email: EmailStr
    registration_date: date
    is_admin: bool


class JWTTokenPayload(BaseModel):
    user_uuid: UUID4 = None
    token_kind: str = None


class UserChangePasswordIn(BaseModel):
    current_password: str
    new_password: str


class UserBaseSendConfirmCode(BaseProperties):
    user_id: UUID4
    email: EmailStr
    time: datetime


class UserBaseConfirmed(BaseProperties):
    user_id: UUID4
    email: EmailStr
    is_comfirmed: bool


class UserBaseConfirmCode(BaseModel):
    code: str


class UserBaseResetLetterIn(BaseModel):
    email: EmailStr


class UserBaseResetLetterSent(BaseModel):
    email: EmailStr
    time: datetime


class UserBaseResetConfirm(BaseModel):
    email: EmailStr
    code: str


class UserBaseResetConfirmed(BaseModel):
    email: EmailStr


class UserBaseResetPasswordIn(BaseModel):
    email: EmailStr
    password: str


class UserBaseResetPasswordOut(BaseModel):
    user_id: UUID4


class UserBaseChangeEmailIn(BaseModel):
    email: EmailStr