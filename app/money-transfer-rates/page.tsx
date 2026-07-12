import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import FlagIcon from "@/components/FlagIcon";
import Link from "next/link";
import { disclaimer } from "@/lib/site";
import { displayPublishedRate } from "@/lib/rates";

export const metadata: Metadata = {
  title: "Money Transfer Rates Today | Send Money Overseas Rates",
  description:
    "Today's HME Remit money transfer rates from Malaysia to Indonesia, Bangladesh, India, Nepal, the Philippines and more \u2014 transparent and updated daily.",
};

const rows = [
  { code: "ID", country: "Indonesia", ccy: "IDR", rate: "0.00" },
  { code: "BD", country: "Bangladesh", ccy: "BDT", rate: "0.00" },
  { code: "IN", country: "India", ccy: "INR", rate: "0.00" },
  { code: "NP", country: "Nepal", ccy: "NPR", rate: "0.00" },
  { code: "PH", country: "Philippines", ccy: "PHP", rate: "0.00" },
  { code: "PK", country: "Pakistan", ccy: "PKR", rate: "0.00" },
];

export default function MoneyTransferRatesPage() {
  return (
    <>
      <PageHero eyebrow="Money Transfer Rates" title="Today's money transfer rates"
        lead="Indicative rates per MYR 1.00 for popular destinations. Confirm the final rate and any applicable fee at the branch before sending." />
      <section className="py-20">
        <div className="wrap">
          <div className="overflow-hidden rounded-card border border-line shadow-soft">
            <div className="grid grid-cols-[1.6fr_1fr_1fr] bg-navy px-6 py-3.5 font-display text-xs font-bold uppercase tracking-widest text-[#B9C8E0]">
              <span>Destination</span><span className="text-right">Currency</span><span className="text-right">Rate / MYR</span>
            </div>
            {rows.map((r, i) => (
              <div key={r.country} className={`grid grid-cols-[1.6fr_1fr_1fr] items-center px-6 py-4 ${i % 2 ? "bg-cloud" : "bg-white"}`}>
                <span className="flex items-center gap-3 font-display text-[15px] font-bold text-navy">
                  <FlagIcon country={r.code} className="h-6 w-8" />{r.country}
                </span>
                <span className="text-right text-sm text-slate2">{r.ccy}</span>
                <span className="text-right font-mono font-semibold text-brand-blue">{displayPublishedRate(r.rate)}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-xl text-xs text-mist">{disclaimer}</p>
            <Link href="/locate-us" className="btn-primary">Find a Branch to Send</Link>
          </div>
        </div>
      </section>
    </>
  );
}
