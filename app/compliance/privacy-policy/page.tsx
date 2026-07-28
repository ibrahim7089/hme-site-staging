import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Privacy Policy | HME Compliance",
  description: "How HME collects, uses and protects customer personal data in accordance with Malaysia's Personal Data Protection Act 2010 (PDPA).",
};

const sections = [
  { h: "What we collect", p: "To perform exchange, money transfer and currency booking transactions, we collect identification details (such as MyKad or passport number), contact information, and transaction records as required under Malaysian law." },
  { h: "Why we collect it", p: "Personal data is used to complete your transaction, perform customer due diligence under AML/CFT regulations, respond to enquiries, and meet our reporting obligations to Bank Negara Malaysia and other authorities." },
  { h: "How we protect it", p: "Customer data is stored securely with access limited to authorised staff, and is retained only for as long as required by law or operational need." },
  { h: "Your rights", p: "Under the Personal Data Protection Act 2010 (PDPA), you may request access to, or correction of, your personal data held by us. Contact us using the details below to make a request." },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero eyebrow="Compliance" title="Privacy Policy"
        lead="How we collect, use and protect your personal data in accordance with the Personal Data Protection Act 2010 (PDPA)." />
      <section className="py-20">
        <div className="wrap max-w-3xl">
          {sections.map((s) => (
            <div key={s.h} className="border-t border-line py-6 first:border-t-0 first:pt-0">
              <h3 className="mb-2 text-lg font-bold text-navy">{s.h}</h3>
              <p className="text-sm leading-relaxed text-slate2">{s.p}</p>
            </div>
          ))}
          <p className="mt-6 text-sm text-slate2">
            Questions about your data?{" "}
            <Link href="/enquiry?type=privacy" className="font-bold text-brand-blue hover:underline">Submit a privacy enquiry</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
