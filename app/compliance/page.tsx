import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import ComplianceTrustSection from "@/components/ComplianceTrustSection";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Compliance & Customer Protection | HME Malaysia",
  description:
    "How HME protects customers: MSB licensing, AML/CFT compliance, customer verification, secure transactions and a clear complaints channel.",
};

export default function CompliancePage() {
  return (
    <>
      <PageHero pageKey="compliance" eyebrow="Compliance & Customer Protection"
        title="Built on trust, compliance & customer protection"
        lead="HME operates under Malaysian Money Services Business regulation. Compliance is not a department here — it is how every transaction is done." />
      <ComplianceTrustSection />
      <section className="bg-cloud py-20">
        <div className="wrap grid gap-8 md:grid-cols-2">
          <div className="rounded-card border border-line bg-white p-7">
            <h3 className="text-xl font-bold text-navy">Licensing</h3>
            <p className="mt-3 text-sm text-slate2">
              {site.legalName} (Company Reg. No. {site.regNo}) holds Money Services
              Business Licence No. {site.msbNo}. {site.licenceLine}
            </p>
          </div>
          <div className="rounded-card border border-line bg-white p-7">
            <h3 className="text-xl font-bold text-navy">Complaints & feedback</h3>
            <p className="mt-3 text-sm text-slate2">
              If something is not right, tell us. Raise any issue at a branch, by
              phone at {site.phone}, or through our{" "}
              <Link href="/enquiry?type=complaint" className="font-bold text-brand-blue hover:underline">online complaint form</Link>. We acknowledge
              complaints promptly and keep you informed until resolution.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
