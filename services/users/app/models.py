from typing import Optional
from datetime import date

from tortoise import fields
from tortoise.models import Model
from tortoise.exceptions import DoesNotExist
from pydantic import UUID4

from app.schemas import UserCreate
from app.utils import password


class User(Model):
    uuid = fields.UUIDField(unique=True, pk=True)
    username = fields.CharField(max_length=64, null=True)
    email = fields.CharField(max_length=64, null=True)
    password_hash = fields.CharField(max_length=255, null=True)
    registration_date = fields.DateField(auto_now_add=True)
    is_admin = fields.BooleanField(default=False)
    is_confirmed = fields.BooleanField(default=False)

    @classmethod
    async def get_by_email(cls, email: str) -> Optional["User"]:
        try:
            query = cls.get_or_none(email=email)
            user = await query
            return user
        except DoesNotExist:
            return None
        
    @classmethod
    async def get_by_uuid(cls, uuid: UUID4) -> Optional["User"]:
        try:
            query = cls.get_or_none(uuid=uuid)
            user = await query
            return user
        except DoesNotExist:
            return None
        
    @classmethod
    async def create(cls, user: UserCreate) -> "User":
        user_dict = user.model_dump(exclude=["password"])
        password_hash = password.get_password_hash(password=user.password)
        model = cls(**user_dict, password_hash=password_hash, registration_date=date.today())
        await model.save()
        return model

    async def to_dict(self):
        d = {}
        for field in self._meta.db_fields:
            d[field] = getattr(self, field)
        for field in self._meta.backward_fk_fields:
            d[field] = await getattr(self, field).all().values()
        return d

    class Meta:
        table = "users"