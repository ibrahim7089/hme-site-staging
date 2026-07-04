import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import RemittanceSteps from "@/components/RemittanceSteps";
import ComplianceTrustSection from "@/components/ComplianceTrustSection";
import Link from "next/link";

export const metadata: Metadata = {
  title: "International Money Transfer Malaysia | Send Money Overseas with HME",
  description:
    "Send money overseas securely with HM eRemit \u2014 transparent rates, proper verification and full branch support from a licensed Malaysian Money Services Business.",
};

const corridors = ["Indonesia", "Bangladesh", "India", "Nepal", "Philippines", "Pakistan", "Myanmar", "Vietnam"];

export default function MoneyTransferPage() {
  return (
    <>
      <PageHero eyebrow="International Money Transfer"
        title="Send money home, the trusted way"
        lead="HM eRemit moves your money overseas with transparent rates, secure verification and support at every HME branch — built for foreign workers, families and businesses." />
      <section className="py-20">
        <div className="wrap grid gap-6 md:grid-cols-2 md:items-start">
          <RemittanceSteps />
          <div>
            <h3 className="text-xl font-bold text-navy">Popular corridors</h3>
            <p className="mt-2 text-sm text-slate2">Competitive money transfer rates to the destinations our customers send to most.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {corridors.map((c) => (
                <div key={c} className="rounded-tile border border-line bg-white px-4 py-3 text-sm font-semibold text-navy">{c}</div>
              ))}
            </div>
            <Link href="/money-transfer-rates" className="btn-primary mt-6">View Money Transfer Rates</Link>
          </div>
        </div>
      </section>
      <ComplianceTrustSection />
    </>
  );
}
