"use client";

import { useMutation } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createBooking, processPayment } from "@/lib/rest";
import { graphQL } from "@/lib/graphql";
import type { Hotel, Room } from "@/lib/types";
import { useAuthStore } from "@/store/auth";

const ROOM_QUERY = `
  query RoomDetail($roomId: String!, $hotelId: String!) {
    room(id: $roomId) {
      id hotelId name description pricePerNight capacity imageUrl
      availability { roomId isAvailable }
    }
    hotel(id: $hotelId) { id name city country description imageUrl rating }
  }
`;

function toDateInputValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

export default function RoomDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const hotelId = searchParams.get("hotelId") || "";
  const today = toDateInputValue(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = toDateInputValue(tomorrowDate);

  const { data, isLoading } = useQuery({
    queryKey: ["room", params.id, hotelId],
    queryFn: () => graphQL<{ room: Room; hotel: Hotel }>(ROOM_QUERY, { roomId: params.id, hotelId }),
    enabled: Boolean(hotelId)
  });

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!user || !accessToken || !data) throw new Error("Please login before booking.");
      const checkIn = String(formData.get("checkIn"));
      const checkOut = String(formData.get("checkOut"));
      const guests = Number(formData.get("guests"));
      const booking = await createBooking({
        userId: user.id,
        hotelId: data.hotel.id,
        hotelName: data.hotel.name,
        roomId: data.room.id,
        roomName: data.room.name,
        checkIn,
        checkOut,
        guests,
        totalAmount: Number(data.room.pricePerNight)
      }, accessToken);
      await processPayment(booking.id, Number(data.room.pricePerNight), accessToken);
      return booking;
    },
    onSuccess: () => router.push("/bookings")
  });

  if (isLoading) return <main className="page">Loading room...</main>;
  if (!data?.room) return <main className="page">Room not found.</main>;

  return (
    <main className="page split">
      <section>
        <img className="detail-image" src={data.room.imageUrl} alt={data.room.name} />
        <h1>{data.room.name}</h1>
        <p className="muted">{data.hotel.name} · {data.hotel.city}, {data.hotel.country}</p>
        <p>{data.room.description}</p>
        <p><strong>${data.room.pricePerNight}</strong> per night · up to {data.room.capacity} guests</p>
        <span className={data.room.availability.isAvailable ? "status ok" : "status off"}>
          {data.room.availability.isAvailable ? "Available" : "Booked"}
        </span>
      </section>
      <form className="form" action={(formData) => mutation.mutate(formData)}>
        <h2>Book this room</h2>
        <label>Check in<input type="date" name="checkIn" defaultValue={today} min={today} required /></label>
        <label>Check out<input type="date" name="checkOut" defaultValue={tomorrow} min={tomorrow} required /></label>
        <label>Guests<input type="number" name="guests" min="1" max={data.room.capacity} defaultValue="2" required /></label>
        <button className="btn primary" disabled={!data.room.availability.isAvailable || mutation.isPending}>
          {mutation.isPending ? "Booking..." : "Confirm booking"}
        </button>
        {mutation.error ? <p>{mutation.error.message}</p> : null}
        {!user ? <p className="muted">Login or register first to create bookings.</p> : null}
      </form>
    </main>
  );
}
