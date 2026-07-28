import type { Metadata } from "next";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "AML/CFT Policy | HME Compliance",
  description: "HME's anti-money laundering and counter-financing of terrorism (AML/CFT) policy under the AMLA 2001 and Money Services Business Act 2011.",
};

const sections = [
  { h: "Our commitment", p: "HME operates a risk-based AML/CFT programme in line with the Anti-Money Laundering, Anti-Terrorism Financing and Proceeds of Unlawful Activities Act 2001 (AMLA) and Bank Negara Malaysia's requirements for licensed Money Services Businesses." },
  { h: "Customer due diligence", p: "We verify customer identity for all transactions, with enhanced due diligence applied above regulatory thresholds or for higher-risk profiles, before any exchange or money transfer is completed." },
  { h: "Transaction monitoring", p: "Transactions are screened and monitored on an ongoing basis to detect unusual or suspicious activity, which is escalated internally and reported to the relevant authorities where required." },
  { h: "Record keeping & training", p: "Customer and transaction records are retained as required by law, and all branch staff receive regular AML/CFT training as part of our compliance programme." },
];

export default function AmlPolicyPage() {
  return (
    <>
      <PageHero pageKey="aml-policy" eyebrow="Compliance" title="AML/CFT Policy"
        lead="Our anti-money laundering and counter-financing of terrorism programme, applied at every branch and every transaction." />
      <section className="py-20">
        <div className="wrap max-w-3xl">
          {sections.map((s) => (
            <div key={s.h} className="border-t border-line py-6 first:border-t-0 first:pt-0">
              <h3 className="mb-2 text-lg font-bold text-navy">{s.h}</h3>
              <p className="text-sm leading-relaxed text-slate2">{s.p}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
