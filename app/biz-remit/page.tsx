import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Link from "next/link";

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

export default function BizRemitPage() {
  return (
    <>
      <PageHero pageKey="biz-remit" eyebrow="Biz Remit" title="Business international money transfer"
        lead="Reliable outward money transfer for Malaysian businesses — supplier payments, trade settlements and payroll remittance handled with speed, compliance and competitive rates."
        image="https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1920&q=80" />
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
            <Link href="/contact" className="btn-primary">Talk to Our Business Team</Link>
            <Link href="/corporate" className="btn-outline">Explore Biz FX</Link>
          </div>
        </div>
      </section>
    </>
  );
}
