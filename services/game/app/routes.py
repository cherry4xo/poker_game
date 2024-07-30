import json
from typing import Optional
from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, WebSocket, Depends, WebSocketDisconnect
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
        return SessionCreateOut(uuid=session.id, players_id_list=session.players)
    session = await sessions_container.create_session()
    return SessionCreateOut(uuid=session.id, players_id_list=session.players)
    

@router.websocket("/{session_id}")
async def webscoket_endpoint(
    session_id: UUID4, 
    username: str,
    websocket: WebSocket
    # user: User = Depends(decode_jwt)
):
    user_id = uuid4()
    session: Optional[Session] = await sessions_container.get_session(session_id=session_id)
    if session is None:
        raise WebSocketException(
            code=1007,
            reason="The session with this uuid does not exist"
        )
    # if session.id != session_id:
    #     return RedirectResponse(f"{settings.WS_BASE_URL}/{session.id}")
    print(username, session_id, websocket)
    await websocket.accept()
    player = Player(uuid=user_id, name=username, websocket=websocket)
    await session.add_player(player=player)
    try:
        while True:
            data_json = await websocket.receive_json()
            data = json.loads(data_json)
            if data["type"] == "take_seat":
                ans = await session.take_seat(user_id, seat_num=data["seat_num"])
                await session.send_personal_message(user_id, ans)
            if data["type"] == "start":
                ans = await session.start_game()
                await session.send_all_data(ans)
            if data["type"] == "bet":
                ans = await session.bet(user_id=user_id, value=data["value"])
                await session.send_all_data(ans)
    except WebSocketDisconnect:
        await session.disconnect_player(player=player)
        await session.remove_player(player.id)