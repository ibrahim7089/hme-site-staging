import type { Metadata } from "next";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Terms and Conditions | HME Compliance",
  description: "Terms and conditions governing currency exchange, money transfer and currency booking services provided by HME.",
};

const sections = [
  { h: "Exchange transactions", p: "Rates displayed online and in-branch are indicative and subject to change without notice until confirmed and completed at the counter. Once an exchange transaction is completed and a receipt is issued, it is final." },
  { h: "Money transfer services", p: "Money transfers are subject to customer verification and beneficiary details provided by the sender. HME is not liable for delays or losses caused by incorrect beneficiary information supplied by the customer." },
  { h: "Currency booking", p: "Booked currency is reserved at the confirmed rate for the stated collection window. Bookings not collected within the window may be released, subject to branch policy." },
  { h: "Liability", p: "HME's liability in connection with any transaction is limited to the value of that transaction, save where prohibited by law." },
  { h: "Governing law", p: "These terms are governed by the laws of Malaysia, and any dispute is subject to the exclusive jurisdiction of the Malaysian courts." },
];

export default function TermsPage() {
  return (
    <>
      <PageHero pageKey="terms" eyebrow="Compliance" title="Terms and Conditions"
        lead="The terms governing the use of HME's currency exchange, money transfer and currency booking services." />
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
