import uvicorn 

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.db import init_db
from app import settings
from app.routes import router as game_router


def init_middlewares(app: FastAPI):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.CORS_ALLOW_METHODS,
        allow_headers=settings.CORS_ALLOW_HEADERS
    )


app = FastAPI(
    root_path="/poker_game/"
)


main_app_lifespan = app.router.lifespan_context
@asynccontextmanager
async def lifespan_wrapper(app):
    await init_db(app)
    async with main_app_lifespan(app) as maybe_state:
        yield maybe_state
app.router.lifespan_context = lifespan_wrapper

init_middlewares(app)
app.include_router(game_router, prefix="/users", tags=["login"])

# if __name__ == "__main__":
#     uvicorn.run(app, host=settings.API_HOST, port=int(settings.API_PORT))
