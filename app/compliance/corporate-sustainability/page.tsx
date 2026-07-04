import type { Metadata } from "next";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Corporate Sustainability | HME Compliance",
  description: "HME's commitment to corporate social responsibility and sustainable business practice in Malaysia.",
};

const pillars = [
  { h: "Responsible business conduct", p: "We aim to uphold both the letter and the spirit of Malaysia's laws and regulations governing licensed Money Services Businesses, treating compliance as a foundation for sustainable growth rather than a minimum requirement." },
  { h: "Community", p: "As a company that believes in the well-being of the communities we operate in, HME supports the neighbourhoods around our branches and looks for opportunities to give back where we can." },
  { h: "Our people", p: "We invest in training and fair employment practices for our branch and head office staff, recognising that the people behind the counter are central to the trust customers place in HME." },
  { h: "Financial inclusion", p: "Through our nationwide branch network, we aim to make foreign currency exchange and money transfer services accessible to travellers, workers and families across Malaysia, not just in major cities." },
];

export default function CorporateSustainabilityPage() {
  return (
    <>
      <PageHero eyebrow="Compliance" title="Corporate Sustainability"
        lead="As a company believing in the well-being of society and community, HME aims to contribute to sustainable development through our business operations — upholding both the letter and spirit of Malaysia's laws and policies." />
      <section className="py-20">
        <div className="wrap max-w-3xl">
          {pillars.map((s) => (
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
