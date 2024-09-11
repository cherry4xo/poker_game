import json
from typing import Optional
from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, WebSocket, Depends, WebSocketDisconnect
from fastapi.responses import RedirectResponse
from fastapi.exceptions import WebSocketException, HTTPException
from pydantic import UUID4

from app.models import User
from app.schemas import SessionCreateOut
from app.utils.sessions import sessions_container, Session, Player
from app.utils.contrib import decode_jwt

from app import settings


router = APIRouter()


@router.get("/validate", status_code=200)
async def validate_access_token(
    user: User = Depends(decode_jwt)
):
    user_data = await user.to_dict()
    session = await sessions_container.find_user_session(uuid=user.uuid)
    session_data = {"session_id": session.id if session is not None else None}
    user_data.update(session_data)
    return user_data


@router.post("/create", response_model=SessionCreateOut, status_code=200)
async def create_session(
    user: User = Depends(decode_jwt)
):
    session: Optional[Session] = await sessions_container.find_user_session(uuid=user.uuid)
    if session is not None:
        return SessionCreateOut(uuid=session.id, players_id_list=[player.id for player in session.players])
    session = await sessions_container.create_session(max_players=settings.DEFAULT_MAX_PLAYERS, owner=user.uuid)
    return SessionCreateOut(uuid=session.id, players_id_list=[player.id for player in session.players])


@router.post("/join/{session_id}", status_code=200)
async def player_join_game(
    session_id: UUID4,
    user: User = Depends(decode_jwt)
):
    session: Optional[Session] = await sessions_container.find_user_session(uuid=user.uuid)
    if session is not None:
        return session.id
    session: Optional[Session] = sessions_container.get_session(session_id=session_id)
    if session is None:
        raise HTTPException(
            status_code=404,
            detail="The session with this id does not exist"
        )
    player = Player(uuid=user.uuid, name=user.username, websocket=None)
    await session.add_player(player=player)
    

@router.websocket("/{token}")
async def webscoket_endpoint(
    token: str,
    websocket: WebSocket
):
    await websocket.accept()
    user: User = await decode_jwt(token=token)
    user_id = user.uuid
    username = user.username
    session = await sessions_container.get_session_by_user_id(uuid=user_id)
    if session is None:
        raise WebSocketException(
            code=1007,
            reason="The session with this uuid does not exist"
        )
    player = session.get_player(player_id=user_id)
    if player is not None:
        player.websocket = websocket
        await session.send_all_data(session.data)
        chat_history = await session.get_all_messages()
        await session.send_personal_message(player_id=player.id, data=chat_history)
    else:
        player = Player(uuid=user_id, name=username, websocket=websocket)
        await session.add_player(player=player)
        chat_history = await session.get_all_messages()
        await session.send_personal_message(player_id=player.id, data=chat_history)
    try:
        while True:
            data = await websocket.receive_json()
            if data["type"] == "take_seat":
                ans = await session.take_seat(user_id, seat_num=data["seat_num"])
                await session.send_all_data(session.data)
            elif data["type"] == "start":
                ans = await session.start_game()
                if ans["type"] == "success":
                    data = {}
                    data.update(session.data)
                    data.update({"allowed_actions": ans["allowed_actions"]})
                    await session.send_all_data(data)
                else:
                    await session.send_all_data(ans)
            elif data["type"] == "bet":
                ans = await session.bet(player_id=user_id, value=data["value"])
                if ans["type"] == "success":
                    data = {}
                    data.update(session.data)
                    data.update({"allowed_actions": ans["allowed_actions"]})
                    await session.send_all_data(data)
                else:
                    await session.send_all_data(ans)
            elif data["type"] == "call":
                ans = await session.call(player_id=user_id)
                if ans["type"] == "success":
                    data = {}
                    data.update(session.data)
                    data.update({"allowed_actions": ans["allowed_actions"]})
                    await session.send_all_data(data)
                else:
                    await session.send_all_data(ans)
            elif data["type"] == "raise":
                ans = await session.raise_bet(player_id=user_id, value=data["value"])
                if ans["type"] == "success":
                    data = {}
                    data.update(session.data)
                    data.update({"allowed_actions": ans["allowed_actions"]})
                    await session.send_all_data(data)
                else:
                    await session.send_all_data(ans)
            elif data["type"] == "pass":
                ans = await session.pass_board(player_id=user_id)
                if ans["message"] == "ends":
                    data = {}
                    data.update(session.data)
                    data.update({"winners": ans["winners"]})
                    await session.send_all_data(data)
                else:
                    data = {}
                    if ans["type"] == "success":
                        data = {}
                        data.update(session.data)
                        data.update({"allowed_actions": ans["allowed_actions"]})
                        await session.send_all_data(data)
                    else:
                        await session.send_all_data(ans)
            elif data["type"] == "check":
                ans = await session.check(player_id=user_id)
                if ans["message"] == "ends":
                    data = {}
                    data.update(session.data)
                    data.update({"winners": ans["winners"]})
                    await session.send_all_data(data)
                else:
                    data = {}
                    if ans["type"] == "success":
                        data = {}
                        data.update(session.data)
                        data.update({"allowed_actions": ans["allowed_actions"]})
                        await session.send_all_data(data)
                    else:
                        await session.send_all_data(ans)
            elif data["type"] == "root":
                ans = await session.get_winners()
                await session.send_all_data({"winners": ans})
            elif data["type"] == "exit":
                ans = await session.remove_player(player.id)
                await session.send_all_data(session.data)
                await websocket.close(code=1000)
                break
            elif data["type"] == "new_message":
                ans = await session.send_chat_message(player_id=user_id, message=data["message"])
                await session.send_all_data(ans)
            elif data["type"] == "typing_start":
                data = {
                    "type": "typing_start",
                    "id": player.id
                }
                await session.send_all_data(data)
            elif data["type"] == "typing_end":
                data = {
                    "type": "typing_end",
                    "id": player.id
                }
                await session.send_all_data(data)
    except WebSocketDisconnect:
        player.websocket = None
        await session.send_all_data(session.data)
