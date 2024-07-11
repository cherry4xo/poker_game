from typing import Optional

from fastapi.exceptions import HTTPException
from redis import Redis
from redis.asyncio import from_url
from redis.exceptions import ConnectionError

from app import settings


connection_url = f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}?decode_responses=True"

r = from_url(connection_url)

async def ping_redis_connection(r: Redis):
    try:
        await r.ping()
        print("Redis pinged. Successfully connected")    
    except ConnectionError:
        raise HTTPException(
            status_code=500,
            detail=f"Redis error: failed to connect to redis database with url {connection_url}"
        )