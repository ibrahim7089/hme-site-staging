const principles = [
  {
    title: "Clear from the start",
    copy: "Straightforward services and guidance.",
  },
  {
    title: "Secure at every step",
    copy: "Regulated operations and trained teams.",
  },
  {
    title: "Close when you need us",
    copy: "A nationwide network of 50+ locations.",
  },
];

export default function HMEStory() {
  return (
    <section className="relative isolate overflow-hidden bg-navy-deep pb-28 pt-24 text-white md:pb-36 md:pt-32">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(64,130,218,0.28),transparent_30%),linear-gradient(115deg,rgba(6,31,80,0.15),rgba(13,55,115,0.4))]"
      />
      <svg
        aria-hidden="true"
        className="absolute -right-32 top-4 h-[520px] w-[680px] opacity-[0.16]"
        viewBox="0 0 680 520"
        fill="none"
      >
        <ellipse cx="340" cy="260" rx="310" ry="172" stroke="#A9CEFF" />
        <ellipse cx="340" cy="260" rx="220" ry="172" stroke="#A9CEFF" />
        <ellipse cx="340" cy="260" rx="105" ry="172" stroke="#A9CEFF" />
        <path d="M30 260H650M58 175H622M58 345H622" stroke="#A9CEFF" />
      </svg>

      <div className="wrap relative z-[1]">
        <div className="grid gap-12 lg:grid-cols-[1.12fr_0.88fr] lg:gap-20">
          <div>
            <p className="mb-5 font-display text-xs font-extrabold uppercase tracking-[0.18em] text-[#8FC2FF]">
              The HME way
            </p>
            <h2 className="max-w-[720px] font-display text-[clamp(38px,5.2vw,66px)] font-extrabold leading-[1.04] tracking-[-0.055em]">
              Financial services should feel clear, secure and close to you.
            </h2>
          </div>

          <div className="self-end border-l border-white/20 pl-7 md:pl-9">
            <p className="text-[18px] leading-relaxed text-white/90">
              HME brings currency exchange, international transfers, booking and branch
              support into one nationwide network.
            </p>
            <p className="mt-5 text-[15px] leading-relaxed text-white/58">
              Whether you are travelling, supporting family or running a business, your
              next step stays simple and familiar.
            </p>
          </div>
        </div>

        <div className="mt-16 grid border-y border-white/15 sm:grid-cols-3 md:mt-20">
          {principles.map((principle, index) => (
            <div
              key={principle.title}
              className={`py-6 sm:px-6 md:py-7 ${index > 0 ? "border-t border-white/15 sm:border-l sm:border-t-0" : ""}`}
            >
              <span className="mb-4 block h-1.5 w-1.5 rounded-full bg-brand-red shadow-[0_0_0_5px_rgba(236,18,57,0.12)]" />
              <h3 className="font-display text-lg font-extrabold tracking-[-0.025em]">
                {principle.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/58">{principle.copy}</p>
            </div>
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-16 bg-cloud [clip-path:polygon(0_100%,100%_0,100%_100%)] md:h-24"
      />
    </section>
  );
}
