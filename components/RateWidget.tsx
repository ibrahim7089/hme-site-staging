import Link from "next/link";
import SectionHeading from "./SectionHeading";
import FlagIcon from "./FlagIcon";
import RateUnavailableNotice from "./RateUnavailableNotice";
import { displayPublishedRate, parsePublishedRate } from "@/lib/rates";
import { getPublishedRates } from "@/lib/cms";
import { disclaimer } from "@/lib/site";

export default async function RateWidget() {
  const published = await getPublishedRates();
  const popularRates = published.rates;
  const hasPublishedExchangeRates = popularRates.some(
    (rate) => parsePublishedRate(rate.buy) !== null && parsePublishedRate(rate.sell) !== null,
  );
  return (
    <section className="py-16 md:py-20" id="rates">
      <div className="wrap">
        <SectionHeading eyebrow="Exchange Rates" title="Popular currency rates"
          lead="Review published buy and sell rates, then confirm the final rate with your chosen branch." />
        {hasPublishedExchangeRates ? (
          <>
            <div className="mt-9 grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-5">
              {popularRates.map((rate) => (
                <div key={rate.code} className="rounded-tile border border-line bg-white p-4 transition hover:-translate-y-1 hover:border-brand-blue hover:shadow-soft">
                  <div className="mb-3.5 flex items-center gap-2">
                    <FlagIcon country={rate.country} className="h-5 w-7" />
                    <span>
                      <span className="block font-display text-[15px] font-extrabold leading-tight text-navy">{rate.code}</span>
                      <span className="text-[11px] text-slate2">{rate.name}</span>
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wide text-slate2">
                    <span>Buy</span><span>Sell</span>
                  </div>
                  <div className="flex justify-between font-mono text-[14.5px] font-semibold">
                    <span className="text-brand-blue">{displayPublishedRate(rate.buy)}</span>
                    <span className="text-brand-red">{displayPublishedRate(rate.sell)}</span>
                  </div>
                  <div className="mt-3 border-t border-dashed border-line pt-2.5 text-[10.5px] text-slate2">Confirm at branch</div>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
              <p className="max-w-xl text-xs text-slate2">{published.disclaimer || disclaimer}</p>
              <Link href="/rates" className="btn-primary">View Full Rates</Link>
            </div>
          </>
        ) : (
          <div className="mt-9"><RateUnavailableNotice /></div>
        )}
      </div>
    </section>
  );
}
