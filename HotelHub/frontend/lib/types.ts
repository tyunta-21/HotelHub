export type User = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

export type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type Hotel = {
  id: string;
  name: string;
  city: string;
  country: string;
  description: string;
  imageUrl: string;
  rating: number;
};

export type Room = {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  pricePerNight: number;
  capacity: number;
  imageUrl: string;
  availability: {
    roomId: string;
    isAvailable: boolean;
  };
};

export type Review = {
  id: string;
  hotelId: string;
  guestName: string;
  rating: number;
  comment: string;
};

export type Booking = {
  id: string;
  userId: string;
  hotelId: string;
  hotelName: string;
  roomId: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  user?: {
    id: string;
    name: string;
    email: string;
  };
};
