import type { Metadata } from "next";
import { ShieldCheck, DollarSign, Star, MapPin } from "lucide-react";

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

export default function AboutPage() {
  return (
    <>
      <section className="bg-[radial-gradient(900px_420px_at_80%_-20%,#164C9E_0%,#0B2E63_45%,#071E44_100%)] pb-16 pt-[88px] text-white md:pb-20 md:pt-24">
        <div className="wrap">
          <h1 className="max-w-2xl text-[clamp(36px,4.5vw,58px)] font-extrabold leading-[1.12]">
            Built on trust.<br />Driven by service.
          </h1>
          <div className="mt-4 h-[3px] w-14 rounded-full bg-brand-red" />
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[#B9C8E0]">
            Your trusted partner for foreign currency exchange, money transfer and financial services.
            Serving individuals, families and businesses across Malaysia.
          </p>
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
      </section>

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
    </>
  );
}
