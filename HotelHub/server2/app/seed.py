from .database import Base, SessionLocal, engine
from .models import Hotel, Review, Room, RoomAvailability


HOTELS = [
    ("hotel-1", "Aurora Grand", "Tashkent", "Uzbekistan", "A polished city retreat near leafy boulevards and late-night dining.", "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", 4.8),
    ("hotel-2", "Marina Vista", "Barcelona", "Spain", "Sunlit balconies, Mediterranean breakfasts, and quick walks to the waterfront.", "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80", 4.7),
    ("hotel-3", "Alpine Hearth Lodge", "Zermatt", "Switzerland", "Warm timber suites with mountain views and restorative spa rituals.", "https://images.unsplash.com/photo-1517320964276-a002fa203177?auto=format&fit=crop&w=1200&q=80", 4.9),
    ("hotel-4", "The Nomad House", "Marrakesh", "Morocco", "A calm riad with courtyard tea service and handcrafted interiors.", "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80", 4.6),
    ("hotel-5", "Harborline Suites", "Vancouver", "Canada", "Modern suites overlooking the harbor, built for longer urban stays.", "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", 4.5),
]


def seed_catalog():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Hotel).count() > 0:
            return

        for hotel_id, name, city, country, description, image_url, rating in HOTELS:
            hotel = Hotel(
                id=hotel_id,
                name=name,
                city=city,
                country=country,
                description=description,
                image_url=image_url,
                rating=rating,
            )
            db.add(hotel)
            for index, room_type in enumerate(["Classic King", "Terrace Suite", "Family Loft"], start=1):
                room_id = f"{hotel_id}-room-{index}"
                room = Room(
                    id=room_id,
                    hotel_id=hotel_id,
                    name=room_type,
                    description=f"{room_type} at {name} with premium linens, work space, and flexible cancellation.",
                    price_per_night=140 + index * 55 + len(city),
                    capacity=index + 1,
                    image_url=f"https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80&sig={hotel_id}-{index}",
                )
                db.add(room)
                db.add(RoomAvailability(room_id=room_id, is_available=True))
            db.add_all(
                [
                    Review(id=f"{hotel_id}-review-1", hotel_id=hotel_id, guest_name="Amina", rating=5, comment="Thoughtful service and a very smooth stay."),
                    Review(id=f"{hotel_id}-review-2", hotel_id=hotel_id, guest_name="Daniel", rating=4, comment="Great location, comfortable room, and quick check-in."),
                ]
            )
        db.commit()
    finally:
        db.close()
