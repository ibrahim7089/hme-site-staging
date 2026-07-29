/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Building2, Users, ShieldCheck, Star, Target, Eye, Gem, ArrowRight } from "lucide-react";
import { getPublishedPageContent } from "@/lib/cms";

export const metadata: Metadata = {
  title: "About HME | Licensed Malaysian Money Services Business",
  description:
    "Hasani Munawarah Exchange Sdn Bhd (HME) is a licensed Malaysian MSB providing currency exchange, international money transfer and currency booking services.",
};

const stats = [
  { icon: Building2, value: "50+", label: "Locations Nationwide" },
  { icon: Users, value: "Millions", label: "Customers Served" },
  { icon: ShieldCheck, value: "Licensed", label: "& Regulated MSB" },
  { icon: Star, value: "Since 1980", label: "Trusted Heritage" },
];

const pillars = [
  {
    icon: Target,
    title: "Our Mission",
    body: "To make currency exchange and international money transfer simple, accessible, and trustworthy for individuals, families, and businesses across Malaysia.",
  },
  {
    icon: Eye,
    title: "Our Vision",
    body: "To be Malaysia's most trusted and accessible money services business — recognised for integrity, competitive rates, and exceptional customer care.",
  },
  {
    icon: Gem,
    title: "Our Values",
    items: ["Integrity", "Customer Focus", "Teamwork", "Excellence"],
  },
];

export default async function AboutPage() {
  const managed = await getPublishedPageContent("about");
  const hero = managed?.hero;
  return (
    <>
      <section className="hidden overflow-hidden bg-white lg:block">
        <div className="about-hero-banner relative mx-auto">
          <Image
            src={hero?.image || "/images/about-us-banner.webp"}
            alt={hero?.imageAlt || "Hasani Munawarah Exchange corporate overview and nationwide service network"}
            fill
            priority
            quality={88}
            sizes="(min-width: 1536px) 1536px, 100vw"
            className="object-contain"
          />
          <div className="sr-only">
            <h1>{hero?.title || "About Hasani Munawarah Exchange"}</h1>
            <p>
              {hero?.lead ||
                "A trusted Malaysian money services business delivering reliable currency exchange and remittance services through a growing nationwide network."}
            </p>
          </div>
        </div>
      </section>

      {/* ── 1. Hero ── */}
      <section className="relative isolate min-h-[100svh] overflow-hidden bg-navy-deep text-white lg:hidden">
        {/* Dot grid texture */}
        <div className="hero-grid absolute inset-0 opacity-30" aria-hidden="true" />

        {/* Radial glow + diagonal gradient */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_25%_55%,rgba(49,128,232,0.32),transparent_45%),linear-gradient(120deg,#071E44_0%,#0B2E63_55%,#071E44_100%)]"
        />

        {/* Ghost rings — top-right corner */}
        <div aria-hidden="true" className="absolute -right-20 -top-20 h-80 w-80 rounded-full border border-white/[0.08]" />
        <div aria-hidden="true" className="absolute right-4 top-4 h-52 w-52 rounded-full border border-white/[0.08]" />

        {/* Blurred glow blobs */}
        <div aria-hidden="true" className="absolute bottom-16 left-[35%] h-48 w-48 rounded-full bg-brand-blue/20 blur-3xl" />
        <div aria-hidden="true" className="absolute top-20 right-[42%] h-32 w-32 rounded-full bg-brand-blue/10 blur-2xl" />

        {/* Faint orrery SVG — behind copy, left side */}
        <svg
          aria-hidden="true"
          className="absolute left-[-8%] top-1/2 hidden h-[460px] w-[460px] -translate-y-1/2 opacity-[0.06] lg:block"
          viewBox="0 0 240 240" fill="none" stroke="white" strokeWidth="1"
        >
          <circle cx="120" cy="120" r="116" />
          <ellipse cx="120" cy="120" rx="116" ry="45" />
          <ellipse cx="120" cy="120" rx="48" ry="116" />
          <path d="M4 120h232M120 4v232" />
        </svg>

        {/* Content — flex row on desktop */}
        <div className="wrap relative z-10 flex min-h-[100svh] flex-col justify-center gap-10 pb-16 pt-28 lg:flex-row lg:items-center lg:gap-14 lg:pb-0 lg:pt-0">

          {/* Left: copy */}
          <div className="hero-copy lg:w-[46%] lg:flex-none">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-red">
              {hero?.eyebrow || "About Us"}
            </p>
            <h1 className="text-[clamp(34px,4.5vw,58px)] font-extrabold leading-[1.08] tracking-[-0.02em]">
              {hero?.title || <>About Hasani<br />Munawarah Exchange</>}
            </h1>
            <div className="mt-4 h-[3px] w-12 rounded-full bg-brand-red" />
            <p className="mt-5 max-w-[420px] text-[15px] leading-relaxed text-white/75">
              {hero?.lead || "A trusted Malaysian money services business built on decades of experience, strong compliance standards, and a genuine commitment to serving our communities."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/#services" className="btn-red">
                Our Services <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/locate-us" className="btn-ghost backdrop-blur">
                Find a Location
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-6">
              {["Licensed MSB", "Since 1980", "50+ Locations"].map((badge) => (
                <div key={badge} className="flex items-center gap-2 text-[12.5px] text-white/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                  {badge}
                </div>
              ))}
            </div>
          </div>

          {/* Right: contained photo with frame */}
          <div className="hero-person flex-1 lg:flex-none lg:w-[50%]">
            <div className="relative">
              {/* Decorative offset frame */}
              <div className="absolute -bottom-4 -right-4 h-full w-full rounded-2xl border border-brand-red/30" aria-hidden="true" />
              {/* Second outer ring */}
              <div className="absolute -bottom-8 -right-8 h-full w-full rounded-3xl border border-white/10" aria-hidden="true" />

              {/* Photo card */}
              <div className="relative overflow-hidden rounded-2xl shadow-deep">
                <img
                  src={hero?.image || "/images/about-hero.jpg"}
                  alt={hero?.imageAlt || "HME LG-K08A branch counter"}
                  className="h-[300px] w-full object-cover sm:h-[380px] lg:h-[500px]"
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 2. Who We Are ── */}
      <section className="scroll-reveal bg-[#F8FAFF] py-20">
        <div className="wrap grid items-center gap-12 lg:grid-cols-2">
          {/* Photo left — red accent strip + deep shadow */}
          <div className="flex gap-0">
            <div className="w-1 flex-none self-stretch rounded-l-full bg-brand-red" />
            <div className="overflow-hidden rounded-r-2xl shadow-deep">
              <img
                src="/images/about-who-we-are.jpg"
                alt="HME branch exterior"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Text right */}
          <div className="scroll-reveal">
            <span className="eyebrow">Who We Are</span>
            <h2 className="sec-title mt-3">Who We Are</h2>
            <div className="mt-3 h-[3px] w-10 rounded-full bg-brand-red" />
            <p className="mt-5 text-[15px] leading-relaxed text-slate2">
              Hasani Munawarah Exchange Sdn. Bhd. is a licensed Money Services Business in Malaysia,
              providing trusted currency exchange and remittance services across our growing branch
              network.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-slate2">
              In July 2022, Hasani Munawarah Exchange was formed through the coming together of
              Munawarah Exchange and Hasani Bumi Identiti — combining decades of experience, deep
              community trust, and a shared vision to serve customers better.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-slate2">
              Our roots date back to 1980, giving us a heritage of reliability that customers across
              Malaysia continue to depend on for their currency exchange and international money
              transfer needs.
            </p>
            <Link
              href="#our-growth"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-navy-deep px-6 py-3 text-sm font-semibold text-white transition hover:brightness-125"
            >
              Learn More About Us <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. Our Growth ── */}
      <section className="scroll-mt-24 py-20" id="our-growth">
        <div className="wrap grid items-center gap-12 lg:grid-cols-2">
          {/* Text left */}
          <div className="scroll-reveal">
            <span className="eyebrow">Our Growth</span>
            <h2 className="sec-title mt-3">Growing Closer to<br />Our Customers</h2>
            <div className="mt-3 h-[3px] w-10 rounded-full bg-brand-red" />
            <p className="mt-5 text-[15px] leading-relaxed text-slate2">
              From a single exchange counter to a nationwide network of 50+ locations,
              HME&apos;s growth story is powered by trust earned one customer at a time. We continue to
              expand into new communities, bringing competitive rates and reliable financial services
              closer to the people who need them.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-slate2">
              Every new branch we open is a commitment — to the neighbourhood, to our team, and to
              the millions of Malaysians who count on us for safe, transparent money services.
            </p>
          </div>

          {/* Photo right — with gradient overlay */}
          <div className="scroll-reveal relative overflow-hidden rounded-2xl shadow-deep">
            <img
              src="/images/about-growth.jpg"
              alt="HME branch opening celebration"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/30 to-transparent" />
          </div>
        </div>
      </section>

      {/* ── 4. Stats bar — dark navy ── */}
      <section className="relative overflow-hidden bg-navy-deep py-14 text-white">
        <div className="hero-grid absolute inset-0 opacity-20" aria-hidden="true" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(49,128,232,0.20),transparent_70%)]"
        />
        <div className="wrap relative z-10 grid grid-cols-2 gap-10 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-3 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20">
                <s.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <div className="text-[22px] font-extrabold">{s.value}</div>
                <div className="mt-0.5 text-[12.5px] text-white/65">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Mission, Vision & Values ── */}
      <section className="py-20" style={{ background: "linear-gradient(160deg,#F4F7FB 0%,#EAF0FC 100%)" }}>
        <div className="wrap">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <span className="eyebrow">What Drives Us</span>
            <h2 className="sec-title mt-3">Our Mission, Vision &amp; Values</h2>
            <div className="mx-auto mt-3 h-[3px] w-10 rounded-full bg-brand-red" />
          </div>

          <div className="scroll-reveal grid gap-6 sm:grid-cols-3">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border-t-2 border-brand-blue bg-white p-7 shadow-soft"
              >
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand-blue text-white">
                  <p.icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="mb-3 text-[17px] font-bold text-navy-deep">{p.title}</h3>
                {p.body && (
                  <p className="text-[14px] leading-relaxed text-slate2">{p.body}</p>
                )}
                {p.items && (
                  <ul className="space-y-2">
                    {p.items.map((item) => (
                      <li key={item} className="flex items-center gap-2.5 text-[14px] text-slate2">
                        <span className="grid h-5 w-5 flex-none place-items-center rounded bg-brand-bluesoft text-[11px] font-extrabold text-brand-blue">
                          ✓
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. CTA banner ── */}
      <section className="relative overflow-hidden bg-navy-deep py-16 text-white">
        <div className="hero-grid absolute inset-0 opacity-20" aria-hidden="true" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(49,128,232,0.35),transparent_60%)]"
        />
        <div aria-hidden="true" className="absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/10" />
        <div aria-hidden="true" className="absolute right-10 top-6 h-44 w-44 rounded-full border border-white/10" />
        <div className="wrap relative z-10 flex flex-col items-center gap-6 text-center">
          <h2 className="text-[clamp(22px,3vw,34px)] font-extrabold leading-tight">
            Find Your Nearest HME Location
          </h2>
          <p className="max-w-md text-[15px] leading-relaxed text-white/70">
            With 50+ locations across Malaysia, there&apos;s an HME near you ready to serve your
            currency exchange and money transfer needs.
          </p>
          <Link href="/locate-us" className="btn-red">
            View All Locations <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
