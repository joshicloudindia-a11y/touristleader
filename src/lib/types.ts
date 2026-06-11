export type TripType = "ONE_WAY" | "ROUND_TRIP" | "MULTI_CITY";
export type CabinClass = "Economy" | "Premium" | "Business";
export type FareTypeId = "REGULAR" | "FEE_SAVER" | "COMFORT" | "YOUR_CHOICE";

export interface Airport {
  code: string;
  city: string;
  name: string;
  country: string;
}

export interface TravellerCount {
  adults: number;
  children: number;
  infants: number;
}

export interface SearchQuery {
  tripType: TripType;
  from: string;
  to: string;
  departDate: string;
  returnDate?: string;
  cabinClass: CabinClass;
  travellers: TravellerCount;
  passengerType: string;
}

export interface FareOption {
  id: FareTypeId;
  label: string;
  price: number;
  cabinBaggage: string;
  checkInBaggage: string;
  seat: string;
  meal: string;
  cancellation: string;
  badge?: string;
}

export interface FlightSegment {
  airlineCode: string;
  airlineName: string;
  flightNumber: string;
  from: string;
  to: string;
  departTime: string; // ISO
  arriveTime: string; // ISO
  durationMinutes: number;
}

export interface Flight {
  id: string;
  segments: FlightSegment[];
  airlineCode: string;
  airlineName: string;
  flightNumber: string;
  from: string;
  to: string;
  departTime: string;
  arriveTime: string;
  durationMinutes: number;
  stops: number;
  layoverAirports: string[];
  refundable: boolean;
  cabinBaggage: string;
  checkInBaggage: string;
  basePrice: number;
  fares: FareOption[];
}
