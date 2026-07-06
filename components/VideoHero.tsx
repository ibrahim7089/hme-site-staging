/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export default function VideoHero() {
  return (
    <section className="relative h-screen min-h-[580px] overflow-hidden bg-navy-deep">

      {/* Decorative globe circle — right background */}
      <svg
        aria-hidden="true"
        className="absolute right-[-10%] top-1/2 -translate-y-1/2 h-[90%] w-auto opacity-20"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="300" cy="300" r="298" stroke="#4A90D9" strokeWidth="1.5" />
        <circle cx="300" cy="300" r="220" stroke="#4A90D9" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx="300" cy="300" r="140" stroke="#4A90D9" strokeWidth="1" strokeDasharray="4 6" />
        <ellipse cx="300" cy="300" rx="298" ry="120" stroke="#4A90D9" strokeWidth="1" />
        <ellipse cx="300" cy="300" rx="298" ry="200" stroke="#4A90D9" strokeWidth="0.8" />
        <line x1="2" y1="300" x2="598" y2="300" stroke="#4A90D9" strokeWidth="0.8" />
        <line x1="300" y1="2" x2="300" y2="598" stroke="#4A90D9" strokeWidth="0.8" />
        {/* Dots */}
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <circle
              key={angle}
              cx={300 + 298 * Math.cos(rad)}
              cy={300 + 298 * Math.sin(rad)}
              r="4"
              fill="#4A90D9"
            />
          );
        })}
        {/* Glow centre */}
        <circle cx="300" cy="300" r="60" fill="#1a3a6b" />
        <circle cx="300" cy="300" r="8" fill="#4A90D9" opacity="0.8" />
      </svg>

      {/* Radial glow behind person */}
      <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(ellipse_at_center,_rgba(74,144,217,0.15)_0%,_transparent_70%)]" />

      {/* Person cutout — small at bottom on mobile, full size on desktop */}
      <img
        src="/images/hero-person.png"
        alt=""
        aria-hidden="true"
        className="absolute bottom-0 right-0 h-[52%] w-auto object-contain object-bottom md:h-[95%] md:max-h-[760px] md:right-0 lg:right-8 xl:right-16"
      />

      {/* Text — top on mobile, centered on desktop */}
      <div className="wrap relative flex h-full flex-col justify-start pt-[100px] md:justify-center md:pt-[72px] text-white">
        <div className="max-w-lg">
          <p className="mb-3 font-display text-lg font-light sm:text-xl opacity-80">This is HME.</p>
          <h1 className="text-[clamp(36px,5.5vw,64px)] font-extrabold leading-[1.08]">
            Trusted in every exchange.
          </h1>
          <p className="mt-5 text-[16px] text-white/70 sm:text-[18px] leading-relaxed">
            Currency exchange, international money transfer and currency booking —
            one licensed Malaysian MSB network, 50+ locations nationwide.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/rates" className="btn-red">Check Today&rsquo;s Rates</Link>
            <Link href="/locate-us" className="btn-ghost backdrop-blur">Find a Branch</Link>
          </div>
        </div>
      </div>

      <a href="#services" aria-label="Scroll down"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 transition hover:text-white">
        <ChevronDown className="h-8 w-8 animate-bounce" />
      </a>
    </section>
  );
}
