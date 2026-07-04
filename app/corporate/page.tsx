import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Corporate FX & Money Transfer Services | HME for Business",
  description:
    "FX and money transfer support for Malaysian SMEs and corporates \u2014 competitive rates, dedicated service and compliant processes from a licensed MSB.",
};

const offers = [
  { t: "Business currency exchange", c: "Foreign currency for trade, travel and operations at competitive rates, with volume handling at selected branches." },
  { t: "Corporate money transfer", c: "Outward money transfer support for supplier payments and business transfers, with proper documentation and verification." },
  { t: "Dedicated relationship support", c: "A single point of contact for recurring FX and money transfer requirements." },
  { t: "Compliance-ready processes", c: "KYC/KYB onboarding and transaction documentation aligned to Malaysian regulatory requirements." },
];

export default function CorporatePage() {
  return (
    <>
      <PageHero eyebrow="Corporate Services" title="FX and money transfer support for business"
        lead="From SMEs to established corporates — HME supports recurring foreign currency and money transfer needs with competitive rates and compliant, documented processes." />
      <section className="py-20">
        <div className="wrap">
          <div className="grid gap-4 sm:grid-cols-2">
            {offers.map((o) => (
              <div key={o.t} className="rounded-card border border-line bg-white p-6 transition hover:shadow-soft">
                <h3 className="mb-2 text-lg font-bold text-navy">{o.t}</h3>
                <p className="text-sm text-slate2">{o.c}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/contact" className="btn-primary">Talk to Our Corporate Team</Link>
            <Link href="/be-our-agent" className="btn-outline">Explore Agent Partnership</Link>
          </div>
        </div>
      </section>
    </>
  );
}
