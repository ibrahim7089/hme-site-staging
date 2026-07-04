export type Branch = {
  name: string;
  address: string;
  hours: string;
  phone: string;
  whatsapp: string;
  services: string[];
  mapsUrl: string;
};

export const branches: Branch[] = [
  {
    name: "HME \u2014 Econsave Tasek",
    address: "Lot TS 07, Econsave Tasek, Ipoh, Perak",
    hours: "10:00 AM \u2013 10:00 PM",
    phone: "+60 5-XXX XXXX",
    whatsapp: "https://wa.me/60XXXXXXXXX",
    services: ["Currency Exchange", "Money Transfer"],
    mapsUrl: "#",
  },
  {
    name: "HME \u2014 Lumut Waterfront",
    address: "Jalan Titi Panjang, Lumut, Perak",
    hours: "9:30 AM \u2013 6:30 PM",
    phone: "+60 5-XXX XXXX",
    whatsapp: "https://wa.me/60XXXXXXXXX",
    services: ["Currency Exchange", "Currency Booking"],
    mapsUrl: "#",
  },
];
