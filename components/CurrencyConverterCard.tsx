"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import FlagIcon from "./FlagIcon";
import { parsePublishedRate, popularRates } from "@/lib/rates";

type Mode = "exchange" | "transfer";

export default function CurrencyConverterCard() {
  const [mode, setMode] = useState<Mode>("exchange");
  const [amount, setAmount] = useState("1000");
  const [code, setCode] = useState(popularRates[0].code);

  const rate = popularRates.find((r) => r.code === code) ?? popularRates[0];
  const result = useMemo(() => {
    const n = parseFloat(amount);
    const sellRate = parsePublishedRate(rate.sell);
    if (!Number.isFinite(n) || n <= 0 || sellRate === null) return null;
    return (n / sellRate).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, [amount, rate]);

  return (
    <div className="overflow-hidden rounded-card border border-[#7FB2F5]/25 bg-gradient-to-b from-[#0A244E] to-[#071B3C] p-6 text-white shadow-deep sm:p-7">
      <h3 className="mb-1 font-display text-lg font-extrabold">Currency Converter</h3>
      <p className="mb-5 text-[13px] text-[#B9C8E0]">
        See how much your Ringgit is worth &mdash; indicative rates, confirmed at the branch.
      </p>

      <div className="mb-5 grid grid-cols-2 gap-1.5 rounded-xl bg-white/5 p-1">
        {(["exchange", "transfer"] as Mode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`rounded-lg py-2 text-[13px] font-bold transition ${mode === m ? "bg-white text-navy" : "text-[#B9C8E0] hover:text-white"}`}>
            {m === "exchange" ? "Exchange Rate" : "Money Transfer Rate"}
          </button>
        ))}
      </div>

      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#7189AC]">
        You send
      </label>
      <div className="mb-4 flex items-center rounded-xl border border-[#7FB2F5]/25 bg-white/5 px-4 py-3">
        <input
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-transparent font-mono text-lg font-semibold text-white outline-none placeholder:text-[#7189AC]"
          placeholder="1000"
        />
        <span className="flex-none font-display text-sm font-bold text-[#7FB2F5]">MYR</span>
      </div>

      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#7189AC]">
        Recipient gets
      </label>
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#7FB2F5]/25 bg-white/5 px-4 py-3">
        <span className="flex-1 truncate font-mono text-lg font-semibold text-white">
          {result ?? "Rate unavailable"}
        </span>
        <FlagIcon country={rate.country} className="h-5 w-7" />
        <select value={code} onChange={(e) => setCode(e.target.value)}
          className="flex-none rounded-lg border border-[#7FB2F5]/25 bg-[#0A244E] px-2 py-1.5 font-display text-sm font-bold text-white outline-none">
          {popularRates.map((r) => (
            <option key={r.code} value={r.code}>{r.code}</option>
          ))}
        </select>
      </div>

      <Link href={mode === "exchange" ? "/rates" : "/money-transfer-rates"} className="btn-red w-full">
        {mode === "exchange" ? "View Full Exchange Rates" : "View Full Money Transfer Rates"}
      </Link>
      <p className="mt-3 text-center text-[10.5px] text-[#7189AC]">Rates are indicative only and subject to change.</p>
    </div>
  );
}
