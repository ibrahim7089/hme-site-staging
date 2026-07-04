import Link from "next/link";
import SectionHeading from "./SectionHeading";
import { branches } from "@/lib/branches";

export default function BranchLocatorPreview() {
  return (
    <section className="py-20" id="locate">
      <div className="wrap">
        <SectionHeading eyebrow="Locate Us" title="Find your nearest HME branch"
          lead="Search by state, city or service — exchange, money transfer or currency booking collection." />
        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          {/* Replace with an embedded Google Map / Mapbox in production */}
          <div className="relative min-h-[280px] overflow-hidden rounded-card border border-line bg-gradient-to-br from-[#DCE8F7] to-[#EDF3FB] lg:min-h-[380px]"
            style={{ backgroundImage: "linear-gradient(rgba(11,46,99,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(11,46,99,.07) 1px,transparent 1px)", backgroundSize: "44px 44px" }}
            aria-hidden="true">
            <span className="absolute left-[30%] top-[28%] grid h-[34px] w-[34px] -rotate-45 place-items-center rounded-[50%_50%_50%_0] bg-brand-red shadow-lg after:h-[11px] after:w-[11px] after:rounded-full after:bg-white after:content-['']" />
            <span className="absolute left-[56%] top-[52%] grid h-[34px] w-[34px] -rotate-45 place-items-center rounded-[50%_50%_50%_0] bg-navy shadow-lg after:h-[11px] after:w-[11px] after:rounded-full after:bg-white after:content-['']" />
            <span className="absolute left-[36%] top-[16%] flex items-center gap-2 rounded-[10px] bg-white px-3 py-2 text-xs font-semibold text-navy shadow-soft">&#128205; Nearest to you &middot; 1.2 km</span>
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="flex flex-wrap gap-2.5">
              {["State", "City", "Mall / location", "Service type"].map((f) => (
                <button key={f} className="flex items-center gap-2 rounded-[10px] border border-line bg-white px-4 py-2.5 text-[13px] font-medium text-slate2 hover:border-brand-blue hover:text-brand-blue">
                  {f} <span className="text-[10px]">&#9662;</span>
                </button>
              ))}
            </div>
            {branches.map((b) => (
              <div key={b.name} className="rounded-tile border border-line bg-white p-5 transition hover:border-brand-blue hover:shadow-soft">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h4 className="font-display text-base font-bold text-navy">{b.name}</h4>
                  <span className="whitespace-nowrap rounded-full bg-[#EAF7F0] px-2.5 py-1 text-[11px] font-bold text-[#1E9E5A]">Open now</span>
                </div>
                <p className="text-[13px] text-slate2">{b.address}</p>
                <div className="my-2.5 flex flex-wrap gap-4 text-[12.5px] text-mist">
                  <span>&#128337; {b.hours}</span>
                  <span>&#128222; {b.phone}</span>
                  <span>&#128177; {b.services.join(" \u00B7 ")}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={b.whatsapp} className="rounded-[9px] bg-[#EAF7F0] px-3.5 py-2 font-display text-[12.5px] font-bold text-[#1E9E5A]">WhatsApp</a>
                  <a href={b.mapsUrl} className="rounded-[9px] border-[1.5px] border-line px-3.5 py-2 font-display text-[12.5px] font-bold text-navy hover:border-brand-blue hover:text-brand-blue">Get Directions</a>
                </div>
              </div>
            ))}
            <Link href="/locate-us" className="btn-outline self-start">View All Branches &rarr;</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
