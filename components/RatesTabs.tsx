"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import FlagIcon from "./FlagIcon";
import { displayPublishedRate, popularRates, lastUpdated } from "@/lib/rates";
import { disclaimer } from "@/lib/site";

const remittanceRates = [
  { code: "ID", country: "Indonesia", ccy: "IDR", rate: "0.00" },
  { code: "BD", country: "Bangladesh", ccy: "BDT", rate: "0.00" },
  { code: "IN", country: "India", ccy: "INR", rate: "0.00" },
  { code: "NP", country: "Nepal", ccy: "NPR", rate: "0.00" },
  { code: "PH", country: "Philippines", ccy: "PHP", rate: "0.00" },
  { code: "PK", country: "Pakistan", ccy: "PKR", rate: "0.00" },
];

type Tab = "fx" | "remittance";

export default function RatesTabs() {
  const [active, setActive] = useState<Tab>("fx");

  useEffect(() => {
    if (window.location.hash === "#remittance") setActive("remittance");
  }, []);

  return (
    <section className="py-16">
      <div className="wrap">
        {/* Tab bar */}
        <div className="mb-8 flex gap-1 border-b border-line">
          {([
            { id: "fx", label: "Currency Exchange Rates" },
            { id: "remittance", label: "Money Transfer Rates" },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`-mb-px border-b-2 px-5 pb-3 pt-1 text-sm font-semibold transition ${
                active === id
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-slate2 hover:text-navy"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Currency exchange table */}
        {active === "fx" && (
          <>
            <div className="overflow-hidden rounded-card border border-line shadow-soft">
              <div className="grid grid-cols-[1.6fr_1fr_1fr] bg-navy px-6 py-3.5 font-display text-xs font-bold uppercase tracking-widest text-[#B9C8E0]">
                <span>Currency</span>
                <span className="text-right">We Buy (MYR)</span>
                <span className="text-right">We Sell (MYR)</span>
              </div>
              {popularRates.map((r, i) => (
                <div key={r.code}
                  className={`grid grid-cols-[1.6fr_1fr_1fr] items-center px-6 py-4 ${i % 2 ? "bg-cloud" : "bg-white"}`}>
                  <span className="flex items-center gap-3">
                    <FlagIcon country={r.country} className="h-6 w-8" />
                    <span>
                      <b className="block font-display text-[15px] text-navy">{r.code}</b>
                      <small className="text-xs text-mist">{r.name}</small>
                    </span>
                  </span>
                  <span className="text-right font-mono font-semibold text-brand-blue">{displayPublishedRate(r.buy)}</span>
                  <span className="text-right font-mono font-semibold text-brand-red">{displayPublishedRate(r.sell)}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-mist">
              {lastUpdated ? `Last updated: ${lastUpdated}. ` : "Online rates are temporarily unavailable. "}
              {disclaimer}
            </p>
          </>
        )}

        {/* Money transfer table */}
        {active === "remittance" && (
          <>
            <div className="overflow-hidden rounded-card border border-line shadow-soft">
              <div className="grid grid-cols-[1.6fr_1fr_1fr] bg-navy px-6 py-3.5 font-display text-xs font-bold uppercase tracking-widest text-[#B9C8E0]">
                <span>Destination</span>
                <span className="text-right">Currency</span>
                <span className="text-right">Rate / MYR 1.00</span>
              </div>
              {remittanceRates.map((r, i) => (
                <div key={r.country}
                  className={`grid grid-cols-[1.6fr_1fr_1fr] items-center px-6 py-4 ${i % 2 ? "bg-cloud" : "bg-white"}`}>
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
          </>
        )}
      </div>
    </section>
  );
}
