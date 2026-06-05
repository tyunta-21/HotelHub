"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteBooking, getAllBookings, updateBooking } from "@/lib/rest";
import { graphQL } from "@/lib/graphql";
import type { Hotel } from "@/lib/types";
import { useAuthStore } from "@/store/auth";

const HOTELS_QUERY = `query { hotels(limit: 20, offset: 0) { id name city country rating imageUrl description } }`;

export default function AdminPage() {
  const { user, accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const hotels = useQuery({
    queryKey: ["admin-hotels"],
    queryFn: () => graphQL<{ hotels: Hotel[] }>(HOTELS_QUERY)
  });
  const bookings = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => getAllBookings(accessToken!),
    enabled: Boolean(user && accessToken && user.role === "ADMIN")
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "CONFIRMED" | "COMPLETED" | "CANCELLED" }) => updateBooking(id, status, accessToken!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-bookings"] })
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBooking(id, accessToken!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-bookings"] })
  });

  if (!user) return <main className="page">Login as admin@hotelhub.local to inspect the dashboard.</main>;
  if (user.role !== "ADMIN") return <main className="page">Admin access only.</main>;

  return (
    <main className="page">
      <div className="section-title">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="muted">Current account: {user.email} · {user.role}</p>
        </div>
      </div>
      <div className="grid">
        <div className="card"><div className="card-body"><strong>{hotels.data?.hotels.length || 0}</strong><span className="muted">Catalog hotels</span></div></div>
        <div className="card"><div className="card-body"><strong>{bookings.data?.length || 0}</strong><span className="muted">Visible bookings</span></div></div>
        <div className="card"><div className="card-body"><strong>Realtime</strong><span className="muted">Socket.io booking events active after login</span></div></div>
      </div>
      <h2>Booking Controls</h2>
      <div className="grid">
        {bookings.data?.map((booking) => (
          <article className="card" key={booking.id}>
            <div className="card-body">
              <strong>{booking.hotelName}</strong>
              <span>{booking.roomName} · {booking.status}</span>
              <span className="muted">{booking.user ? `${booking.user.name} · ${booking.user.email}` : booking.userId}</span>
              <div className="actions">
                <button className="btn" onClick={() => updateMutation.mutate({ id: booking.id, status: "COMPLETED" })}>Mark completed</button>
                <button className="btn warn" onClick={() => updateMutation.mutate({ id: booking.id, status: "CANCELLED" })}>Cancel</button>
                <button className="btn" onClick={() => deleteMutation.mutate(booking.id)}>Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
