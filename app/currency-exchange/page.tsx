import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import RateWidget from "@/components/RateWidget";
import CurrencyExchangeSteps from "@/components/CurrencyExchangeSteps";
import BranchLocatorPreview from "@/components/BranchLocatorPreview";

export const metadata: Metadata = {
  title: "Currency Exchange Malaysia | Buy & Sell Foreign Currency",
  description:
    "Buy and sell over 30 foreign currencies at competitive rates through HME's licensed branch network in Malaysia. Check today's rates and find your nearest branch.",
};

export default function CurrencyExchangePage() {
  return (
    <>
      <PageHero eyebrow="Currency Exchange"
        title="Buy and sell foreign currency at competitive rates"
        lead="Over 30 major and selected currencies handled across HME's branch network — with clear buy and sell rates published daily, proper receipts and friendly counter service."
        image="https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=1920&q=80" />
      <RateWidget />
      <section className="bg-cloud py-20">
        <div className="wrap grid gap-6 md:grid-cols-2 md:items-start">
          <CurrencyExchangeSteps />
          <div className="rounded-card border border-line bg-white p-7">
            <h3 className="text-xl font-bold text-navy">Good to know</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate2">
              <li>&#10003; Bring a valid ID (MyKad or passport) for transactions.</li>
              <li>&#10003; Rates online are indicative; the final rate is confirmed at the counter.</li>
              <li>&#10003; Popular currencies can be reserved through Currency Booking.</li>
              <li>&#10003; Larger amounts may require additional verification under Malaysian regulation.</li>
              <li>&#10003; Every transaction comes with a proper receipt.</li>
            </ul>
          </div>
        </div>
      </section>
      <BranchLocatorPreview limit={4} />
    </>
  );
}
