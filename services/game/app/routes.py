import json
from typing import Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, WebSocket, Depends
from fastapi.responses import RedirectResponse
from fastapi.exceptions import WebSocketException
from pydantic import UUID4

from app.models import User
from app.utils.sessions import sessions_container, Session
from app.schemas import SessionCreateOut
from app.utils.contrib import decode_jwt

from app import settings


router = APIRouter()


@router.post("/game/create", response_model=SessionCreateOut, status_code=200)
async def create_session(
    user: User = Depends(decode_jwt)
):
    session: Optional[Session] = await sessions_container.find_user_session(uuid=user.uuid)
    if session is not None:
        return SessionCreateOut(uuid=session.id, players_id_list=session.players_id_list)
    session = sessions_container.create_session()
    return SessionCreateOut(uuid=session.id, players_id_list=session.players_id_list)
    

@router.websocket("/game/{uuid}")
async def webscoket_endpoint(
    session_id: UUID4, 
    websocket: WebSocket,
    user: User = Depends(decode_jwt)
):
    session: Optional[Session] = await sessions_container.find_user_session(uuid=user.uuid)
    if session is None:
        raise WebSocketException(
            code=1007,
            reason="The session with this uuid does not exist"
        )
    if session.id != session_id:
        return RedirectResponse(f"{settings.WS_BASE_URL}/{session.id}")
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Message: {data}")
    