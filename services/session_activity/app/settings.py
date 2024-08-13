import random
import string
import os
from dotenv import load_dotenv
load_dotenv()


BOOTSTRAP_SERVERS = ["sessions"]
TOPIC = "activity"

SESSION_TIMEOUT = 300
