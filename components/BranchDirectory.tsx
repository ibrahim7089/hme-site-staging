"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, Clock3, Phone } from "lucide-react";
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
    return branches.filter((branch) => {
      if (state !== "All States" && branch.state !== state) return false;
      if (service !== "All Services" && !branch.services.includes(service)) return false;
      if (query.trim()) {
        const term = query.trim().toLowerCase();
        if (!branch.name.toLowerCase().includes(term) && !branch.address.toLowerCase().includes(term)) return false;
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
      <div className="relative order-2 min-h-[280px] overflow-hidden rounded-card border border-line bg-cloud lg:order-1 lg:min-h-[380px] lg:sticky lg:top-24">
        {embedUrl ? (
          <iframe
            key={embedUrl}
            title={`Map ? ${active?.name}`}
            src={embedUrl}
            className="h-full min-h-[280px] w-full border-0 lg:min-h-[380px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="grid h-full min-h-[280px] place-items-center text-sm text-slate2 lg:min-h-[380px]">
            No branches match your filters
          </div>
        )}
      </div>

      <div className="order-1 flex flex-col gap-3.5 lg:order-2">
        {!limit && (
          <div className="flex flex-wrap gap-2.5">
            <select
              aria-label="Filter by state"
              value={state}
              onChange={(event) => { setState(event.target.value); setSelected(0); }}
              className="rounded-[10px] border border-line bg-white px-4 py-2.5 text-[13px] font-medium text-slate2 hover:border-brand-blue focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
            >
              <option>All States</option>
              {states.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select
              aria-label="Filter by service"
              value={service}
              onChange={(event) => { setService(event.target.value); setSelected(0); }}
              className="rounded-[10px] border border-line bg-white px-4 py-2.5 text-[13px] font-medium text-slate2 hover:border-brand-blue focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
            >
              <option>All Services</option>
              {serviceTypes.map((item) => <option key={item}>{item}</option>)}
            </select>
            <input
              aria-label="Search branches"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setSelected(0); }}
              placeholder="Search city, mall or branch"
              className="min-w-[180px] flex-1 rounded-[10px] border border-line bg-white px-4 py-2.5 text-[13px] font-medium text-slate2 placeholder:text-slate2/70 hover:border-brand-blue focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
            />
          </div>
        )}

        {!limit && (
          <p className="text-[12.5px] text-slate2" aria-live="polite">Showing {filtered.length} of {branches.length} locations</p>
        )}

        <div className="flex max-h-[560px] flex-col gap-3.5 overflow-y-auto pr-1 lg:max-h-[640px]">
          {filtered.map((branch, index) => {
            const isSelected = index === selected;
            return (
              <article
                key={`${branch.name}-${branch.state}`}
                className={`overflow-hidden rounded-tile border bg-white transition hover:border-brand-blue hover:shadow-soft ${
                  isSelected ? "border-brand-blue shadow-soft" : "border-line"
                }`}
              >
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelected(index)}
                  className="w-full p-5 pb-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h4 className="font-display text-base font-bold text-navy">{branch.name}</h4>
                    <span className="whitespace-nowrap rounded-full bg-brand-bluesoft px-2.5 py-1 text-[11px] font-bold text-brand-blue">{branch.state}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-slate2">{branch.address}</p>
                  <div className="mt-3 grid gap-1.5 text-[12.5px] text-slate2">
                    <span className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" />{branch.hours}</span>
                    <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{branch.phone}</span>
                    <span className="flex items-start gap-2"><Banknote className="mt-0.5 h-3.5 w-3.5 flex-none" />{branch.services.join(" ? ")}</span>
                  </div>
                </button>
                <div className="flex flex-wrap gap-2 px-5 pb-5">
                  <a href={branch.whatsapp} target="_blank" rel="noreferrer"
                    className="rounded-[9px] bg-[#EAF7F0] px-3.5 py-2 font-display text-[12.5px] font-bold text-[#147A45]">
                    WhatsApp
                  </a>
                  <a href={branch.mapsUrl} target="_blank" rel="noopener noreferrer"
                    className="rounded-[9px] border-[1.5px] border-line px-3.5 py-2 font-display text-[12.5px] font-bold text-navy hover:border-brand-blue hover:text-brand-blue">
                    Get Directions
                  </a>
                </div>
              </article>
            );
          })}
          {filtered.length === 0 && (
            <p className="rounded-tile border border-line bg-white p-5 text-sm text-slate2">
              No branches or agents match your search ? try a different state or keyword.
            </p>
          )}
        </div>

        {limit && <Link href={viewAllHref} className="btn-outline self-start">View All Branches &rarr;</Link>}
      </div>
    </div>
  );
}
