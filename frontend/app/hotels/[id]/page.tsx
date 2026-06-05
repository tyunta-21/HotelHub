"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { graphQL } from "@/lib/graphql";
import type { Hotel, Review, Room } from "@/lib/types";

const HOTEL_DETAIL_QUERY = `
  query HotelDetail($id: String!, $hotelId: String!) {
    hotel(id: $id) { id name city country description imageUrl rating }
    rooms(hotelId: $hotelId) {
      id hotelId name description pricePerNight capacity imageUrl
      availability { roomId isAvailable }
    }
    reviews(hotelId: $hotelId) { id hotelId guestName rating comment }
  }
`;

export default function HotelDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["hotel", params.id],
    queryFn: () => graphQL<{ hotel: Hotel; rooms: Room[]; reviews: Review[] }>(HOTEL_DETAIL_QUERY, { id: params.id, hotelId: params.id })
  });

  if (isLoading) return <main className="page">Loading hotel...</main>;
  if (!data?.hotel) return <main className="page">Hotel not found.</main>;

  return (
    <main className="page">
      <img className="detail-image" src={data.hotel.imageUrl} alt={data.hotel.name} />
      <div className="section-title">
        <div>
          <h1>{data.hotel.name}</h1>
          <p className="muted">{data.hotel.city}, {data.hotel.country} · {data.hotel.rating.toFixed(1)} rating</p>
          <p>{data.hotel.description}</p>
        </div>
      </div>
      <h2>Rooms</h2>
      <div className="grid">
        {data.rooms.map((room) => (
          <article className="card" key={room.id}>
            <img className="media" src={room.imageUrl} alt={room.name} />
            <div className="card-body">
              <strong>{room.name}</strong>
              <span className={room.availability.isAvailable ? "status ok" : "status off"}>
                {room.availability.isAvailable ? "Available" : "Booked"}
              </span>
              <span>${room.pricePerNight} / night · up to {room.capacity} guests</span>
              <Link className="btn primary" href={`/rooms/${room.id}?hotelId=${data.hotel.id}`}>Room detail</Link>
            </div>
          </article>
        ))}
      </div>
      <h2>Reviews</h2>
      <div className="grid">
        {data.reviews.map((review) => (
          <article className="card" key={review.id}>
            <div className="card-body">
              <strong>{review.guestName} · {review.rating}/5</strong>
              <p className="muted">{review.comment}</p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
