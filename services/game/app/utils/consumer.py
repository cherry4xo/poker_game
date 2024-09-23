from aiokafka import AIOKafkaConsumer
from app import settings

async def start_consumer() -> AIOKafkaConsumer:
    consumer = AIOKafkaConsumer(
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVICE,
    )
    consumer.subscribe([settings.CONSUME_TOPIC])
    await consumer.start()
    return consumer