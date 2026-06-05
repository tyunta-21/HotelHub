import os

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from strawberry.fastapi import GraphQLRouter

from .database import get_db
from .models import RoomAvailability
from .schema import schema
from .seed import seed_catalog

seed_catalog()

app = FastAPI(title="HotelHub Catalog Service")
client_origin = os.getenv("CLIENT_ORIGIN", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[client_origin, "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(GraphQLRouter(schema), prefix="/graphql")


class AvailabilityPayload(BaseModel):
    roomId: str
    isAvailable: bool


@app.get("/health")
def health():
    return {"service": "hotelhub-server2", "ok": True}


@app.post("/internal/rooms/availability")
def update_internal_availability(payload: AvailabilityPayload, db: Session = Depends(get_db)):
    availability = db.get(RoomAvailability, payload.roomId)
    if availability is None:
        availability = RoomAvailability(room_id=payload.roomId, is_available=payload.isAvailable)
        db.add(availability)
    availability.is_available = payload.isAvailable
    db.commit()
    db.refresh(availability)
    return {"roomId": availability.room_id, "isAvailable": availability.is_available}
