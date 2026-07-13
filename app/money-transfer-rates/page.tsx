import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import FlagIcon from "@/components/FlagIcon";
import RateUnavailableNotice from "@/components/RateUnavailableNotice";
import Link from "next/link";
import { disclaimer } from "@/lib/site";
import { displayPublishedRate, parsePublishedRate } from "@/lib/rates";

export const metadata: Metadata = {
  title: "Money Transfer Rates | Send Money Overseas",
  description:
    "Check published HME Remit money transfer rates from Malaysia and contact a branch for the latest available rate and applicable fees.",
};

const rows = [
  { code: "ID", country: "Indonesia", ccy: "IDR", rate: "0.00" },
  { code: "BD", country: "Bangladesh", ccy: "BDT", rate: "0.00" },
  { code: "IN", country: "India", ccy: "INR", rate: "0.00" },
  { code: "NP", country: "Nepal", ccy: "NPR", rate: "0.00" },
  { code: "PH", country: "Philippines", ccy: "PHP", rate: "0.00" },
  { code: "PK", country: "Pakistan", ccy: "PKR", rate: "0.00" },
];

const hasPublishedRates = rows.some((row) => parsePublishedRate(row.rate) !== null);

export default function MoneyTransferRatesPage() {
  return (
    <>
      <PageHero eyebrow="Money Transfer Rates" title="Send with clarity"
        lead="Review published rates when available, then confirm the final rate and any applicable fee with your chosen branch." />
      <section className="py-14 md:py-20">
        <div className="wrap">
          {hasPublishedRates ? (
            <>
              <div className="overflow-hidden rounded-card border border-line shadow-soft">
                <div className="grid grid-cols-[1.6fr_1fr_1fr] bg-navy px-4 py-3.5 font-display text-xs font-bold uppercase tracking-widest text-[#B9C8E0] sm:px-6">
                  <span>Destination</span><span className="text-right">Currency</span><span className="text-right">Rate / MYR</span>
                </div>
                {rows.map((row, index) => (
                  <div key={row.country} className={`grid grid-cols-[1.6fr_1fr_1fr] items-center px-4 py-4 sm:px-6 ${index % 2 ? "bg-cloud" : "bg-white"}`}>
                    <span className="flex items-center gap-2 font-display text-sm font-bold text-navy sm:gap-3">
                      <FlagIcon country={row.code} className="hidden h-6 w-8 sm:block" />{row.country}
                    </span>
                    <span className="text-right text-sm text-slate2">{row.ccy}</span>
                    <span className="text-right font-mono text-sm font-semibold text-brand-blue">{displayPublishedRate(row.rate)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <p className="max-w-xl text-xs text-slate2">{disclaimer}</p>
                <Link href="/locate-us" className="btn-primary">Find a Branch to Send</Link>
              </div>
            </>
          ) : <RateUnavailableNotice />}
        </div>
      </section>
    </>
  );
}
