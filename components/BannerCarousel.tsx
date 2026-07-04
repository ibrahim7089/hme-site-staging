"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    image: "/images/banner-1.jpg",
    eyebrow: "This is HME.",
    headline: "Trusted in every exchange.",
  },
  {
    image: "/images/banner-2.jpg",
    eyebrow: "50+ locations, Malaysia-wide.",
    headline: "One nationwide network.",
  },
  {
    image: "/images/banner-3.jpg",
    eyebrow: "Growing fast.",
    headline: "One of the fastest-growing MSB networks in Malaysia.",
  },
];

export default function BannerCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, []);

  const go = (dir: number) => setActive((i) => (i + dir + slides.length) % slides.length);

  return (
    <section className="relative h-[380px] overflow-hidden bg-navy-deep sm:h-[440px] md:h-[520px]">
      {slides.map((s, i) => (
        <div key={s.image}
          className={`absolute inset-0 transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-0"}`}>
          <Image src={s.image} alt={s.headline} fill priority={i === 0} sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/85 via-navy-deep/35 to-transparent" />
        </div>
      ))}

      <div className="wrap relative flex h-full items-center pl-16 pr-14 sm:pl-20 sm:pr-16">
        <div className="max-w-lg text-white">
          <p className="mb-2 font-display text-lg font-light sm:text-2xl">{slides[active].eyebrow}</p>
          <h2 className="text-[clamp(24px,4vw,44px)] font-extrabold leading-tight">{slides[active].headline}</h2>
        </div>
      </div>

      <button aria-label="Previous slide" onClick={() => go(-1)}
        className="absolute left-4 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:left-8">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button aria-label="Next slide" onClick={() => go(1)}
        className="absolute right-4 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:right-8">
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((s, i) => (
          <button key={s.image} aria-label={`Go to slide ${i + 1}`} onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-white" : "w-1.5 bg-white/40"}`} />
        ))}
      </div>
    </section>
  );
}
