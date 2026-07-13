import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, MapPin } from "lucide-react";
import heroPerson from "@/public/images/hero-person.webp";

export default function VideoHero() {
  return (
    <section className="hero-stage relative isolate min-h-[100svh] overflow-hidden bg-navy-deep text-white">
      <div className="hero-grid absolute inset-0 opacity-40" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_72%_44%,rgba(49,128,232,0.28),transparent_38%),linear-gradient(115deg,#071E44_0%,#0B2E63_54%,#071E44_100%)]"
        aria-hidden="true"
      />

      <svg
        aria-hidden="true"
        className="hero-orbit absolute -right-[28%] bottom-[3%] h-[58%] w-auto opacity-45 sm:-right-[8%] sm:h-[70%] md:right-[2%] md:top-1/2 md:h-[80%] md:-translate-y-1/2 lg:right-[5%] lg:h-[88%]"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="300" cy="300" r="298" stroke="#4A90D9" strokeWidth="1.5" />
        <circle cx="300" cy="300" r="220" stroke="#4A90D9" strokeWidth="1" strokeDasharray="4 7" />
        <circle cx="300" cy="300" r="140" stroke="#4A90D9" strokeWidth="1" strokeDasharray="4 7" />
        <ellipse cx="300" cy="300" rx="298" ry="120" stroke="#4A90D9" />
        <ellipse cx="300" cy="300" rx="298" ry="200" stroke="#4A90D9" strokeWidth="0.8" />
        <line x1="2" y1="300" x2="598" y2="300" stroke="#4A90D9" strokeWidth="0.8" />
        <line x1="300" y1="2" x2="300" y2="598" stroke="#4A90D9" strokeWidth="0.8" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => {
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
        <circle cx="300" cy="300" r="60" fill="#1A3A6B" />
        <circle cx="300" cy="300" r="8" fill="#7EB7F5" />
      </svg>

      <Image
        src={heroPerson}
        alt=""
        aria-hidden="true"
        priority
        quality={82}
        sizes="(max-width: 767px) 88vw, (max-width: 1279px) 52vw, 46vw"
        className="hero-person absolute bottom-0 right-[-12%] z-[1] h-[45%] w-auto max-w-none object-contain object-bottom sm:right-[2%] sm:h-[50%] md:right-[2%] md:h-[79%] lg:right-[8%] lg:h-[88%] xl:right-[11%] xl:h-[91%]"
      />

      <div className="wrap relative z-10 flex min-h-[100svh] items-start pb-[43vh] pt-[116px] sm:pb-[46vh] md:items-center md:pb-12 md:pt-[96px]">
        <div className="hero-copy max-w-[650px] md:w-[54%] lg:w-[55%]">
          <h1 className="max-w-[12ch] text-[clamp(42px,7vw,82px)] font-extrabold leading-[0.98] tracking-[-0.055em]">
            Money moves. Trust stays.
          </h1>
          <p className="mt-6 max-w-[590px] text-[16px] leading-relaxed text-white/72 sm:text-[18px]">
            Exchange foreign currency and send money overseas through HME’s nationwide
            network of 50+ locations.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#services" className="btn-red">
              View Our Services
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/locate-us" className="btn-ghost backdrop-blur">
              <MapPin className="h-4 w-4" />
              Find a Branch
            </Link>
          </div>

        </div>
      </div>

      <a
        href="#services"
        aria-label="Explore HME services"
        className="absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/55 transition hover:text-white md:flex"
      >
        Scroll
        <ChevronDown className="h-5 w-5 animate-bounce" />
      </a>
    </section>
  );
}
