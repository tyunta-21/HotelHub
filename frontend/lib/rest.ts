import type { AuthResponse, Booking } from "./types";

type CreateBookingInput = {
  userId: string;
  hotelId: string;
  hotelName: string;
  roomId: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
};

const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${gatewayUrl}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || "REST request failed");
  return payload;
}

export function login(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function register(name: string, email: string, password: string) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password })
  });
}

export function getBookings(userId: string, token: string) {
  return request<Booking[]>(`/bookings/${userId}`, {}, token);
}

export function getAllBookings(token: string) {
  return request<Booking[]>("/bookings", {}, token);
}

export function createBooking(input: CreateBookingInput, token: string) {
  return request<Booking>("/bookings", {
    method: "POST",
    body: JSON.stringify(input)
  }, token);
}

export function cancelBooking(id: string, token: string) {
  return request<Booking>(`/bookings/${id}`, { method: "DELETE" }, token);
}

export function deleteBooking(id: string, token: string) {
  return request<{ id: string; deleted: boolean }>(`/bookings/${id}/permanent`, { method: "DELETE" }, token);
}

export function updateBooking(id: string, status: Booking["status"], token: string) {
  return request<Booking>(`/bookings/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  }, token);
}

export function processPayment(bookingId: string, amount: number, token: string) {
  return request<{ id: string; status: string }>("/payments", {
    method: "POST",
    body: JSON.stringify({ bookingId, amount })
  }, token);
}
