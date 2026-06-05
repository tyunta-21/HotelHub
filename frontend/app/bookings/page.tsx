"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelBooking, deleteBooking, getBookings } from "@/lib/rest";
import { useAuthStore } from "@/store/auth";

export default function BookingsPage() {
  const { user, accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const enabled = Boolean(user && accessToken);
  const { data, isLoading, error } = useQuery({
    queryKey: ["bookings", user?.id],
    queryFn: () => getBookings(user!.id, accessToken!),
    enabled
  });
  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelBooking(id, accessToken!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings", user?.id] })
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBooking(id, accessToken!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings", user?.id] })
  });

  if (!user) return <main className="page">Please login to view bookings.</main>;

  return (
    <main className="page">
      <div className="section-title">
        <h1>My Bookings</h1>
        <p className="muted">Booking data comes from Server 1 through REST.</p>
      </div>
      {isLoading ? <p>Loading bookings...</p> : null}
      {error ? <p>{error.message}</p> : null}
      <div className="grid">
        {data?.map((booking) => (
          <article className="card" key={booking.id}>
            <div className="card-body">
              <strong>{booking.hotelName}</strong>
              <span>{booking.roomName}</span>
              <span className="muted">{new Date(booking.checkIn).toLocaleDateString()} to {new Date(booking.checkOut).toLocaleDateString()}</span>
              <span className={booking.status === "CONFIRMED" ? "status ok" : "status off"}>{booking.status}</span>
              <div className="actions">
                <button className="btn warn" disabled={booking.status === "CANCELLED"} onClick={() => cancelMutation.mutate(booking.id)}>Cancel</button>
                <button className="btn" onClick={() => deleteMutation.mutate(booking.id)}>Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
