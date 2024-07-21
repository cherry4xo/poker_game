import json
from datetime import datetime, timedelta

from fastapi import APIRouter, WebSocket
from pydantic import UUID4

from app.models import User
from app.utils.sessions import sessions_container
from app.schemas import SessionCreateOut


router = APIRouter()


@router.post("/game/create", response_model=SessionCreateOut, status_code=200)
async def create_session():
    session = sessions_container.create_session()
    return SessionCreateOut(uuid=session.id, players_id_list=session.players_id_list)


@router.websocket("/game/{uuid}")
async def websocket_endpoint(user_id: UUID4, websocket: WebSocket):
    await websocket.accept()
    session = await sessions_container.find_user_session(uuid=user_id)

