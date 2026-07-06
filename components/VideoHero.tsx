/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export default function VideoHero() {
  return (
    <section className="relative h-screen min-h-[580px] overflow-hidden bg-navy-deep">
      {/* Person cutout — right side, bottom-anchored, blended via multiply */}
      <img
        src="/images/hero-person.png"
        alt=""
        aria-hidden="true"
        style={{ mixBlendMode: "multiply" }}
        className="absolute bottom-0 right-0 h-[90%] max-h-[720px] w-auto object-contain object-bottom lg:right-12 xl:right-24"
      />

      <div className="wrap relative flex h-full flex-col justify-center pt-[72px] text-white">
        <div className="max-w-lg">
          <p className="mb-3 font-display text-lg font-light sm:text-2xl">This is HME.</p>
          <h1 className="text-[clamp(32px,5.5vw,60px)] font-extrabold leading-[1.08]">
            Trusted in every exchange.
          </h1>
          <p className="mt-4 text-[16px] text-white/80 sm:text-[17.5px]">
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
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 transition hover:text-white">
        <ChevronDown className="h-8 w-8 animate-bounce" />
      </a>
    </section>
  );
}
