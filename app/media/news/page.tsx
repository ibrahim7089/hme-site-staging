import type { Metadata } from "next";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "News | HME Media",
  description: "Company announcements, branch openings and regulatory updates from HME — Hasani Munawarah Exchange Sdn Bhd.",
};

const news = [
  { date: "March 2026", t: "HME opens new branch in Sungai Petani", d: "Expanding our nationwide network with a new full-service branch offering exchange, money transfer and currency booking." },
  { date: "January 2026", t: "Updated AML/CFT customer verification steps", d: "In line with Bank Negara Malaysia guidelines, we've refreshed our customer due diligence process at all branches." },
  { date: "November 2025", t: "HME extends money transfer payout network", d: "Now supporting cash and account payout to more corridors through our correspondent banking partners." },
];

export default function NewsPage() {
  return (
    <>
      <PageHero eyebrow="Media" title="News"
        lead="Company announcements, branch updates and regulatory news from HME." />
      <section className="py-20">
        <div className="wrap grid gap-4 md:grid-cols-3">
          {news.map((n) => (
            <div key={n.t} className="flex flex-col rounded-card border border-line bg-white p-6 transition hover:shadow-soft">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-red">{n.date}</span>
              <h3 className="mt-2 text-lg font-bold text-navy">{n.t}</h3>
              <p className="mt-3 flex-1 text-sm text-slate2">{n.d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
