import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import WhyChooseHME from "@/components/WhyChooseHME";
import ComplianceTrustSection from "@/components/ComplianceTrustSection";

export const metadata: Metadata = {
  title: "About HME | Licensed Malaysian Money Services Business",
  description:
    "Hasani Munawarah Exchange Sdn Bhd (HME) is a licensed Malaysian MSB providing currency exchange, international money transfer and currency booking services.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About HME"
        title="A Malaysian exchange house built on trust and regulation"
        lead="Hasani Munawarah Exchange Sdn Bhd operates currency exchange and money transfer services as a licensed Money Services Business, serving travellers, foreign workers, families and businesses across Malaysia."
        image="/images/aboutus-counter.png" />
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
