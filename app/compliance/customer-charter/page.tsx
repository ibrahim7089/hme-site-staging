import type { Metadata } from "next";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Customer Charter | HME Compliance",
  description: "HME's commitment to fair treatment, transparent pricing and accessible service for every customer.",
};

const commitments = [
  { h: "Fair treatment", p: "Every customer is served with respect, regardless of transaction size, in the order they arrive at the branch." },
  { h: "Transparent pricing", p: "Rates and fees are disclosed clearly before you confirm any transaction — no hidden charges." },
  { h: "Accessible service", p: "Our branch staff communicate in multiple languages and are trained to explain any step of the process clearly." },
  { h: "Responsive complaints handling", p: "Every complaint is acknowledged promptly and kept updated until it is resolved, through the channels listed on our Communication Channels page." },
  { h: "Customer awareness", p: "We regularly share guidance on safe transaction practices and how to recognise fraud attempts impersonating HME." },
];

export default function CustomerCharterPage() {
  return (
    <>
      <PageHero pageKey="customer-charter" eyebrow="Compliance" title="Customer Charter"
        lead="What you can expect from HME at every branch, every time." />
      <section className="py-20">
        <div className="wrap max-w-3xl">
          {commitments.map((c) => (
            <div key={c.h} className="border-t border-line py-6 first:border-t-0 first:pt-0">
              <h3 className="mb-2 text-lg font-bold text-navy">{c.h}</h3>
              <p className="text-sm leading-relaxed text-slate2">{c.p}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
