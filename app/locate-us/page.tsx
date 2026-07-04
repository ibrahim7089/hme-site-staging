import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import BranchLocatorPreview from "@/components/BranchLocatorPreview";

export const metadata: Metadata = {
  title: "Branch Locator | Find Your Nearest HME Branch",
  description:
    "Find HME currency exchange and money transfer branches across Malaysia \u2014 addresses, opening hours, WhatsApp contact and Google Maps directions.",
};

export default function LocateUsPage() {
  return (
    <>
      <PageHero eyebrow="Locate Us" title="Find your nearest HME branch"
        lead="Branches across Malaysia for currency exchange, money transfer and currency booking collection — search by state, city or service." />
      <BranchLocatorPreview />
    </>
  );
}
