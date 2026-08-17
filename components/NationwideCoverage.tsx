import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { branches, states } from "@/lib/branches";

const coverageMarkers = [
  { label: "Kedah", states: ["Kedah"], x: 96, y: 151 },
  { label: "Penang", states: ["Penang"], x: 91, y: 185 },
  { label: "Perak", states: ["Perak"], x: 114, y: 239 },
  { label: "Klang Valley", states: ["Kuala Lumpur", "Selangor"], x: 144, y: 312 },
  { label: "Negeri Sembilan", states: ["Negeri Sembilan"], x: 151, y: 348 },
  { label: "Malacca", states: ["Malacca"], x: 169, y: 358 },
  { label: "Johor", states: ["Johor"], x: 231, y: 406 },
  { label: "Sarawak", states: ["Sarawak"], x: 510, y: 410 },
  { label: "Sabah", states: ["Sabah"], x: 765, y: 176 },
] as const;

function locationCount(markerStates: readonly string[]) {
  return branches.filter((branch) => markerStates.includes(branch.state)).length;
}

export default function NationwideCoverage() {
  const exchangeLocations = branches.filter((branch) => branch.services.includes("Currency Exchange")).length;
  const transferLocations = branches.filter((branch) => branch.services.includes("Money Transfer")).length;
  const stats = [
    { value: branches.length, label: "HME locations in the current branch directory" },
    { value: states.length, label: "States and federal territories served" },
    { value: exchangeLocations, label: "Locations offering currency exchange" },
    { value: transferLocations, label: "Locations supporting money transfers" },
  ];

  return (
    <section className="relative overflow-hidden bg-[#F4F7FB] py-20 text-navy-deep sm:py-24" aria-labelledby="coverage-heading">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-navy/15 to-transparent" aria-hidden="true" />
      <div className="wrap">
        <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 xl:gap-24">
          <div>
            <div className="relative aspect-[45/28] overflow-hidden rounded-[26px] border border-navy/10 bg-[radial-gradient(circle_at_42%_45%,#ffffff_0%,#f1f5fa_52%,#e8eef6_100%)] shadow-[0_28px_70px_rgba(8,39,79,0.12)]">
              <div className="absolute inset-0 opacity-[0.28] [background-image:linear-gradient(rgba(13,48,91,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(13,48,91,0.08)_1px,transparent_1px)] [background-size:36px_36px]" aria-hidden="true" />
              <Image
                src="/images/malaysia-coverage-map.svg"
                alt="Map of Peninsular Malaysia, Sabah and Sarawak"
                fill
                sizes="(max-width: 1023px) 94vw, 54vw"
                className="object-contain"
              />

              {coverageMarkers.map((marker) => {
                const count = locationCount(marker.states);
                if (!count) return null;
                const glowSize = Math.min(54, 26 + Math.sqrt(count) * 7);

                return (
                  <button
                    key={marker.label}
                    type="button"
                    aria-label={`${marker.label}: ${count} HME ${count === 1 ? "location" : "locations"}`}
                    className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-red"
                    style={{ left: `${(marker.x / 900) * 100}%`, top: `${(marker.y / 560) * 100}%` }}
                  >
                    <span
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-red/20 ring-1 ring-brand-red/15 transition duration-300 group-hover:scale-125 group-focus-visible:scale-125"
                      style={{ width: glowSize, height: glowSize }}
                      aria-hidden="true"
                    />
                    <span className="relative grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-white bg-brand-red shadow-[0_3px_10px_rgba(200,16,46,0.42)] sm:h-4 sm:w-4" aria-hidden="true" />
                    <span className="pointer-events-none absolute bottom-[calc(100%+13px)] left-1/2 min-w-max -translate-x-1/2 translate-y-1 rounded-lg bg-navy-deep px-3 py-2 text-left text-[11px] font-semibold leading-tight text-white opacity-0 shadow-xl transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 sm:text-xs">
                      {marker.label} <b className="ml-1 text-[#FF9AAA]">{count}</b>
                    </span>
                  </button>
                );
              })}

              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-3 py-2 text-[10px] font-semibold text-slate-600 shadow-sm backdrop-blur sm:bottom-5 sm:left-5 sm:text-xs">
                <span className="relative block h-3 w-3 rounded-full bg-brand-red/20" aria-hidden="true">
                  <span className="absolute inset-[3px] rounded-full bg-brand-red" />
                </span>
                Marker size reflects local coverage
              </div>
            </div>
          </div>

          <div>
            <p className="mb-4 flex items-center gap-2 font-display text-xs font-extrabold uppercase tracking-[0.2em] text-brand-red">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Nationwide coverage
            </p>
            <h2 id="coverage-heading" className="max-w-[12ch] font-display text-[clamp(34px,4vw,54px)] font-extrabold leading-[1.02] tracking-[-0.045em] text-navy-deep">
              A network built <span className="text-brand-red">close to you</span>
            </h2>
            <p className="mt-6 max-w-[52ch] text-[15px] leading-7 text-slate-600 sm:text-base">
              Currency exchange and international transfers through one connected HME network—from northern towns and the Klang Valley to KLIA and East Malaysia.
            </p>

            <dl className="mt-10 grid grid-cols-2 gap-x-7 gap-y-8 border-t border-navy/10 pt-8 sm:gap-x-10">
              {stats.map((stat) => (
                <div key={stat.label} className="relative pl-4 before:absolute before:bottom-0 before:left-0 before:top-0 before:w-[3px] before:rounded-full before:bg-brand-red/80">
                  <dt className="font-display text-[clamp(30px,3.2vw,43px)] font-extrabold leading-none tracking-[-0.04em] text-navy-deep tabular-nums">
                    {stat.value}
                  </dt>
                  <dd className="mt-2 text-xs leading-5 text-slate-600 sm:text-sm">{stat.label}</dd>
                </div>
              ))}
            </dl>

            <Link href="/locate-us" className="mt-10 inline-flex min-h-12 items-center gap-3 rounded-xl bg-navy-deep px-5 py-3 font-display text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(7,31,70,0.18)] transition hover:-translate-y-0.5 hover:bg-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red">
              Explore all locations
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
