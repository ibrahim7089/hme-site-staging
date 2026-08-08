import type { Metadata } from "next";
import VideoHero from "@/components/VideoHero";
import HMEStory from "@/components/HMEStory";
import ServiceCards from "@/components/ServiceCards";
import ReachUsBand from "@/components/ReachUsBand";
import BranchLocatorPreview from "@/components/BranchLocatorPreview";
import GoogleReviewsShowcase from "@/components/GoogleReviewsShowcase";
import FAQSection from "@/components/FAQSection";

export const metadata: Metadata = {
  title: "HME | Currency Exchange & International Money Transfer Malaysia",
  description:
    "Check today's exchange rates, send money overseas and book foreign currency with HME — a licensed Malaysian Money Services Business with branches nationwide.",
};

export default function HomePage() {
  return (
    <>
      <VideoHero />
      <HMEStory />
      <ServiceCards />
      <BranchLocatorPreview limit={3} />
      <GoogleReviewsShowcase />
      <FAQSection limit={4} />
      <ReachUsBand />
    </>
  );
}
