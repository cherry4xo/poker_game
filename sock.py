from websocket import create_connection

ws = create_connection("wss://api.cherry4xo.ru/poker_game/game/")
print(ws.recv())
print("Hello")
ws.send("data")
ws.close()