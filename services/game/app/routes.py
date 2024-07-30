import json
from typing import Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, WebSocket, Depends
from fastapi.responses import RedirectResponse
from fastapi.exceptions import WebSocketException
from pydantic import UUID4

from app.models import User
from app.schemas import SessionCreateOut
from app.utils.sessions import sessions_container, Session, Player
from app.utils.contrib import decode_jwt
from app.utils.broadcast import Broadcaster

from app import settings


router = APIRouter()


@router.post("/create", response_model=SessionCreateOut, status_code=200)
async def create_session(
    user: User = Depends(decode_jwt)
):
    session: Optional[Session] = await sessions_container.find_user_session(uuid=user.uuid)
    if session is not None:
        return SessionCreateOut(uuid=session.id, players_id_list=session.players_id_list)
    session = sessions_container.create_session()
    return SessionCreateOut(uuid=session.id, players_id_list=session.players_id_list)
    

@router.websocket("/{uuid}")
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
    player = Player(uuid=user.uuid, name=user.username, websocket=websocket)
    await session.add_player(player=player)
    while True:
        data_json = await websocket.receive_json()
        data = json.loads(data_json)
        if data["type"] == "take_seat":
            ans = await session.take_seat(user.uuid, seat_num=data["seat_num"])
            await session.send_personal_message(user.uuid, ans)
        if data["type"] == "start":
            ans = await session.start_game()
            await session.send_all_data(ans)
        if data["type"] == "bet":
            ans = await session.bet(user_id=user.uuid, value=data["value"])
            await session.send_all_data(ans)