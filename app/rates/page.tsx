import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import RatesTabs from "@/components/RatesTabs";

export const metadata: Metadata = {
  title: "Exchange & Money Transfer Rates | HME Malaysia",
  description:
    "Today's HME currency exchange buy/sell rates and international money transfer rates — USD, SGD, IDR, BDT, INR and more, updated throughout the business day.",
};

export default function RatesPage() {
  return (
    <>
      <PageHero
        eyebrow="Rates"
        title="Today's rates"
        lead="Switch between currency exchange and money transfer rates — all published by HME and refreshed throughout the business day."
        image="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1920&q=80"
      />
      <RatesTabs />
    </>
  );
}
