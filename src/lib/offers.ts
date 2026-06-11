export type OfferCategory = "BANK" | "WALLET" | "FLIGHT" | "HOTEL" | "SEASONAL";

export interface Offer {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  category: OfferCategory;
  discount: string;
  minBooking?: string;
  validTill?: string;
  bg: string; // gradient classes
  terms: string[];
}

export const OFFER_CATEGORIES: { id: OfferCategory | "ALL"; label: string }[] = [
  { id: "ALL", label: "All Offers" },
  { id: "BANK", label: "Bank Offers" },
  { id: "WALLET", label: "Wallet & UPI" },
  { id: "FLIGHT", label: "Flights" },
  { id: "HOTEL", label: "Hotels" },
  { id: "SEASONAL", label: "Seasonal" },
];

export const DEMO_OFFERS: Offer[] = [
  {
    id: "1", code: "TLHDFC", category: "BANK", title: "Flat ₹1,500 OFF", subtitle: "on domestic flights with HDFC Bank Credit Cards",
    discount: "Flat ₹1,500 OFF", minBooking: "Min. booking ₹5,000", validTill: "30 Jun 2026", bg: "from-rose-500 to-pink-600",
    terms: ["Valid on HDFC Bank Credit & Debit Cards.", "Minimum booking amount ₹5,000.", "Maximum discount ₹1,500 per transaction.", "Applicable on domestic flights only."],
  },
  {
    id: "2", code: "TLUPI", category: "WALLET", title: "Up to ₹3,000 Cashback", subtitle: "Pay via UPI & win assured wallet cashback",
    discount: "Up to ₹3,000 Cashback", minBooking: "No minimum", validTill: "31 Jul 2026", bg: "from-indigo-500 to-blue-600",
    terms: ["Pay using any UPI app at checkout.", "Cashback credited to TouristLeader wallet within 24 hours.", "1 cashback per user per week."],
  },
  {
    id: "3", code: "TLSTUDENT", category: "FLIGHT", title: "Student Special", subtitle: "Extra baggage + up to 10% off base fare",
    discount: "Up to 10% OFF", minBooking: "Valid student ID required", validTill: "31 Dec 2026", bg: "from-emerald-500 to-teal-600",
    terms: ["Select the Student special fare while booking.", "Carry a valid student ID at the airport.", "Extra baggage subject to airline policy."],
  },
  {
    id: "4", code: "TLFEST", category: "SEASONAL", title: "Festive Fiesta", subtitle: "Seasonal fares to 100+ destinations",
    discount: "Up to 40% OFF", minBooking: "Limited period", validTill: "15 Aug 2026", bg: "from-amber-500 to-orange-600",
    terms: ["Discount varies by route and travel date.", "Subject to availability.", "Cannot be clubbed with other offers."],
  },
  {
    id: "5", code: "TLICICI", category: "BANK", title: "10% Instant Discount", subtitle: "on hotels & holiday packages with ICICI Cards",
    discount: "10% Instant OFF", minBooking: "Min. booking ₹8,000", validTill: "30 Jun 2026", bg: "from-orange-500 to-red-600",
    terms: ["Valid on ICICI Bank Credit Cards.", "Maximum discount ₹2,000.", "Applicable on hotels and holiday packages."],
  },
  {
    id: "6", code: "TLSTAY", category: "HOTEL", title: "Flat 25% OFF on Hotels", subtitle: "Stay more, save more across 50,000+ hotels",
    discount: "Flat 25% OFF", minBooking: "Min. 2 nights", validTill: "30 Sep 2026", bg: "from-violet-500 to-purple-600",
    terms: ["Minimum 2-night stay required.", "Maximum discount ₹3,000.", "Valid on select hotels."],
  },
  {
    id: "7", code: "TLWALLET", category: "WALLET", title: "₹500 Wallet Bonus", subtitle: "Add ₹2,000 to wallet & get ₹500 extra",
    discount: "₹500 Bonus", minBooking: "Add ₹2,000", validTill: "31 Jul 2026", bg: "from-sky-500 to-cyan-600",
    terms: ["Add ₹2,000 or more to your TouristLeader wallet.", "Bonus credited instantly.", "One-time per user."],
  },
  {
    id: "8", code: "TLSENIOR", category: "FLIGHT", title: "Senior Citizen Fare", subtitle: "Reduced base fare + priority assistance",
    discount: "Up to ₹600 OFF", minBooking: "Age 60+", validTill: "31 Dec 2026", bg: "from-teal-500 to-emerald-600",
    terms: ["Select the Senior Citizen fare while booking.", "Carry a government age proof.", "Priority assistance subject to airline."],
  },
];
