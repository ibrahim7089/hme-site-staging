import { Star } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { listFiveStarReviewsForHomepage } from "@/lib/google-reviews-service";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "G";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

export default async function GoogleReviewsShowcase() {
  const reviews = await listFiveStarReviewsForHomepage(9);
  if (reviews.length === 0) return null;

  return (
    <section className="bg-cloud py-20" id="google-reviews">
      <div className="wrap">
        <SectionHeading
          eyebrow="Google Reviews"
          title="5-star experiences from HME customers"
          lead="Real reviews from customers across our nationwide branch network."
          center
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, index) => (
            <figure
              key={`${review.reviewer_name}-${index}`}
              className="flex flex-col gap-4 rounded-card border border-line bg-white p-6 shadow-soft"
            >
              <div className="flex items-center gap-1" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <Star key={starIndex} className="h-4 w-4 fill-[#F5A524] text-[#F5A524]" />
                ))}
              </div>
              <blockquote className="flex-1 text-[14px] leading-relaxed text-slate2">
                &ldquo;{review.comment}&rdquo;
              </blockquote>
              <figcaption className="flex items-center gap-3 border-t border-line pt-4">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-brand-bluesoft text-[13px] font-bold text-brand-blue">
                  {initials(review.reviewer_name)}
                </span>
                <span className="min-w-0">
                  <b className="block truncate font-display text-[13px] font-bold text-navy">
                    {review.reviewer_name}
                  </b>
                  <span className="block truncate text-[11px] text-mist">
                    {review.branch_name || "HME"} · Google review
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
