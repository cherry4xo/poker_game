import asyncio
import os
from app.provider import provider
import time
from apscheduler.schedulers.asyncio import AsyncIOScheduler

async def main():
    event_loop = asyncio.get_event_loop()
    scheduler = AsyncIOScheduler()
    scheduler.add_job(provider, 'interval', seconds=30, args=(event_loop,))
    scheduler.start()
    print('Press Ctrl+{0} to exit'.format('Break' if os.name == 'nt' else 'C'))
    while True:
        await asyncio.sleep(1000)

if __name__ == '__main__':
    # Execution will block here until Ctrl+C (Ctrl+Break on Windows) is pressed.
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        pass