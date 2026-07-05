import type { Metadata } from "next";
import VideoHero from "@/components/VideoHero";
import HeroSection from "@/components/HeroSection";
import ServiceCards from "@/components/ServiceCards";
import ReachUsBand from "@/components/ReachUsBand";
import NewsletterBand from "@/components/NewsletterBand";

export const metadata: Metadata = {
  title: "HME | Currency Exchange & International Money Transfer Malaysia",
  description:
    "Check today's exchange rates, send money overseas and book foreign currency with HME — a licensed Malaysian Money Services Business with branches nationwide.",
};

export default function HomePage() {
  return (
    <>
      <VideoHero />
      <HeroSection />
      <ServiceCards />
      <ReachUsBand />
      <NewsletterBand />
    </>
  );
}
