import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { getPublishedPromotions } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Promotions | HME",
  description: "Current offers on foreign currency exchange, international money transfer and currency booking with HME.",
};

export default async function PromotionsPage() {
  const promotions = await getPublishedPromotions();

  return (
    <>
      <PageHero eyebrow="Promotions" title="Current offers"
        lead="Take advantage of published offers across exchange, money transfer and currency booking." />
      <section className="py-20">
        {promotions.length > 0 ? (
          <div className="wrap grid gap-4 md:grid-cols-3">
            {promotions.map((promotion) => (
              <article key={promotion.slug} className="flex flex-col rounded-card border border-line bg-white p-6 transition hover:shadow-soft">
                <span className="eyebrow">Current offer</span>
                <h3 className="mt-2 text-lg font-bold text-navy">{promotion.title}</h3>
                <p className="mt-3 flex-1 text-sm text-slate2">{promotion.summary}</p>
                {promotion.endDate && (
                  <p className="mt-4 text-xs font-semibold text-slate2">Ends {promotion.endDate}</p>
                )}
                {promotion.ctaHref && promotion.ctaLabel && (
                  <Link href={promotion.ctaHref} className="mt-5 text-sm font-bold text-brand-blue">
                    {promotion.ctaLabel} →
                  </Link>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="wrap">
            <div className="rounded-card border border-line bg-cloud p-8 text-center">
              <h2 className="text-xl font-bold text-navy">No current promotions published</h2>
              <p className="mt-2 text-sm text-slate2">Check back soon or contact your nearest branch for current services and rates.</p>
              <Link href="/locate-us" className="btn-primary mt-6">Find a Branch</Link>
            </div>
          </div>
        )}
        <p className="wrap mt-8 text-xs text-slate2">Promotions are subject to published terms and conditions and may change after their stated end date.</p>
      </section>
    </>
  );
}
