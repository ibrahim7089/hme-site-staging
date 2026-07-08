/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { ShieldCheck, DollarSign, Star, MapPin, ArrowLeftRight, Headphones } from "lucide-react";
import WhyChooseHME from "@/components/WhyChooseHME";
import ComplianceTrustSection from "@/components/ComplianceTrustSection";

export const metadata: Metadata = {
  title: "About HME | Licensed Malaysian Money Services Business",
  description:
    "Hasani Munawarah Exchange Sdn Bhd (HME) is a licensed Malaysian MSB providing currency exchange, international money transfer and currency booking services.",
};

const heroBadges = [
  { icon: ShieldCheck, line1: "Licensed &", line2: "Regulated" },
  { icon: DollarSign, line1: "Competitive", line2: "Rates" },
  { icon: Star, line1: "Trusted by", line2: "Millions" },
  { icon: MapPin, line1: "50+ Locations", line2: "Nationwide" },
];

const featureItems = [
  { icon: ShieldCheck, label: "Licensed MSB", sub: "Money Services Business", red: false },
  { icon: null, label: "50+ Locations", sub: "Nationwide", red: true, num: "50" },
  { icon: ArrowLeftRight, label: "Multiple Currencies", sub: "Available", red: false },
  { icon: ShieldCheck, label: "Secure Service", sub: "Reliable transactions", red: false },
  { icon: Headphones, label: "Customer Support", sub: "Professional service", red: true },
];

export default function AboutPage() {
  return (
    <>
      {/* Split hero */}
      <section className="bg-[radial-gradient(ellipse_900px_600px_at_20%_50%,#164C9E_0%,#0B2E63_45%,#071E44_100%)] pt-[88px] pb-10 text-white">
        <div className="wrap grid gap-10 py-10 lg:grid-cols-2 lg:items-center lg:gap-14 lg:py-14">
          {/* Left: headline + badges */}
          <div>
            <h1 className="text-[clamp(36px,4.5vw,58px)] font-extrabold leading-[1.12]">
              Built on trust.<br />Driven by service.
            </h1>
            <div className="mt-4 h-[3px] w-14 rounded-full bg-brand-red" />
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[#B9C8E0]">
              Your trusted partner for foreign currency exchange, money transfer and financial services.
            </p>
            <p className="mt-1.5 max-w-sm text-[15px] leading-relaxed text-[#B9C8E0]">
              Serving individuals, families and businesses across Malaysia.
            </p>
            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap items-center gap-y-4 divide-x divide-white/20">
              {heroBadges.map((b) => (
                <div key={b.line1} className="flex items-center gap-2.5 px-4 first:pl-0">
                  <div className="grid h-10 w-10 flex-none place-items-center rounded-full border border-white/30 bg-white/10">
                    <b.icon className="h-[17px] w-[17px]" strokeWidth={2.25} />
                  </div>
                  <div className="text-[11.5px] font-bold leading-snug">
                    <div>{b.line1}</div>
                    <div className="font-normal text-[#B9C8E0]">{b.line2}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: photo grid */}
          <div className="grid gap-3">
            <img
              src="/images/aboutus-counter.png"
              alt="HME currency exchange counter"
              className="h-56 w-full rounded-2xl object-cover lg:h-64"
            />
            <div className="grid grid-cols-2 gap-3">
              <img
                src="/images/currency-exchange-counter.png"
                alt="HME branch interior"
                className="h-40 w-full rounded-2xl object-cover"
              />
              <img
                src="/images/branches-counter.png"
                alt="HME branch network"
                className="h-40 w-full rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <div className="border-y border-line bg-white">
        <div className="wrap grid grid-cols-2 gap-x-6 gap-y-4 py-5 sm:grid-cols-3 md:grid-cols-5">
          {featureItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`grid h-9 w-9 flex-none place-items-center rounded-full text-white ${item.red ? "bg-brand-red" : "bg-brand-blue"}`}>
                {item.num ? (
                  <span className="text-[11px] font-extrabold">{item.num}</span>
                ) : (
                  item.icon && <item.icon className="h-[15px] w-[15px]" strokeWidth={2.5} />
                )}
              </div>
              <div>
                <p className="text-[12.5px] font-bold text-navy">{item.label}</p>
                <p className="text-[11px] text-slate2">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Body content */}
      <section className="py-20">
        <div className="wrap max-w-3xl">
          <h2 className="sec-title !text-2xl">Who we are</h2>
          <p className="text-slate2 leading-relaxed">
            Hasani Munawarah Exchange Sdn. Bhd. is a licensed Money Services Business in Malaysia,
            providing trusted currency exchange and remittance services to customers across our
            growing branch network.
          </p>
          <h2 className="sec-title !text-2xl mt-10">Our journey</h2>
          <p className="text-slate2 leading-relaxed">
            Our journey is built on years of experience in the money services industry, with roots
            dating back to 1980. In July 2022, Hasani Munawarah Exchange was formed through the
            coming together of Munawarah Exchange and Hasani Bumi Identiti, combining experience,
            trust, and a shared vision to serve customers better.
          </p>
          <h2 className="sec-title !text-2xl mt-10">Our commitment</h2>
          <p className="text-slate2 leading-relaxed">
            Today, we continue to grow as a reliable exchange and remittance provider, committed to
            secure transactions, competitive rates, strong compliance standards, and friendly
            customer service. At Hasani Munawarah Exchange, we aim to make money exchange and
            international money transfer simple, accessible, and trustworthy for individuals,
            businesses, and communities.
          </p>
        </div>
      </section>
      <WhyChooseHME />
      <ComplianceTrustSection />
    </>
  );
}
