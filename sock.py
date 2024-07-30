from websocket import create_connection

uuid = "d90e92e0-796b-49cb-9a1c-918d3af73f4b"

ws = create_connection(f"ws://0.0.0.0:8081/poker_game/game/{uuid}/cherry4xo")
print(ws.recv())
print("Hello")
ws.send("data")
ws.close()