export type Rate = {
  code: string;
  name: string;
  country: string;
  buy: string;
  sell: string;
};

// Replace with a live feed (API route / CMS / rate engine) in production.
export const popularRates: Rate[] = [
  { code: "USD", name: "US Dollar", country: "US", buy: "4.4120", sell: "4.4680" },
  { code: "SGD", name: "Singapore Dollar", country: "SG", buy: "3.4510", sell: "3.4920" },
  { code: "THB", name: "Thai Baht", country: "TH", buy: "0.1258", sell: "0.1297" },
  { code: "IDR", name: "Indonesian Rupiah", country: "ID", buy: "0.000268", sell: "0.000276" },
  { code: "INR", name: "Indian Rupee", country: "IN", buy: "0.0508", sell: "0.0524" },
  { code: "BDT", name: "Bangladeshi Taka", country: "BD", buy: "0.0360", sell: "0.0374" },
  { code: "NPR", name: "Nepalese Rupee", country: "NP", buy: "0.0318", sell: "0.0330" },
  { code: "PHP", name: "Philippine Peso", country: "PH", buy: "0.0752", sell: "0.0779" },
  { code: "AED", name: "UAE Dirham", country: "AE", buy: "1.1990", sell: "1.2205" },
  { code: "SAR", name: "Saudi Riyal", country: "SA", buy: "1.1740", sell: "1.1960" },
];

export const lastUpdated = "09:30, 02 Jul 2026";
