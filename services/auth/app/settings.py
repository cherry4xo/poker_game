import os
import random
import string
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

LOGIN_URL = "http://0.0.0.0:8083/poker_auth/login/access-token"
REFRESH_URL = "http://0.0.0.0:8083/poker_auth/login/refresh-token"

# ACCESS_TOKEN_EXPIRE_MINUTES = 15 
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 14 # change in release to 15 minutes
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 14 # 2 weeks

CORS_ORIGINS = ["*"]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["*"]
CORS_ALLOW_HEADERS = ["*"]