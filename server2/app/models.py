from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Hotel(Base):
    __tablename__ = "hotels"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    country: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    rating: Mapped[float] = mapped_column(Numeric(2, 1), nullable=False)

    rooms: Mapped[list["Room"]] = relationship(back_populates="hotel", cascade="all, delete-orphan")
    reviews: Mapped[list["Review"]] = relationship(back_populates="hotel", cascade="all, delete-orphan")


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    hotel_id: Mapped[str] = mapped_column(ForeignKey("hotels.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    price_per_night: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)

    hotel: Mapped[Hotel] = relationship(back_populates="rooms")
    availability: Mapped["RoomAvailability"] = relationship(back_populates="room", cascade="all, delete-orphan", uselist=False)


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    hotel_id: Mapped[str] = mapped_column(ForeignKey("hotels.id"), nullable=False)
    guest_name: Mapped[str] = mapped_column(String(120), nullable=False, default="HotelHub Guest")
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str] = mapped_column(Text, nullable=False)

    hotel: Mapped[Hotel] = relationship(back_populates="reviews")


class RoomAvailability(Base):
    __tablename__ = "room_availability"

    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id"), primary_key=True)
    is_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    room: Mapped[Room] = relationship(back_populates="availability")
