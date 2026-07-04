import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import FAQSection from "@/components/FAQSection";

export const metadata: Metadata = {
  title: "FAQ | Currency Exchange & Money Transfer Questions Answered",
  description:
    "Answers to common questions about HME's exchange rates, money transfer process, currency booking, required documents and licensing.",
};

export default function FAQPage() {
  return (
    <>
      <PageHero eyebrow="FAQ" title="Questions, answered"
        lead="Everything customers ask most about rates, money transfer, booking and what to bring to the branch." />
      <FAQSection />
    </>
  );
}
