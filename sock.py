import json
from websocket import create_connection

uuid = "3cd158ff-72fc-4cee-b7f4-dadbed8991c3"

ws = create_connection(f"ws://0.0.0.0:8081/poker_game/game/{uuid}/cherry4xo")
data = {
    "type": "take_seat",
    "seat_num": 0
}
data_json = json.dumps(data)
ws.send(data_json)
print("sent")
print(ws.recv())
ws.close()