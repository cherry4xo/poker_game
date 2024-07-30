from websocket import create_connection

ws = create_connection("wss://0.0.0.0:8081/poker_game/game/1e837479-7c0c-4b2f-bd27-0641e234906f",
                       header={"username": "cherry4xo"})
print(ws.recv())
print("Hello")
ws.send("data")
ws.close()