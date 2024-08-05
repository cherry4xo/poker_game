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
    return SessionCreateOut(uuid=session.id, players_id_list=[player.id for player in session.players])
    

@router.websocket("/{session_id}/{username}")
async def webscoket_endpoint(
    session_id: UUID4, 
    username: str,
    websocket: WebSocket
    # user: User = Depends(decode_jwt)
):
    user_id = uuid4()
    session: Optional[Session] = sessions_container.get_session(session_id=session_id)
    if session is None:
        raise WebSocketException(
            code=1007,
            reason="The session with this uuid does not exist"
        )
    # if session.id != session_id:
    #     return RedirectResponse(f"{settings.WS_BASE_URL}/{session.id}")
    await websocket.accept()
    player = Player(uuid=user_id, name=username, websocket=websocket)
    await session.add_player(player=player)
    try:
        while True:
            data = await websocket.receive_json()
            # data = json.loads(data_json)
            if data["type"] == "take_seat":
                ans = await session.take_seat(user_id, seat_num=data["seat_num"])
                # await session.send_personal_message(user_id, ans)
                await session.send_all_data(session.data)
            if data["type"] == "start":
                ans = await session.start_game()
                await session.send_all_data(session.data)
            if data["type"] == "bet":
                ans = await session.bet(player_id=user_id, value=data["value"])
                await session.send_all_data(session.data)
            if data["type"] == "call":
                ans = await session.call(player_id=user_id)
                await session.send_all_data(session.data)
            if data["type"] == "raise":
                ans = await session.raise_bet(player_id=user_id, value=data["value"])
                await session.send_all_data(session.data)
            if data["type"] == "pass":
                ans = await session.pass_board(player_id=user_id)
                await session.send_all_data(session.data)
            if data["type"] == "check":
                ans = await session.check(player_id=user_id)
                if ans["message"] == "ends":
                    data = {}
                    data.update(session.data)
                    data.update({"winners": ans["winners"]})
                    await session.send_all_data(data)
                else:
                    await session.send_all_data(session.data)
            if data["type"] == "root":
                ans = await session.get_winners()
                print(ans)
                await session.send_all_data({"winners": ans})
    except WebSocketDisconnect:
        await session.remove_player(player.id)
