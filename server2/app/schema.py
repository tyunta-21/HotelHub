import uuid
from typing import Optional

import strawberry
from sqlalchemy import or_

from .database import SessionLocal
from .models import Hotel as HotelModel
from .models import Review as ReviewModel
from .models import Room as RoomModel
from .models import RoomAvailability as RoomAvailabilityModel


@strawberry.type
class Hotel:
    id: str
    name: str
    city: str
    country: str
    description: str
    image_url: str
    rating: float


@strawberry.type
class RoomAvailability:
    room_id: str
    is_available: bool


@strawberry.type
class Room:
    id: str
    hotel_id: str
    name: str
    description: str
    price_per_night: float
    capacity: int
    image_url: str
    availability: RoomAvailability


@strawberry.type
class Review:
    id: str
    hotel_id: str
    guest_name: str
    rating: int
    comment: str


def to_hotel(model: HotelModel) -> Hotel:
    return Hotel(
        id=model.id,
        name=model.name,
        city=model.city,
        country=model.country,
        description=model.description,
        image_url=model.image_url,
        rating=float(model.rating),
    )


def to_room(model: RoomModel) -> Room:
    return Room(
        id=model.id,
        hotel_id=model.hotel_id,
        name=model.name,
        description=model.description,
        price_per_night=float(model.price_per_night),
        capacity=model.capacity,
        image_url=model.image_url,
        availability=RoomAvailability(
            room_id=model.availability.room_id,
            is_available=model.availability.is_available,
        ),
    )


def to_review(model: ReviewModel) -> Review:
    return Review(
        id=model.id,
        hotel_id=model.hotel_id,
        guest_name=model.guest_name,
        rating=model.rating,
        comment=model.comment,
    )


@strawberry.type
class Query:
    @strawberry.field
    def hotels(
        self,
        filter: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[Hotel]:
        db = SessionLocal()
        try:
            query = db.query(HotelModel)
            if filter:
                query = query.filter(or_(HotelModel.city.ilike(f"%{filter}%"), HotelModel.country.ilike(f"%{filter}%")))
            if search:
                query = query.filter(or_(HotelModel.name.ilike(f"%{search}%"), HotelModel.description.ilike(f"%{search}%")))
            return [to_hotel(hotel) for hotel in query.offset(offset).limit(limit).all()]
        finally:
            db.close()

    @strawberry.field
    def hotel(self, id: str) -> Optional[Hotel]:
        db = SessionLocal()
        try:
            model = db.get(HotelModel, id)
            return to_hotel(model) if model else None
        finally:
            db.close()

    @strawberry.field
    def rooms(self, hotel_id: str) -> list[Room]:
        db = SessionLocal()
        try:
            return [to_room(room) for room in db.query(RoomModel).filter(RoomModel.hotel_id == hotel_id).all()]
        finally:
            db.close()

    @strawberry.field
    def room(self, id: str) -> Optional[Room]:
        db = SessionLocal()
        try:
            model = db.get(RoomModel, id)
            return to_room(model) if model else None
        finally:
            db.close()

    @strawberry.field
    def reviews(self, hotel_id: str) -> list[Review]:
        db = SessionLocal()
        try:
            return [to_review(review) for review in db.query(ReviewModel).filter(ReviewModel.hotel_id == hotel_id).all()]
        finally:
            db.close()


@strawberry.type
class Mutation:
    @strawberry.mutation
    def add_review(self, hotel_id: str, rating: int, comment: str) -> Review:
        db = SessionLocal()
        try:
            review = ReviewModel(
                id=str(uuid.uuid4()),
                hotel_id=hotel_id,
                guest_name="HotelHub Guest",
                rating=rating,
                comment=comment,
            )
            db.add(review)
            db.commit()
            db.refresh(review)
            return to_review(review)
        finally:
            db.close()

    @strawberry.mutation
    def update_room_availability(self, room_id: str, is_available: bool) -> RoomAvailability:
        db = SessionLocal()
        try:
            availability = db.get(RoomAvailabilityModel, room_id)
            if availability is None:
                availability = RoomAvailabilityModel(room_id=room_id, is_available=is_available)
                db.add(availability)
            availability.is_available = is_available
            db.commit()
            db.refresh(availability)
            return RoomAvailability(room_id=availability.room_id, is_available=availability.is_available)
        finally:
            db.close()


schema = strawberry.Schema(query=Query, mutation=Mutation)
