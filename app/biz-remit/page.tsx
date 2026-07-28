import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Link from "next/link";
import { getPublishedPageContent } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Biz Remit | Business Money Transfer | HME",
  description:
    "International money transfer for Malaysian businesses — supplier payments, payroll remittance and outward transfers with proper documentation from a licensed MSB.",
};

const offers = [
  { t: "Outward money transfer", c: "Send business payments overseas to suppliers, partners and contractors with proper documentation and regulatory compliance." },
  { t: "Supplier & trade payments", c: "Facilitate international trade payments with competitive rates and fast processing through HME's remittance network." },
  { t: "Payroll remittance", c: "Regular payroll transfers for foreign workers and overseas staff, handled efficiently and compliantly." },
  { t: "Compliance-ready processes", c: "Full KYC/KYB onboarding and transaction documentation aligned to Bank Negara Malaysia and MSB Act 2011 requirements." },
];

export default async function BizRemitPage() {
  const managed = await getPublishedPageContent("biz-remit");
  const offersSection = managed?.sections.find((section) => section.id === "offers");
  const managedOffers = offersSection?.items.filter((item) => item.active).map((item) => ({ t: item.title, c: item.body }));
  const displayedOffers = offersSection ? managedOffers || [] : offers;

  return (
    <>
      <PageHero pageKey="biz-remit" eyebrow="Biz Remit" title="Business international money transfer"
        lead="Reliable outward money transfer for Malaysian businesses — supplier payments, trade settlements and payroll remittance handled with speed, compliance and competitive rates."
        image="https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1920&q=80" />
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
            <Link href="/corporate" className="btn-outline">Explore Biz FX</Link>
          </div>
        </div>
      </section>}
    </>
  );
}
