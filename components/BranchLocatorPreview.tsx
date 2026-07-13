import SectionHeading from "./SectionHeading";
import BranchDirectory from "./BranchDirectory";
import type { Branch } from "@/lib/branches";
import { getPublishedBranches } from "@/lib/cms";

export default async function BranchLocatorPreview({
  limit,
  branches: suppliedBranches,
}: {
  limit?: number;
  branches?: Branch[];
} = {}) {
  const branches = suppliedBranches || await getPublishedBranches();

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
