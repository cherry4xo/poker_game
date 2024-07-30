import json
from websocket import create_connection

uuid = "0cce9c6e-62c8-4a2f-8c6d-8f40a32c51db"

ws = create_connection(f"ws://0.0.0.0:8081/poker_game/game/{uuid}/cherry4xo1")
ws2 = create_connection(f"ws://0.0.0.0:8081/poker_game/game/{uuid}/cherry4xo1")

print(ws.recv())
print(ws2.recv())

data = {
    "type": "take_seat",
    "seat_num": 0
}
data_json = json.dumps(data)
ws.send(data_json)
print(ws.recv())
data = {
    "type": "take_seat",
    "seat_num": 1
}
data_json = json.dumps(data)
ws2.send(data_json)
print(ws2.recv())


data = {
    "type": "start"
}
data_json = json.dumps(data)
ws.send(data_json)
print(ws.recv())
ws.close()