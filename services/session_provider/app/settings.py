import os
from dotenv import load_dotenv
load_dotenv()

REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = os.getenv("REDIS_PORT")

KAFKA_BOOTSTRAP_SERVICE = os.getenv("KAFKA_BOOTSTRAP_SERVICES")
PRODUCE_TOPIC = os.getenv("PRODUCE_TOPIC")
DEFAULT_SESSION_DELAY_MINUTES = os.getenv("DEFAULT_SESSION_DELAY_MINUTES") * 60