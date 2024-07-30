import json
from typing import List, Optional, TYPE_CHECKING

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, WebSocketException
from fastapi.exceptions import HTTPException
from pydantic import UUID4

from app.utils.player import Player


class Broadcaster:
    def __init__(self, players: List[Player] = []):
        self.players: List[Player] = players

    def get_player(self, player_id: UUID4) -> Optional[Player]:
        for player in self.players:
            if player.id == player_id:
                return player
        return None

    async def connect_player(self, player: Player) -> None:
        data = {
            "type": "connect",
            "player_data": player.__dict__
        }
        data_json = json.dumps(data, default=str)
        for player in self.players:
            await player.websocket.send_json(data=data_json)

    async def disconnect_player(self, player: Player) -> None:
        data = {
            "type": "disconnect",
            "player_data": player.__dict__
        }
        data_json = json.dumps(data, default=str)
        for player in self.players:
            await player.websocket.send_json(data=data_json)

    async def send_all_data(self, data: dict) -> None:
        data_json = json.dumps(data, default=str)
        for player in self.players:
            await player.websocket.send_json(data=data_json)

    async def send_personal_message(self, player_id: UUID4, data: dict):
        player = self.get_player(player_id=player_id)
        data_json = json.dumps(data, default=str)
        await player.websocket.send_json(data_json)