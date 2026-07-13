import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import BranchLocatorPreview from "@/components/BranchLocatorPreview";
import { branches } from "@/lib/branches";
import { site } from "@/lib/site";

const branchSchema = {
  "@context": "https://schema.org",
  "@graph": branches.map((branch) => {
    const slug = branch.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return {
      "@type": "FinancialService",
      "@id": site.domain + "/locate-us#" + slug,
      name: site.brand + " " + branch.name,
      parentOrganization: { "@id": site.domain + "/#organization" },
      telephone: branch.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: branch.address,
        addressRegion: branch.state,
        addressCountry: "MY",
      },
      hasMap: branch.mapsUrl,
      url: site.domain + "/locate-us",
      areaServed: branch.state,
      serviceType: branch.services,
    };
  }),
};

export const metadata: Metadata = {
  title: "Branch Locator | Find Your Nearest HME Branch",
  description:
    "Find HME currency exchange and money transfer branches across Malaysia \u2014 addresses, opening hours, WhatsApp contact and Google Maps directions.",
};

export default function LocateUsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(branchSchema).replace(/</g, "\\u003c") }}
      />
      <PageHero eyebrow="Locate Us" title="Find your nearest HME branch"
        lead="Branches across Malaysia for currency exchange, money transfer and currency booking collection — search by state, city or service."
        image="/images/branches-counter.webp" />
      <BranchLocatorPreview />
    </>
  );
}
