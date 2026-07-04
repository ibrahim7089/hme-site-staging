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
        lead="Hasani Munawarah Exchange Sdn Bhd operates currency exchange and money transfer services as a licensed Money Services Business, serving travellers, foreign workers, families and businesses across Malaysia." />
      <section className="py-20">
        <div className="wrap grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="sec-title !text-2xl">Our story</h2>
            <p className="text-slate2">
              HME began as a trusted local money changer and has grown into a
              regulated network offering foreign currency exchange, international
              money transfer under the HM eRemit brand, and currency booking. Every
              part of our operation &mdash; from the counter to the back office &mdash; is
              built around regulatory compliance and customer protection.
            </p>
          </div>
          <div>
            <h2 className="sec-title !text-2xl">What we stand for</h2>
            <ul className="space-y-3 text-slate2">
              <li><b className="text-navy">Trust</b> &mdash; licensed, regulated and transparent in everything we do.</li>
              <li><b className="text-navy">Access</b> &mdash; convenient branches and clear digital rate information.</li>
              <li><b className="text-navy">Care</b> &mdash; friendly, multilingual service for every customer.</li>
              <li><b className="text-navy">Compliance</b> &mdash; AML/CFT controls embedded in daily operations.</li>
            </ul>
          </div>
        </div>
      </section>
      <WhyChooseHME />
      <ComplianceTrustSection />
    </>
  );
}
