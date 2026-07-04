import Link from "next/link";
import SectionHeading from "./SectionHeading";
import FlagIcon from "./FlagIcon";
import { popularRates } from "@/lib/rates";
import { disclaimer } from "@/lib/site";

export default function RateWidget() {
  return (
    <section className="py-20" id="rates">
      <div className="wrap">
        <SectionHeading eyebrow="Exchange Rates" title="Today's popular rates"
          lead="Buy and sell rates for the currencies our customers exchange most, refreshed throughout the business day." />
        <div className="mt-9 grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-5">
          {popularRates.map((r) => (
            <div key={r.code} className="rounded-tile border border-line bg-white p-4 transition hover:-translate-y-1 hover:border-brand-blue hover:shadow-soft">
              <div className="mb-3.5 flex items-center gap-2">
                <FlagIcon country={r.country} className="h-5 w-7" />
                <span>
                  <span className="block font-display text-[15px] font-extrabold leading-tight text-navy">{r.code}</span>
                  <span className="text-[11px] text-mist">{r.name}</span>
                </span>
              </div>
              <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wide text-mist">
                <span>Buy</span><span>Sell</span>
              </div>
              <div className="flex justify-between font-mono text-[14.5px] font-semibold">
                <span className="text-brand-blue">{r.buy}</span>
                <span className="text-brand-red">{r.sell}</span>
              </div>
              <div className="mt-3 border-t border-dashed border-line pt-2.5 text-[10.5px] text-mist">Updated today</div>
            </div>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-xs text-mist">{disclaimer}</p>
          <Link href="/rates" className="btn-primary">View Full Rates</Link>
        </div>
      </div>
    </section>
  );
}
