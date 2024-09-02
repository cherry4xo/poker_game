from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "users" (
    "uuid" UUID NOT NULL  PRIMARY KEY,
    "username" VARCHAR(64),
    "email" VARCHAR(64),
    "password_hash" VARCHAR(255),
    "registration_date" DATE NOT NULL,
    "is_admin" BOOL NOT NULL  DEFAULT False,
    "is_confirmed" BOOL NOT NULL  DEFAULT False
);
CREATE TABLE IF NOT EXISTS "aerich" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSONB NOT NULL
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """
