import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Link from "next/link";
import { getPublishedPageContent } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Biz FX | Business Foreign Currency Exchange | HME",
  description:
    "Business foreign currency exchange for Malaysian SMEs and corporates — competitive rates, volume handling and compliance-ready processes from a licensed MSB.",
};

const offers = [
  { t: "Business currency exchange", c: "Foreign currency for trade, travel and operations at competitive rates, with volume handling at selected branches." },
  { t: "Competitive FX rates", c: "Access preferential rates for larger business currency requirements with dedicated counter service." },
  { t: "Dedicated relationship support", c: "A single point of contact for your recurring business FX requirements." },
  { t: "Compliance-ready processes", c: "KYC/KYB onboarding and transaction documentation aligned to Malaysian regulatory requirements." },
];

export default async function CorporatePage() {
  const managed = await getPublishedPageContent("biz-fx");
  const offersSection = managed?.sections.find((section) => section.id === "offers");
  const managedOffers = offersSection?.items.filter((item) => item.active).map((item) => ({ t: item.title, c: item.body }));
  const displayedOffers = offersSection ? managedOffers || [] : offers;

  return (
    <>
      <PageHero pageKey="biz-fx" eyebrow="Biz FX" title="Business foreign currency exchange"
        lead="From SMEs to established corporates — HME supports recurring foreign currency needs with competitive rates and compliant, documented processes."
        image="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1920&q=80" />
      {offersSection?.visible !== false && <section className="py-20">
        <div className="wrap">
          {(offersSection?.eyebrow || offersSection?.heading || offersSection?.body) && <div className="mb-9 max-w-3xl">
            {offersSection.eyebrow && <p className="eyebrow mb-3">{offersSection.eyebrow}</p>}
            {offersSection.heading && <h2 className="font-display text-3xl font-extrabold text-navy">{offersSection.heading}</h2>}
            {offersSection.body && <p className="mt-3 text-sm leading-relaxed text-slate2">{offersSection.body}</p>}
          </div>}
          <div className="grid gap-4 sm:grid-cols-2">
            {displayedOffers.map((o) => (
              <div key={o.t} className="rounded-card border border-line bg-white p-6 transition hover:shadow-soft">
                <h3 className="mb-2 text-lg font-bold text-navy">{o.t}</h3>
                <p className="text-sm text-slate2">{o.c}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/contact" className="btn-primary">Talk to Our Business Team</Link>
            <Link href="/biz-remit" className="btn-outline">Explore Biz Remit</Link>
          </div>
        </div>
      </section>}
    </>
  );
}
