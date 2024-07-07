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

LOGIN_URL = f"http://auth:8083/login/access-token"

CORS_ORIGINS = ["*"]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["*"]
CORS_ALLOW_HEADERS = ["*"]

EMAIL = os.getenv("EMAIL")
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = os.getenv("SMTP_PORT")
SMTP_LOGIN = os.getenv("SMTP_LOGIN")
SMTP_PWD = os.getenv("SMTP_PWD")

EMAIL_CONFIRMATION_CODE_EXPIRE_DELTA = 60 * 15

S3_KEY_ID = os.getenv("S3_KEY_ID")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
S3_REGION = os.getenv("S3_REGION")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME") 