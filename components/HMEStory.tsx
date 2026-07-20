import { MapPin, ShieldCheck, Target } from "lucide-react";

const principles = [
  {
    icon: Target,
    title: "Clear from the start",
    copy: "Straightforward services and guidance.",
  },
  {
    icon: ShieldCheck,
    title: "Secure at every step",
    copy: "Regulated operations and trained teams.",
  },
  {
    icon: MapPin,
    title: "Close when you need us",
    copy: "A nationwide network of 50+ locations.",
  },
];

export default function HMEStory() {
  return (
    <section className="relative isolate overflow-hidden bg-[#041A42] pb-28 pt-24 text-white md:pb-36 md:pt-32">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_88%_14%,rgba(13,91,226,0.58),transparent_34%),radial-gradient(circle_at_53%_48%,rgba(18,70,153,0.28),transparent_42%),linear-gradient(110deg,#031637_0%,#062451_58%,#063B91_100%)]"
      />

      <svg
        aria-hidden="true"
        className="absolute -right-[12%] -top-8 h-[620px] w-[780px] opacity-70"
        viewBox="0 0 780 620"
        fill="none"
      >
        <defs>
          <radialGradient id="globeFill" cx="0" cy="0" r="1" gradientTransform="translate(515 245) rotate(90) scale(238)">
            <stop stopColor="#1680FF" stopOpacity="0.24" />
            <stop offset="0.7" stopColor="#0754CE" stopOpacity="0.12" />
            <stop offset="1" stopColor="#041A42" stopOpacity="0" />
          </radialGradient>
          <pattern id="globeDots" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.45" fill="#5BB7FF" />
          </pattern>
          <clipPath id="globeClip">
            <circle cx="515" cy="260" r="222" />
          </clipPath>
          <filter id="nodeGlow" x="-250%" y="-250%" width="600%" height="600%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="515" cy="260" r="222" fill="url(#globeFill)" />
        <g clipPath="url(#globeClip)">
          <circle cx="515" cy="260" r="220" stroke="#53B0FF" strokeOpacity="0.62" />
          <ellipse cx="515" cy="260" rx="146" ry="220" stroke="#53B0FF" strokeOpacity="0.52" />
          <ellipse cx="515" cy="260" rx="68" ry="220" stroke="#53B0FF" strokeOpacity="0.5" />
          <ellipse cx="515" cy="260" rx="220" ry="76" stroke="#53B0FF" strokeOpacity="0.46" />
          <ellipse cx="515" cy="260" rx="220" ry="154" stroke="#53B0FF" strokeOpacity="0.42" />
          <path d="M295 260H735" stroke="#53B0FF" strokeOpacity="0.48" />

          <path
            d="M365 122C396 90 449 74 500 86L538 74L586 88L606 114L641 125L656 153L641 176L605 171L586 197L554 199L534 225L495 220L466 196L438 199L418 174L383 166L365 144Z"
            fill="url(#globeDots)"
            opacity="0.96"
          />
          <path
            d="M506 214L535 224L547 250L570 267L555 292L532 285L519 258L493 248L484 229Z"
            fill="url(#globeDots)"
            opacity="0.9"
          />
          <path
            d="M576 314L608 303L642 315L658 342L647 377L615 397L581 383L563 352Z"
            fill="url(#globeDots)"
            opacity="0.92"
          />
          <path
            d="M404 207L438 211L460 241L453 279L430 316L409 356L386 342L378 302L358 271L367 235Z"
            fill="url(#globeDots)"
            opacity="0.88"
          />
        </g>

        <path
          d="M278 195C345 72 557 25 742 155"
          stroke="#5FC4FF"
          strokeWidth="1.15"
          strokeOpacity="0.85"
        />
        <path
          d="M292 328C406 129 619 113 770 242"
          stroke="#5FC4FF"
          strokeWidth="1.1"
          strokeOpacity="0.78"
        />
        <path
          d="M342 440C489 284 663 285 778 359"
          stroke="#5FC4FF"
          strokeWidth="1"
          strokeOpacity="0.68"
        />
        {[
          [304, 159],
          [477, 88],
          [650, 105],
          [708, 188],
          [415, 286],
          [574, 299],
          [679, 331],
        ].map(([cx, cy]) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="4.5"
            fill="#BDEBFF"
            filter="url(#nodeGlow)"
          />
        ))}
      </svg>

      <div className="wrap relative z-[1]">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:gap-16">
          <div>
            <p className="mb-6 font-display text-[12px] font-extrabold uppercase tracking-[0.34em] text-white/85">
              The <span className="text-brand-red">HME</span> way
            </p>
            <h2 className="max-w-[760px] font-display text-[clamp(42px,5.2vw,74px)] font-extrabold leading-[1.05] tracking-[-0.055em]">
              Financial services
              <br />
              should feel{" "}
              <span className="bg-gradient-to-r from-[#1263F3] to-[#32A2FF] bg-clip-text text-transparent">
                clear,
              </span>
              <br />
              <span className="bg-gradient-to-r from-[#1263F3] to-[#32A2FF] bg-clip-text text-transparent">
                secure
              </span>{" "}
              and{" "}
              <span className="bg-gradient-to-r from-[#1263F3] to-[#32A2FF] bg-clip-text text-transparent">
                close
              </span>{" "}
              to
              <br />
              you<span className="text-brand-red">.</span>
            </h2>
          </div>

          <div className="relative border-l-2 border-[#7BA7DD]/65 pl-8 pb-2">
            <p className="text-[18px] leading-relaxed text-white/95">
              HME brings currency exchange, international transfers, booking and branch
              support into one{" "}
              <strong className="font-extrabold text-[#2F83FF]">nationwide network.</strong>
            </p>
            <p className="mt-6 text-[15px] leading-relaxed text-white/76">
              Whether you are travelling, supporting family or running a business, your
              next step stays simple and familiar.
            </p>
          </div>
        </div>

        <div className="mt-16 grid border-y border-[#7BA7DD]/30 sm:grid-cols-3 md:mt-20">
          {principles.map(({ icon: Icon, title, copy }, index) => (
            <div
              key={title}
              className={`grid items-center gap-5 py-7 sm:px-5 md:grid-cols-[88px_1fr] md:py-8 ${index > 0 ? "border-t border-[#7BA7DD]/30 sm:border-l sm:border-t-0" : ""}`}
            >
              <span className="relative grid h-[88px] w-[88px] place-items-center rounded-full border border-[#2582F7]/70 bg-[radial-gradient(circle_at_50%_35%,rgba(34,127,255,0.42),rgba(5,39,91,0.92))] shadow-[inset_0_0_0_12px_rgba(7,47,111,0.42),0_0_35px_rgba(11,94,224,0.18)]">
                <span className="absolute -inset-3 rounded-full border border-[#2582F7]/28" />
                <Icon className="h-10 w-10 text-white" strokeWidth={1.8} />
              </span>
              <span>
                <span className="mb-3 block h-2 w-2 rounded-full bg-brand-red shadow-[0_0_0_5px_rgba(236,18,57,0.12)]" />
                <h3 className="font-display text-[17px] font-extrabold tracking-[-0.025em]">
                  {title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/72">{copy}</p>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-16 bg-cloud [clip-path:polygon(0_100%,100%_66%,100%_100%)] md:h-24"
      />
    </section>
  );
}
