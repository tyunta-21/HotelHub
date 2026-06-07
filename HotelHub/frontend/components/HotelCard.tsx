import Link from "next/link";
import type { Hotel } from "@/lib/types";

export function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <article className="card">
      <img className="media" src={hotel.imageUrl} alt={hotel.name} />
      <div className="card-body">
        <strong>{hotel.name}</strong>
        <span className="muted">{hotel.city}, {hotel.country}</span>
        <span>{hotel.rating.toFixed(1)} rating</span>
        <p className="muted">{hotel.description}</p>
        <Link className="btn primary" href={`/hotels/${hotel.id}`}>View rooms</Link>
      </div>
    </article>
  );
}
