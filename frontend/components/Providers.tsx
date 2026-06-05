"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "@/store/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  const [notice, setNotice] = useState("");
  const user = useAuthStore((state) => state.user);
  const queryClient = useMemo(() => new QueryClient(), []);

  useEffect(() => {
    if (!user) return;
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8080", {
      auth: { userId: user.id }
    });
    socket.on("booking:confirmed", (booking) => setNotice(`Booking confirmed for ${booking.roomName}`));
    socket.on("booking:updated", (booking) => setNotice(`Booking status updated to ${booking.status}`));
    socket.on("booking:cancelled", (booking) => setNotice(`Booking cancelled for ${booking.roomName}`));
    return () => {
      socket.disconnect();
    };
  }, [user]);

  return (
    <QueryClientProvider client={queryClient}>
      {notice ? <div className="notice">{notice}</div> : null}
      {children}
    </QueryClientProvider>
  );
}
