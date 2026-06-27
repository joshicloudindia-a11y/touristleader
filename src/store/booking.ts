"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Flight, FareOption, SearchQuery } from "@/lib/types";

export interface PassengerInput {
  fullName: string;
  dob: string;
  gender: string;
  nationality: string;
  contactNumber?: string;
  email?: string;
  idType: string;
  idNumber: string;
  assistance: string; // none | wheelchair | priority | escort
  seat?: string;
  meal?: string;
}

interface BookingState {
  query: SearchQuery | null;
  flight: Flight | null;
  fare: FareOption | null;
  passengers: PassengerInput[];
  contactEmail: string;
  contactPhone: string;
  seats: Record<number, string>;
  meals: Record<number, string>;
  addOns: number;
  promoCode: string;
  customerState: string;
  agentMarkup: number; // agent's own service charge added at checkout (agent bookings only)
  setQuery: (q: SearchQuery) => void;
  selectFlight: (f: Flight, fare: FareOption) => void;
  setPassengers: (p: PassengerInput[]) => void;
  setContact: (email: string, phone: string) => void;
  setSeat: (i: number, seat: string, price: number) => void;
  setMeal: (i: number, meal: string, price: number) => void;
  setAddOns: (n: number) => void;
  setPromo: (code: string) => void;
  setCustomerState: (s: string) => void;
  setAgentMarkup: (n: number) => void;
  reset: () => void;
  totalAmount: () => number;
}

export const useBooking = create<BookingState>()(
  persist(
    (set, get) => ({
      query: null,
      flight: null,
      fare: null,
      passengers: [],
      contactEmail: "",
      contactPhone: "",
      seats: {},
      meals: {},
      addOns: 0,
      promoCode: "",
      customerState: "",
      agentMarkup: 0,
      setQuery: (query) => set({ query }),
      selectFlight: (flight, fare) => set({ flight, fare }),
      setPassengers: (passengers) => set({ passengers }),
      setContact: (contactEmail, contactPhone) => set({ contactEmail, contactPhone }),
      setSeat: (i, seat) => set((s) => ({ seats: { ...s.seats, [i]: seat } })),
      setMeal: (i, meal) => set((s) => ({ meals: { ...s.meals, [i]: meal } })),
      setAddOns: (addOns) => set({ addOns }),
      setPromo: (promoCode) => set({ promoCode }),
      setCustomerState: (customerState) => set({ customerState }),
      setAgentMarkup: (agentMarkup) => set({ agentMarkup }),
      reset: () =>
        set({ flight: null, fare: null, passengers: [], seats: {}, meals: {}, addOns: 0, promoCode: "", agentMarkup: 0 }),
      totalAmount: () => {
        const { fare, query, addOns } = get();
        if (!fare || !query) return 0;
        const pax = query.travellers.adults + query.travellers.children;
        return fare.price * Math.max(1, pax) + addOns;
      },
    }),
    { name: "tl-booking" }
  )
);
