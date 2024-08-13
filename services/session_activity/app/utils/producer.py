from typing import List, Optional
import asyncio
from aiokafka import AIOKafkaProducer

from app import settings


class Producer:
    def __init__(self) -> None:
        self.bootstrap_servers = settings.BOOTSTRAP_SERVERS
        self.topic = settings.TOPIC
        self.producer = None

    async def start(self) -> None:
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.bootstrap_servers
        )
        await self.producer.start()

    async def stop(self) -> None:
        await self.producer.stop()

    async def produce_message(self, message: str) -> None:
        await self.producer.send_and_wait(self.topic, message.encode("utf-8"))
        print(f"Produced message: {message}")

    async def produce_messages(self, messages: List[str] = [], delay: int = 1) -> None:
        for message in messages:
            await self.produce_message(message=message)
            await asyncio.sleep(delay)


producer = Producer()