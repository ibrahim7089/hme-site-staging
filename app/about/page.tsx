/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Users, ShieldCheck, Star, Target, Eye, Gem, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About HME | Licensed Malaysian Money Services Business",
  description:
    "Hasani Munawarah Exchange Sdn Bhd (HME) is a licensed Malaysian MSB providing currency exchange, international money transfer and currency booking services.",
};

const stats = [
  { icon: Building2, value: "40+", label: "Service Locations" },
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

export default function AboutPage() {
  return (
    <>
      {/* ── 1. Hero ── */}
      <section className="bg-[#071E44] pt-[88px] pb-0 text-white md:pt-24">
        <div className="wrap grid items-center gap-10 lg:grid-cols-2 lg:gap-0">
          {/* left */}
          <div className="py-14 md:py-20 lg:pr-12">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-red">
              About Us
            </p>
            <h1 className="text-[clamp(34px,4vw,54px)] font-extrabold leading-[1.1]">
              About Hasani<br />Munawarah Exchange
            </h1>
            <div className="mt-4 h-[3px] w-12 rounded-full bg-brand-red" />
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#B9C8E0]">
              A trusted Malaysian money services business built on decades of experience, strong
              compliance standards, and a genuine commitment to serving our communities.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-full bg-brand-red px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Our Services <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/locate-us"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Find a Location
              </Link>
            </div>
          </div>

          {/* right — photo */}
          <div className="hidden lg:block h-full min-h-[500px] overflow-hidden rounded-tl-[40px]">
            <img
              src="/images/about-hero.jpg"
              alt="HME branch counter"
              className="h-full w-full object-cover"
            />
          </div>
          {/* mobile photo */}
          <div className="lg:hidden -mx-4 overflow-hidden">
            <img
              src="/images/about-hero.jpg"
              alt="HME branch counter"
              className="h-56 w-full object-cover object-center sm:h-72"
            />
          </div>
        </div>
      </section>

      {/* ── 2. Who We Are ── */}
      <section className="py-20">
        <div className="wrap grid items-center gap-12 lg:grid-cols-2">
          {/* photo left */}
          <div className="overflow-hidden rounded-2xl shadow-lg">
            <img
              src="/images/about-who-we-are.jpg"
              alt="HME branch exterior"
              className="h-full w-full object-cover"
            />
          </div>

          {/* text right */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-red">
              Who We Are
            </p>
            <h2 className="text-[clamp(26px,3vw,38px)] font-extrabold leading-tight text-navy-deep">
              Who We Are
            </h2>
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
              href="/services"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-navy-deep px-6 py-3 text-sm font-semibold text-white transition hover:brightness-125"
            >
              Learn More About Us <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. Our Growth ── */}
      <section className="bg-cloud py-20">
        <div className="wrap grid items-center gap-12 lg:grid-cols-2">
          {/* text left */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-red">
              Our Growth
            </p>
            <h2 className="text-[clamp(26px,3vw,38px)] font-extrabold leading-tight text-navy-deep">
              Growing Closer to<br />Our Customers
            </h2>
            <div className="mt-3 h-[3px] w-10 rounded-full bg-brand-red" />
            <p className="mt-5 text-[15px] leading-relaxed text-slate2">
              From a single exchange counter to a nationwide network of over 40 service locations,
              HME's growth story is powered by trust earned one customer at a time. We continue to
              expand into new communities, bringing competitive rates and reliable financial services
              closer to the people who need them.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-slate2">
              Every new branch we open is a commitment — to the neighbourhood, to our team, and to
              the millions of Malaysians who count on us for safe, transparent money services.
            </p>
          </div>

          {/* photo right */}
          <div className="overflow-hidden rounded-2xl shadow-lg">
            <img
              src="/images/about-growth.jpg"
              alt="HME branch opening celebration"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── 4. Stats bar ── */}
      <section className="border-y border-line py-12">
        <div className="wrap grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-3 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-bluesoft text-brand-blue">
                <s.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <div className="text-[22px] font-extrabold text-navy-deep">{s.value}</div>
                <div className="mt-0.5 text-[12.5px] font-medium text-slate2">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Mission, Vision & Values ── */}
      <section className="py-20">
        <div className="wrap">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-red">
              What Drives Us
            </p>
            <h2 className="text-[clamp(24px,3vw,36px)] font-extrabold text-navy-deep">
              Our Mission, Vision &amp; Values
            </h2>
            <div className="mx-auto mt-3 h-[3px] w-10 rounded-full bg-brand-red" />
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-line bg-white p-7 shadow-sm"
              >
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand-bluesoft text-brand-blue">
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
      <section className="bg-[#071E44] py-16 text-white">
        <div className="wrap flex flex-col items-center gap-6 text-center">
          <h2 className="text-[clamp(22px,3vw,34px)] font-extrabold leading-tight">
            Find Your Nearest HME Location
          </h2>
          <p className="max-w-md text-[15px] leading-relaxed text-[#B9C8E0]">
            With 40+ branches across Malaysia, there&apos;s an HME near you ready to serve your
            currency exchange and money transfer needs.
          </p>
          <Link
            href="/locate-us"
            className="inline-flex items-center gap-2 rounded-full bg-brand-red px-7 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            View All Locations <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
