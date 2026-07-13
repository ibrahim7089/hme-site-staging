import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import RatesTabs from "@/components/RatesTabs";

export const metadata: Metadata = {
  title: "Exchange & Money Transfer Rates | HME Malaysia",
  description:
    "Review HME currency exchange and international money transfer rates when published, or contact a branch for the latest available rate.",
};

export default function RatesPage() {
  return (
    <>
      <PageHero
        eyebrow="Rates"
        title="Rates with no guesswork"
        lead="Switch between currency exchange and money transfer. Published rates are indicative; final rates are confirmed at the branch."
      />
      <RatesTabs />
    </>
  );
}
