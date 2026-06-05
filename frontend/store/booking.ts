"use client";

import { create } from "zustand";
import type { Hotel, Room } from "@/lib/types";

type BookingDraft = {
  hotel: Hotel | null;
  room: Room | null;
  checkIn: string;
  checkOut: string;
  guests: number;
};

type BookingState = {
  draft: BookingDraft;
  setDraft: (draft: Partial<BookingDraft>) => void;
  clearDraft: () => void;
};

const emptyDraft: BookingDraft = {
  hotel: null,
  room: null,
  checkIn: "",
  checkOut: "",
  guests: 2
};

export const useBookingStore = create<BookingState>((set) => ({
  draft: emptyDraft,
  setDraft: (draft) => set((state) => ({ draft: { ...state.draft, ...draft } })),
  clearDraft: () => set({ draft: emptyDraft })
}));
