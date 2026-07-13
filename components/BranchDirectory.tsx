"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, Clock3, MapPin, MapPinned, Navigation, Phone } from "lucide-react";
import type { Branch } from "@/lib/branches";

const serviceTypes = ["Money Transfer", "Currency Exchange", "Agents", "Corporate Office"];

export default function BranchDirectory({
  branches, limit, viewAllHref = "/locate-us",
}: { branches: Branch[]; limit?: number; viewAllHref?: string }) {
  const [state, setState] = useState("All States");
  const [service, setService] = useState("All Services");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [mapVisible, setMapVisible] = useState(false);
  const states = useMemo(() => Array.from(new Set(branches.map((branch) => branch.state))).sort(), [branches]);

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

  const activeIndex = Math.min(selected, Math.max(filtered.length - 1, 0));
  const active = filtered[activeIndex];
  const embedUrl = active
    ? `https://www.google.com/maps?hl=en&q=${encodeURIComponent(active.address)}&z=15&output=embed`
    : null;

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
      <div className="relative order-2 h-[380px] overflow-hidden rounded-card border border-line bg-[#EAF1FA] lg:order-1 lg:sticky lg:top-24 lg:h-[560px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(18,99,216,0.18),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(220,232,248,0.86))]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(18,99,216,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(18,99,216,0.16)_1px,transparent_1px)] [background-size:42px_42px]"
        />

        {active ? (
          <>
            {mapVisible && embedUrl && (
              <iframe
                key={embedUrl}
                title={"Map: " + active.name}
                src={embedUrl}
                className="absolute inset-0 h-full w-full border-0 bg-white"
                loading="lazy"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            )}

            {!mapVisible && (
              <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-cta">
                  <MapPinned className="h-7 w-7" />
                </div>
                <div className="max-w-md rounded-card border border-white/80 bg-white/92 p-5 shadow-deep backdrop-blur sm:p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue">
                    Selected branch
                  </p>
                  <h3 className="mt-2 font-display text-xl font-extrabold text-navy">{active.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate2">{active.address}</p>
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => setMapVisible(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-bold text-white shadow-cta transition hover:bg-[#0E51B4]"
                    >
                      <MapPin className="h-4 w-4" />
                      Load Map Preview
                    </button>
                    <a
                      href={active.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-navy transition hover:border-brand-blue hover:text-brand-blue"
                    >
                      <Navigation className="h-4 w-4" />
                      Directions
                    </a>
                  </div>
                </div>
                <p className="max-w-sm text-xs leading-relaxed text-slate2">
                  The interactive map loads only when requested, improving speed and providing a reliable directions fallback.
                </p>
              </div>
            )}

            {mapVisible && (
              <div className="absolute inset-x-3 bottom-3 z-10 flex items-center justify-between gap-3 rounded-xl bg-white/95 p-3 shadow-deep backdrop-blur">
                <span className="min-w-0">
                  <b className="block truncate font-display text-sm text-navy">{active.name}</b>
                  <span className="block truncate text-xs text-slate2">{active.state}</span>
                </span>
                <div className="flex flex-none gap-2">
                  <button
                    type="button"
                    onClick={() => setMapVisible(false)}
                    className="rounded-lg border border-line px-3 py-2 text-xs font-bold text-slate2 transition hover:border-brand-blue hover:text-brand-blue"
                  >
                    Hide
                  </button>
                  <a
                    href={active.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-blue px-3 py-2 text-xs font-bold text-white"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Open Map
                  </a>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="relative z-10 grid h-full place-items-center p-6 text-center text-sm text-slate2">
            No branches match your filters.
          </div>
        )}
      </div>
      <div className="order-1 flex min-w-0 flex-col gap-3.5 lg:order-2">
        {!limit && (
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-[0.9fr_1fr_1.4fr]">
            <select
              aria-label="Filter by state"
              value={state}
              onChange={(event) => { setState(event.target.value); setSelected(0); }}
              className="w-full rounded-[10px] border border-line bg-white px-4 py-2.5 text-[13px] font-medium text-slate2 hover:border-brand-blue focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
            >
              <option>All States</option>
              {states.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select
              aria-label="Filter by service"
              value={service}
              onChange={(event) => { setService(event.target.value); setSelected(0); }}
              className="w-full rounded-[10px] border border-line bg-white px-4 py-2.5 text-[13px] font-medium text-slate2 hover:border-brand-blue focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
            >
              <option>All Services</option>
              {serviceTypes.map((item) => <option key={item}>{item}</option>)}
            </select>
            <input
              aria-label="Search branches"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setSelected(0); }}
              placeholder="Search city, mall or branch"
              className="w-full rounded-[10px] border border-line bg-white px-4 py-2.5 text-[13px] font-medium text-slate2 placeholder:text-slate2/70 hover:border-brand-blue focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 sm:col-span-2 xl:col-span-1"
            />
          </div>
        )}

        {!limit && (
          <p className="text-[12.5px] text-slate2" aria-live="polite">
            Showing {filtered.length} of {branches.length} locations
          </p>
        )}

        <div className="flex max-h-[560px] flex-col gap-3.5 overflow-y-auto pr-1">
          {filtered.map((branch, index) => {
            const isSelected = index === activeIndex;
            return (
              <article
                key={`${branch.name}-${branch.state}`}
                className={`rounded-tile border bg-white p-5 transition hover:border-brand-blue hover:shadow-soft ${
                  isSelected ? "border-brand-blue shadow-soft" : "border-line"
                }`}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="font-display text-base font-bold text-navy">{branch.name}</h3>
                  <span className="whitespace-nowrap rounded-full bg-brand-bluesoft px-2.5 py-1 text-[11px] font-bold text-brand-blue">
                    {branch.state}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-slate2">{branch.address}</p>
                <div className="mt-3 grid gap-1.5 text-[12.5px] text-slate2">
                  <span className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5 flex-none" />{branch.hours}</span>
                  <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 flex-none" />{branch.phone}</span>
                  <span className="flex items-start gap-2"><Banknote className="mt-0.5 h-3.5 w-3.5 flex-none" />{branch.services.join(" / ")}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  <button
                    type="button"
                    aria-pressed={isSelected && mapVisible}
                    onClick={() => { setSelected(index); setMapVisible(true); }}
                    className={`inline-flex items-center gap-1.5 rounded-[9px] px-3.5 py-2 font-display text-[12.5px] font-bold transition ${
                      isSelected ? "bg-brand-blue text-white" : "bg-brand-bluesoft text-brand-blue hover:bg-brand-blue hover:text-white"
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5" /> {isSelected && mapVisible ? "Shown on Map" : "Show on Map"}
                  </button>
                  <a href={branch.whatsapp} target="_blank" rel="noreferrer"
                    className="rounded-[9px] bg-[#EAF7F0] px-3.5 py-2 font-display text-[12.5px] font-bold text-[#147A45]">
                    WhatsApp
                  </a>
                  <a href={branch.mapsUrl} target="_blank" rel="noopener noreferrer"
                    className="rounded-[9px] border-[1.5px] border-line px-3.5 py-2 font-display text-[12.5px] font-bold text-navy hover:border-brand-blue hover:text-brand-blue">
                    Directions
                  </a>
                </div>
              </article>
            );
          })}
          {filtered.length === 0 && (
            <p className="rounded-tile border border-line bg-white p-5 text-sm text-slate2">
              No branches or agents match your search. Try a different state or keyword.
            </p>
          )}
        </div>

        {limit && <Link href={viewAllHref} className="btn-outline self-start">View All Branches &rarr;</Link>}
      </div>
    </div>
  );
}
