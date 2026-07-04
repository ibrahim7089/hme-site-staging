import SectionHeading from "./SectionHeading";

const points = [
  "Trusted Malaysian MSB network",
  "Competitive and transparent rates",
  "Currency exchange and money transfer in one place",
  "Convenient branch locations nationwide",
  "Friendly, multilingual customer service",
  "Compliance-focused, secure operations",
];

export default function WhyChooseHME() {
  return (
    <section className="py-20">
      <div className="wrap grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-card bg-gradient-to-br from-navy to-navy-deep p-8 text-white shadow-deep">
          <div className="mb-5 font-display text-[22px] font-extrabold leading-snug">
            Built like a financial institution.<br />Run for everyday customers.
          </div>
          {[
            "Licensed and regulated Malaysian MSB",
            "Exchange and money transfer under one brand",
            "Compliance-focused operations, AML/CFT trained teams",
            "Convenient branches with friendly service",
          ].map((t, i) => (
            <div key={t} className="flex items-center gap-3.5 border-t border-white/10 py-3">
              <span className="w-7 flex-none font-mono text-xs text-[#7FB2F5]">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-sm text-[#D7E3F6]">{t}</span>
            </div>
          ))}
        </div>
        <div>
          <SectionHeading eyebrow="Why Choose HME"
            title="Trusted by travellers, workers, families and businesses" />
          <div className="mt-7 grid gap-3.5 sm:grid-cols-2">
            {points.map((p) => (
              <div key={p} className="flex items-start gap-3 rounded-tile border border-line bg-white p-4">
                <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-lg bg-brand-bluesoft text-[13px] font-extrabold text-brand-blue">&#10003;</span>
                <p className="text-[13.5px] font-medium leading-snug">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
