import json
import asyncio
from datetime import datetime

from app.utils.producer import get_producer, AIOProducer
from app.utils.redis import r, ping_redis_connection
from app import settings


async def provider(event_loop):
    producer = get_producer(event_loop=event_loop)
    await ping_redis_connection(r)
    async with r.pipeline(transaction=True) as pipe:
        keys = (await (pipe.keys("session:*").execute()))[0]
        for key in keys:
            data_json = (await (pipe.get(key).execute()))[0]
            data_now = datetime.now().timestamp()
            data: dict = json.loads(data_json)
            if data_now - data["last_activity"] > settings.DEFAULT_SESSION_DELAY_MINUTES:
                message_to_produce = {"type": "delete_session", "uuid": data["id"]}
                message_to_produce = json.dumps(message_to_produce).encode(encoding="utf-8")
                await producer.send(value=message_to_produce)