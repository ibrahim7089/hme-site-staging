import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import FlagIcon from "@/components/FlagIcon";
import { popularRates, lastUpdated } from "@/lib/rates";
import { disclaimer } from "@/lib/site";

export const metadata: Metadata = {
  title: "Exchange Rates Today | HME Currency Rates Malaysia",
  description:
    "Today's foreign currency buy and sell rates at HME branches \u2014 USD, SGD, THB, IDR, INR, BDT and more, updated throughout the business day.",
};

export default function RatesPage() {
  return (
    <>
      <PageHero eyebrow="Exchange Rates" title="Today's full rate board"
        lead={`All published buy and sell rates against MYR, last updated ${lastUpdated}. Refreshed throughout the business day.`} />
      <section className="py-20">
        <div className="wrap">
          <div className="overflow-hidden rounded-card border border-line shadow-soft">
            <div className="grid grid-cols-[1.6fr_1fr_1fr] bg-navy px-6 py-3.5 font-display text-xs font-bold uppercase tracking-widest text-[#B9C8E0]">
              <span>Currency</span><span className="text-right">We Buy (MYR)</span><span className="text-right">We Sell (MYR)</span>
            </div>
            {popularRates.map((r, i) => (
              <div key={r.code} className={`grid grid-cols-[1.6fr_1fr_1fr] items-center px-6 py-4 ${i % 2 ? "bg-cloud" : "bg-white"}`}>
                <span className="flex items-center gap-3">
                  <FlagIcon country={r.country} className="h-6 w-8" />
                  <span><b className="block font-display text-[15px] text-navy">{r.code}</b>
                  <small className="text-xs text-mist">{r.name}</small></span>
                </span>
                <span className="text-right font-mono font-semibold text-brand-blue">{r.buy}</span>
                <span className="text-right font-mono font-semibold text-brand-red">{r.sell}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs text-mist">{disclaimer}</p>
        </div>
      </section>
    </>
  );
}
