import type { Metadata } from "next";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Blog | HME Media",
  description: "Guides and tips on foreign currency exchange, international money transfer and currency booking from HME.",
};

const posts = [
  { t: "5 things to check before exchanging currency for your trip", d: "A quick checklist to make sure you're getting a fair rate and the right notes for your destination." },
  { t: "How international money transfer actually works", d: "A plain-language walkthrough of what happens between you sending money and your family receiving it." },
  { t: "When should you book currency in advance?", d: "Why locking in a rate ahead of time can make sense for larger trips or bulk currency needs." },
];

export default function BlogPage() {
  return (
    <>
      <PageHero eyebrow="Media" title="Blog"
        lead="Guides and tips on currency exchange, money transfer and currency booking." />
      <section className="py-20">
        <div className="wrap grid gap-4 md:grid-cols-3">
          {posts.map((p) => (
            <div key={p.t} className="flex flex-col rounded-card border border-line bg-white p-6 transition hover:shadow-soft">
              <h3 className="text-lg font-bold text-navy">{p.t}</h3>
              <p className="mt-3 flex-1 text-sm text-slate2">{p.d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
