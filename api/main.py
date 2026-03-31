import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import analytics, demand, files, jobs
from api.routers import matching
from api.services import pairing_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    pairing_store.init_db()
    yield


app = FastAPI(title="MathVision CSV Analytics API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(files.router)
app.include_router(jobs.router)
app.include_router(analytics.router)
app.include_router(matching.router)
app.include_router(demand.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
