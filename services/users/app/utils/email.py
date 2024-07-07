from typing import Optional, List
from datetime import datetime

from smtplib import SMTP_SSL as SMTP
from email.mime.text import MIMEText
from random import randint

from fastapi.exceptions import HTTPException
from pydantic import UUID4

from app.models import User
from app.utils.redis import r, ping_redis_connection

from app import settings


def generate_digits_code(length: int) -> str:
    return "".join([f"{randint(0, 9)}" for _ in range(length)])


#TODO decompose this shit idiot
async def send_confirmation_letter(to: str, user_id: UUID4, subject: str, text: str, confirmation_type: str):
    try:
        digits = generate_digits_code(6)
        msg = MIMEText(f"{text}: {digits}")

        msg["Subject"] = subject
        msg["From"] = settings.EMAIL
        msg["To"] = to

        conn = SMTP(
            host=settings.SMTP_HOST,
            port=settings.SMTP_PORT
        )
        conn.set_debuglevel(False)
        conn.login(settings.SMTP_LOGIN, settings.SMTP_PWD)
        try:
             conn.sendmail(settings.EMAIL, to, msg.as_string())
        finally:
            conn.quit()

        async with r.pipeline(transaction=True) as pipe:
            confirmation_field = await (pipe.hgetall(
                f"{user_id}:{confirmation_type}"
            ).execute())

            if confirmation_field is not None:
                await (pipe.delete(f"{user_id}:{confirmation_type}").execute())
            
            confirmation_field = await (pipe.hset(
                f"{user_id}:{confirmation_type}",
                mapping={
                    "code": digits,
                    "email": to,
                    "time": datetime.strftime(datetime.now(), "%Y-%m-%d %H:%M:%S.%f"),
                    "status": "sent"
                }).execute()
            )

    except:
        raise HTTPException(
            status_code=500,
            detail="Something went wrong with email sending"
        )