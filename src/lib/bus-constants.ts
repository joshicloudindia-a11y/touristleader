export const BUS_CITIES = [
  "Delhi", "Kanpur", "Lucknow", "Jaipur", "Agra", "Mumbai", "Pune", "Bengaluru",
  "Hyderabad", "Chennai", "Goa", "Ahmedabad", "Surat", "Indore", "Bhopal",
  "Chandigarh", "Dehradun", "Manali", "Shimla", "Udaipur", "Jodhpur", "Varanasi",
  "Patna", "Kolkata", "Nagpur", "Vijayawada", "Coimbatore", "Madurai", "Kochi",
];

export const BUS_OPERATORS = [
  "TouristLeader Travels", "VRL Travels", "SRS Travels", "Orange Tours", "Neeta Travels",
  "Sharma Travels", "IntrCity SmartBus", "Zingbus", "GreenLine", "KPN Travels",
  "Parveen Travels", "City Land Travels", "Hans Travels", "Rajdhani Express",
];

export const BUS_TYPES = [
  { id: "AC Sleeper (2+1)", ac: true, sleeper: true },
  { id: "Non-AC Sleeper (2+1)", ac: false, sleeper: true },
  { id: "AC Seater / Sleeper (2+1)", ac: true, sleeper: true },
  { id: "AC Seater (2+2)", ac: true, sleeper: false },
  { id: "Volvo AC Multi-Axle Sleeper", ac: true, sleeper: true },
  { id: "Non-AC Seater (2+2)", ac: false, sleeper: false },
];

export const BUS_AMENITIES = [
  "Charging Point", "Water Bottle", "Blanket", "WiFi", "Reading Light",
  "CCTV", "Emergency Contact", "Track My Bus", "Movie", "Snacks",
];

export const BUS_BOARDING = [
  "ISBT Kashmere Gate", "Anand Vihar", "Dhaula Kuan", "Akshardham", "Majnu Ka Tila",
];
export const BUS_DROPPING = [
  "Jhakarkati Bus Stand", "Rawatpur", "Vijay Nagar", "Kalyanpur", "Ghantaghar",
];

export const BUS_TRENDING = [
  { from: "Delhi", to: "Kanpur" },
  { from: "Mumbai", to: "Pune" },
  { from: "Bengaluru", to: "Goa" },
  { from: "Delhi", to: "Jaipur" },
  { from: "Hyderabad", to: "Vijayawada" },
];
