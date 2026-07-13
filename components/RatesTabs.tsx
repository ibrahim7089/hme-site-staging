"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import FlagIcon from "./FlagIcon";
import RateUnavailableNotice from "./RateUnavailableNotice";
import {
  displayPublishedRate,
  hasPublishedExchangeRates,
  lastUpdated,
  parsePublishedRate,
  popularRates,
} from "@/lib/rates";
import { disclaimer } from "@/lib/site";

const remittanceRates = [
  { code: "ID", country: "Indonesia", ccy: "IDR", rate: "0.00" },
  { code: "BD", country: "Bangladesh", ccy: "BDT", rate: "0.00" },
  { code: "IN", country: "India", ccy: "INR", rate: "0.00" },
  { code: "NP", country: "Nepal", ccy: "NPR", rate: "0.00" },
  { code: "PH", country: "Philippines", ccy: "PHP", rate: "0.00" },
  { code: "PK", country: "Pakistan", ccy: "PKR", rate: "0.00" },
];

const hasRemittanceRates = remittanceRates.some((rate) => parsePublishedRate(rate.rate) !== null);

type Tab = "fx" | "remittance";

export default function RatesTabs() {
  const [active, setActive] = useState<Tab>("fx");

  useEffect(() => {
    if (window.location.hash === "#remittance") setActive("remittance");
  }, []);

  return (
    <section className="py-14 md:py-16">
      <div className="wrap">
        <div className="mb-8 flex gap-1 overflow-x-auto border-b border-line">
          {([
            { id: "fx", label: "Currency Exchange Rates" },
            { id: "remittance", label: "Money Transfer Rates" },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              aria-pressed={active === id}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 pb-3 pt-1 text-sm font-semibold transition ${
                active === id
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-slate2 hover:text-navy"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {active === "fx" && (
          hasPublishedExchangeRates ? (
            <>
              <div className="overflow-hidden rounded-card border border-line shadow-soft">
                <div className="grid grid-cols-[1.6fr_1fr_1fr] bg-navy px-4 py-3.5 font-display text-xs font-bold uppercase tracking-widest text-[#B9C8E0] sm:px-6">
                  <span>Currency</span>
                  <span className="text-right">We Buy (MYR)</span>
                  <span className="text-right">We Sell (MYR)</span>
                </div>
                {popularRates.map((rate, index) => (
                  <div key={rate.code}
                    className={`grid grid-cols-[1.6fr_1fr_1fr] items-center px-4 py-4 sm:px-6 ${index % 2 ? "bg-cloud" : "bg-white"}`}>
                    <span className="flex items-center gap-2 sm:gap-3">
                      <FlagIcon country={rate.country} className="hidden h-6 w-8 sm:block" />
                      <span>
                        <b className="block font-display text-[15px] text-navy">{rate.code}</b>
                        <small className="hidden text-xs text-slate2 sm:block">{rate.name}</small>
                      </span>
                    </span>
                    <span className="text-right font-mono text-sm font-semibold text-brand-blue">{displayPublishedRate(rate.buy)}</span>
                    <span className="text-right font-mono text-sm font-semibold text-brand-red">{displayPublishedRate(rate.sell)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs text-slate2">
                {lastUpdated ? `Last updated: ${lastUpdated}. ` : ""}
                {disclaimer}
              </p>
            </>
          ) : <RateUnavailableNotice />
        )}

        {active === "remittance" && (
          hasRemittanceRates ? (
            <>
              <div className="overflow-hidden rounded-card border border-line shadow-soft">
                <div className="grid grid-cols-[1.6fr_1fr_1fr] bg-navy px-4 py-3.5 font-display text-xs font-bold uppercase tracking-widest text-[#B9C8E0] sm:px-6">
                  <span>Destination</span>
                  <span className="text-right">Currency</span>
                  <span className="text-right">Rate / MYR 1.00</span>
                </div>
                {remittanceRates.map((rate, index) => (
                  <div key={rate.country}
                    className={`grid grid-cols-[1.6fr_1fr_1fr] items-center px-4 py-4 sm:px-6 ${index % 2 ? "bg-cloud" : "bg-white"}`}>
                    <span className="flex items-center gap-2 font-display text-sm font-bold text-navy sm:gap-3">
                      <FlagIcon country={rate.code} className="hidden h-6 w-8 sm:block" />{rate.country}
                    </span>
                    <span className="text-right text-sm text-slate2">{rate.ccy}</span>
                    <span className="text-right font-mono text-sm font-semibold text-brand-blue">{displayPublishedRate(rate.rate)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <p className="max-w-xl text-xs text-slate2">{disclaimer}</p>
                <Link href="/locate-us" className="btn-primary">Find a Branch to Send</Link>
              </div>
            </>
          ) : <RateUnavailableNotice />
        )}
      </div>
    </section>
  );
}
