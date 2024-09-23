from aiokafka import AIOKafkaProducer
from app import settings
import asyncio


class Singleton(type):
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]


class AIOProducer(metaclass=Singleton):
    def __init__(self, event_loop):
        self.__producer = AIOKafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVICE,
            loop=event_loop
        )
        self.__produce_topic = settings.PRODUCE_TOPIC

    async def start(self) -> None:
        await self.__producer.start()

    async def stop(self) -> None:
        await self.__producer.stop()

    async def send(self, value: bytes) -> None:
        await self.start()
        try:
            await self.__producer.send(
                topic=self.__produce_topic,
                value=value
            )
            # await self.stop()
        except Exception as e:
            print(f"Sending error: {e}")
        # finally:
        #     await self.stop()


def get_producer(event_loop) -> AIOProducer:
    return AIOProducer(event_loop=event_loop)