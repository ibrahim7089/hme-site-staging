import SectionHeading from "./SectionHeading";
import BranchDirectory from "./BranchDirectory";
import { branches } from "@/lib/branches";

export default function BranchLocatorPreview({ limit }: { limit?: number } = {}) {
  return (
    <section className="py-20" id="locate">
      <div className="wrap">
        <SectionHeading eyebrow="Locate Us" title="Find your nearest HME branch"
          lead="Search by state, city or service — exchange, money transfer or currency booking collection." />
        <BranchDirectory branches={branches} limit={limit} />
      </div>
    </section>
  );
}
