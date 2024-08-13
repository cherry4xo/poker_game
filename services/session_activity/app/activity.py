from typing import List
from datetime import datetime, timedelta
import asyncio

from app.utils.producer import producer
from app.utils.redis import r, ping_redis_connection
from app.utils.messages import delete_message
from app import settings


async def check_for_inactive_sessions() -> None:
    await producer.start()
    async with r.pipeline(transaction=True) as pipe:
        session_keys: List[str] = (await (pipe.keys().execute()))
        for session_key in session_keys:
            session_id = session_key.split(":")[1]
            session = (await (pipe.get(f"{session_key}").execute()))[0]
            last_activity = datetime.fromisoformat(session["last_activity"])
            delta = datetime.now() - last_activity
            if delta > timedelta(seconds=settings.SESSION_TIMEOUT):
                await producer.produce_message(message=delete_message(id=session_id))

