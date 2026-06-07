"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth";

export function Nav() {
  const { user, logout } = useAuthStore();

  return (
    <nav className="nav">
      <Link href="/" className="brand">HotelHub</Link>
      <div className="nav-links">
        <Link href="/hotels">Hotels</Link>
        <Link href="/bookings">My Bookings</Link>
        <Link href="/admin">Admin</Link>
        {user ? (
          <button className="btn" onClick={logout}>{user.name} · Logout</button>
        ) : (
          <Link href="/auth">Login / Register</Link>
        )}
      </div>
    </nav>
  );
}
