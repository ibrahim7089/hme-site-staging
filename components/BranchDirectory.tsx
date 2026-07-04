"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Branch } from "@/lib/branches";
import { states } from "@/lib/branches";

const serviceTypes = ["Money Transfer", "Currency Exchange", "Agents", "Corporate Office"];

export default function BranchDirectory({
  branches, limit, viewAllHref = "/locate-us",
}: { branches: Branch[]; limit?: number; viewAllHref?: string }) {
  const [state, setState] = useState("All States");
  const [service, setService] = useState("All Services");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  const filtered = useMemo(() => {
    if (limit) return branches.slice(0, limit);
    return branches.filter((b) => {
      if (state !== "All States" && b.state !== state) return false;
      if (service !== "All Services" && !b.services.includes(service)) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (!b.name.toLowerCase().includes(q) && !b.address.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [branches, limit, state, service, query]);

  const active = filtered[Math.min(selected, filtered.length - 1)] ?? filtered[0];
  const embedUrl = active
    ? `https://www.google.com/maps?q=${encodeURIComponent(active.address)}&output=embed`
    : null;

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
      <div className="relative min-h-[280px] overflow-hidden rounded-card border border-line bg-cloud lg:min-h-[380px] lg:sticky lg:top-24">
        {embedUrl ? (
          <iframe
            key={embedUrl}
            title={`Map — ${active?.name}`}
            src={embedUrl}
            className="h-full min-h-[280px] w-full border-0 lg:min-h-[380px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="grid h-full min-h-[280px] place-items-center text-sm text-mist lg:min-h-[380px]">No branches match your filters</div>
        )}
      </div>

      <div className="flex flex-col gap-3.5">
        {!limit && (
          <div className="flex flex-wrap gap-2.5">
            <select value={state} onChange={(e) => { setState(e.target.value); setSelected(0); }}
              className="rounded-[10px] border border-line bg-white px-4 py-2.5 text-[13px] font-medium text-slate2 hover:border-brand-blue">
              <option>All States</option>
              {states.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={service} onChange={(e) => { setService(e.target.value); setSelected(0); }}
              className="rounded-[10px] border border-line bg-white px-4 py-2.5 text-[13px] font-medium text-slate2 hover:border-brand-blue">
              <option>All Services</option>
              {serviceTypes.map((s) => <option key={s}>{s}</option>)}
            </select>
            <input value={query} onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
              placeholder="Search city, mall or branch"
              className="min-w-[180px] flex-1 rounded-[10px] border border-line bg-white px-4 py-2.5 text-[13px] font-medium text-slate2 placeholder:text-mist hover:border-brand-blue" />
          </div>
        )}

        {!limit && (
          <p className="text-[12.5px] text-mist">Showing {filtered.length} of {branches.length} locations</p>
        )}

        <div className="flex max-h-[560px] flex-col gap-3.5 overflow-y-auto pr-1 lg:max-h-[640px]">
          {filtered.map((b, i) => (
            <button key={`${b.name}-${b.state}`} type="button" onClick={() => setSelected(i)}
              className={`rounded-tile border p-5 text-left transition hover:border-brand-blue hover:shadow-soft ${i === selected ? "border-brand-blue shadow-soft" : "border-line bg-white"}`}>
              <div className="mb-2 flex items-start justify-between gap-3">
                <h4 className="font-display text-base font-bold text-navy">{b.name}</h4>
                <span className="whitespace-nowrap rounded-full bg-brand-bluesoft px-2.5 py-1 text-[11px] font-bold text-brand-blue">{b.state}</span>
              </div>
              <p className="text-[13px] text-slate2">{b.address}</p>
              <div className="my-2.5 flex flex-wrap gap-4 text-[12.5px] text-mist">
                <span>&#128337; {b.hours}</span>
                <span>&#128222; {b.phone}</span>
                <span>&#128177; {b.services.join(" · ")}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={b.whatsapp} onClick={(e) => e.stopPropagation()}
                  className="rounded-[9px] bg-[#EAF7F0] px-3.5 py-2 font-display text-[12.5px] font-bold text-[#1E9E5A]">WhatsApp</a>
                <a href={b.mapsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                  className="rounded-[9px] border-[1.5px] border-line px-3.5 py-2 font-display text-[12.5px] font-bold text-navy hover:border-brand-blue hover:text-brand-blue">Get Directions</a>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="rounded-tile border border-line bg-white p-5 text-sm text-slate2">No branches or agents match your search — try a different state or keyword.</p>
          )}
        </div>

        {limit && <Link href={viewAllHref} className="btn-outline self-start">View All Branches &rarr;</Link>}
      </div>
    </div>
  );
}
