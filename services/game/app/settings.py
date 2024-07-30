import random
import string
import os
from dotenv import load_dotenv
load_dotenv()

API_HOST = os.getenv("API_HOST")
API_PORT = os.getenv("API_PORT")

REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = os.getenv("REDIS_PORT")

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

DB_URL = f"postgres://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

DB_CONNECTIONS = {
        "default": DB_URL,
    }

SECRET_KEY = os.getenv("SECRET_KEY", default="".join([random.choice(string.ascii_letters) for _ in range(32)]))
CLIENT_ID = os.getenv("CLIENT_ID", default="".join([random.choice(string.ascii_letters) for _ in range(32)]))

LOGIN_URL = f"http://auth:8083/poker_auth/login/access-token"
WS_BASE_URL = f"ws://{API_HOST}:{API_PORT}/poker_game/game"

CORS_ORIGINS = ["*"]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["*"]
CORS_ALLOW_HEADERS = ["*"]

S3_KEY_ID = os.getenv("S3_KEY_ID")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
S3_REGION = os.getenv("S3_REGION")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME") 

DEFAULT_MAX_PLAYERS = 4
DEFAULT_START_BALANCE = 15000.0
DEFAULT_SMALL_BLIND = 10.0
DEFAULT_BIG_BLIND = 20.0