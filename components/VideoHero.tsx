import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  BadgeDollarSign,
  Globe2,
  MapPin,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import heroPerson from "@/public/images/hero-person.webp";

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Licensed & regulated",
    copy: "By Bank Negara Malaysia",
  },
  {
    icon: UsersRound,
    title: "Trusted nationwide",
    copy: "Individuals & businesses",
  },
  {
    icon: Globe2,
    title: "50+ locations",
    copy: "Across Malaysia",
  },
];

const serviceBenefits = [
  {
    icon: Globe2,
    title: "Global reach",
  },
  {
    icon: ShieldCheck,
    title: "Secure transfers",
  },
  {
    icon: BadgeDollarSign,
    title: "Better value",
  },
];

export default function VideoHero() {
  return (
    <section className="hero-stage relative isolate min-h-[800px] overflow-hidden bg-navy-deep text-white sm:min-h-[820px] md:min-h-[max(700px,100svh)] xl:min-h-[max(720px,100svh)]">
      <div className="hero-grid absolute inset-0 opacity-35" aria-hidden="true" />
      <div className="hero-premium-glow absolute inset-0" aria-hidden="true" />
      <div className="hero-wave hero-wave-back" aria-hidden="true" />
      <div className="hero-wave hero-wave-front" aria-hidden="true" />

      <svg
        aria-hidden="true"
        className="hero-network absolute left-[31%] top-[2%] z-[1] hidden h-[72%] w-[54%] opacity-25 md:block"
        viewBox="0 0 760 520"
        fill="none"
      >
        <path d="M36 315C178 65 502 42 714 162" stroke="#BBD7FF" strokeWidth="1.2" />
        <path d="M28 355C206 135 490 119 730 232" stroke="#BBD7FF" strokeWidth="1" />
        <path d="M85 404C245 222 497 206 708 302" stroke="#BBD7FF" strokeWidth="0.8" />
        <path d="M169 54C294 145 365 265 388 474" stroke="#BBD7FF" strokeWidth="0.8" />
        <path d="M392 25C431 147 432 302 384 482" stroke="#BBD7FF" strokeWidth="0.8" />
        <path d="M597 72C493 164 427 285 386 479" stroke="#BBD7FF" strokeWidth="0.8" />
        {[
          [36, 315],
          [169, 54],
          [388, 474],
          [597, 72],
          [714, 162],
          [730, 232],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="#E7F1FF" />
        ))}
      </svg>

      <Image
        src={heroPerson}
        alt="HME customer ready to exchange or send money"
        priority
        quality={82}
        sizes="(max-width: 767px) 88vw, (max-width: 1279px) 54vw, 46vw"
        className="hero-person absolute bottom-0 right-[-18%] z-[4] h-[48%] w-auto max-w-none object-contain object-bottom sm:right-[-2%] sm:h-[51%] md:right-[3%] md:h-[84%] lg:right-[7%] lg:h-[89%] xl:right-[11%] xl:h-[92%]"
      />

      <div className="wrap relative z-10 flex min-h-[800px] items-start pb-[400px] pt-[132px] sm:min-h-[820px] sm:pb-[420px] md:min-h-[max(700px,100svh)] md:items-center md:pb-[148px] md:pt-[110px] xl:min-h-[max(720px,100svh)]">
        <div className="hero-copy max-w-[640px] md:w-[51%] lg:w-[50%]">
          <h1 className="max-w-[9.5ch] text-[clamp(45px,6.2vw,76px)] font-extrabold leading-[0.98] tracking-[-0.055em] text-white">
            Money moves.<br />
            Trust stays<span className="text-brand-red">.</span>
          </h1>
          <p className="mt-6 max-w-[535px] text-[15px] leading-relaxed text-white/80 sm:text-[17px]">
            Exchange foreign currency and send money overseas through HME&apos;s nationwide
            network of 50+ locations.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#services" className="btn-red min-w-[190px]">
              View Our Services
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/locate-us" className="btn-ghost min-w-[170px] backdrop-blur">
              Find a Branch
              <MapPin className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 hidden grid-cols-3 md:grid">
            {trustPoints.map(({ icon: Icon, title, copy }, index) => (
              <div
                key={title}
                className={`flex items-center gap-3 pr-3 ${index > 0 ? "border-l border-white/20 pl-3" : ""}`}
              >
                <span className="grid h-9 w-9 flex-none place-items-center rounded-xl border border-white/25 bg-white/5">
                  <Icon className="h-[18px] w-[18px] text-[#B6D7FF]" strokeWidth={1.8} />
                </span>
                <span>
                  <b className="block text-[11px] font-semibold capitalize text-white">{title}</b>
                  <small className="mt-0.5 block text-[8px] leading-tight text-white/58">{copy}</small>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute right-[3%] top-[170px] z-[8] hidden w-[170px] space-y-4 xl:block">
        {serviceBenefits.map(({ icon: Icon, title }) => (
          <div key={title} className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 flex-none place-items-center rounded-full border border-white/75 bg-white/90 shadow-md">
              <Icon className="h-4 w-4 text-navy" strokeWidth={2} />
            </span>
            <b className="hero-benefit-title text-[11px] font-bold capitalize">{title}</b>
          </div>
        ))}
      </div>

      <a
        href="#services"
        aria-label="Explore HME services"
        className="absolute bottom-5 right-5 z-20 hidden h-12 w-12 place-items-center rounded-full border border-white/15 bg-navy/55 text-white/80 backdrop-blur transition hover:bg-white/15 hover:text-white md:grid"
      >
        <ArrowDownToLine className="h-5 w-5" />
      </a>
    </section>
  );
}
