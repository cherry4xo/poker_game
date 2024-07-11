import json
from datetime import datetime, timedelta

from fastapi import APIRouter, WebSocket
from pydantic import UUID4

from app.models import User
from app.utils.sessions import Session


router = APIRouter()


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(user_id: UUID4, websocket: WebSocket):
    await websocket.accept()
    