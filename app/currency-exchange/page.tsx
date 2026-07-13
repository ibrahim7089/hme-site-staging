import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import RateWidget from "@/components/RateWidget";
import CurrencyExchangeSteps from "@/components/CurrencyExchangeSteps";
import BranchLocatorPreview from "@/components/BranchLocatorPreview";

export const metadata: Metadata = {
  title: "Currency Exchange Malaysia | Buy & Sell Foreign Currency",
  description:
    "Buy and sell foreign currencies through HME's licensed branch network in Malaysia. Review published rates or contact your nearest branch.",
};

export default function CurrencyExchangePage() {
  return (
    <>
      <PageHero eyebrow="Currency Exchange"
        title="Buy and sell foreign currency with confidence"
        lead="Major and selected currencies are handled across HME's branch network, with indicative published rates when available, proper receipts and counter support."
        image="/images/currency-exchange-counter.png" />
      <RateWidget />
      <section className="bg-cloud py-16 md:py-20">
        <div className="wrap grid gap-6 md:grid-cols-2 md:items-start">
          <CurrencyExchangeSteps />
          <div className="rounded-card border border-line bg-white p-7">
            <h3 className="text-xl font-bold text-navy">Good to know</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate2">
              <li>&#10003; Bring a valid ID (MyKad or passport) for transactions.</li>
              <li>&#10003; Published rates are indicative; the final rate is confirmed at the counter.</li>
              <li>&#10003; Ask your chosen branch about currency availability before travelling.</li>
              <li>&#10003; Larger amounts may require additional verification under Malaysian regulation.</li>
              <li>&#10003; Every completed transaction comes with a receipt.</li>
            </ul>
          </div>
        </div>
      </section>
      <BranchLocatorPreview limit={4} />
    </>
  );
}
