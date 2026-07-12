export type Rate = {
  code: string;
  name: string;
  country: string;
  buy: string;
  sell: string;
};

export function parsePublishedRate(value: string): number | null {
  const rate = Number(value);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

export function displayPublishedRate(value: string): string {
  return parsePublishedRate(value) === null ? "Unavailable" : value;
}

// Replace with a live feed (API route / CMS / rate engine) in production.
export const popularRates: Rate[] = [
  { code: "USD", name: "US Dollar", country: "US", buy: "0.00", sell: "0.00" },
  { code: "SGD", name: "Singapore Dollar", country: "SG", buy: "0.00", sell: "0.00" },
  { code: "THB", name: "Thai Baht", country: "TH", buy: "0.00", sell: "0.00" },
  { code: "IDR", name: "Indonesian Rupiah", country: "ID", buy: "0.00", sell: "0.00" },
  { code: "INR", name: "Indian Rupee", country: "IN", buy: "0.00", sell: "0.00" },
  { code: "BDT", name: "Bangladeshi Taka", country: "BD", buy: "0.00", sell: "0.00" },
  { code: "NPR", name: "Nepalese Rupee", country: "NP", buy: "0.00", sell: "0.00" },
  { code: "PHP", name: "Philippine Peso", country: "PH", buy: "0.00", sell: "0.00" },
  { code: "AED", name: "UAE Dirham", country: "AE", buy: "0.00", sell: "0.00" },
  { code: "SAR", name: "Saudi Riyal", country: "SA", buy: "0.00", sell: "0.00" },
];

export const lastUpdated: string | null = null;
