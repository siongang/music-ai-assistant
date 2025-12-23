from fastapi import FastAPI
from .api.router import api_router

app = FastAPI(title="Music Assistant API")

app.include_router(api_router)
