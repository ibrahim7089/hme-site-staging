import type { Metadata } from "next";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Fees & Charges | HME Compliance",
  description: "How HME's pricing works across currency exchange, international money transfer and currency booking.",
};

const sections = [
  { h: "Currency exchange", p: "Our buy/sell exchange rates already reflect our margin — there is no separate commission charged on top of the displayed rate for standard exchange transactions." },
  { h: "International money transfer", p: "Money transfers carry a service fee that varies by destination corridor, transfer amount and payout method (cash or account). The exact fee is always shown and confirmed with you before you proceed." },
  { h: "Currency booking", p: "There is no additional booking fee — you pay the confirmed rate at the time of collection, at the amount you reserved." },
  { h: "Transparency", p: "All applicable fees and the final rate are disclosed at the counter before you confirm any transaction, in line with our commitment to transparent pricing." },
];

export default function FeesChargesPage() {
  return (
    <>
      <PageHero eyebrow="Compliance" title="Fees & Charges"
        lead="A clear breakdown of how pricing works across our services — no hidden charges." />
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
