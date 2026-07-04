import type { Metadata } from "next";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Promotions | HME",
  description: "Current offers on foreign currency exchange, international money transfer and currency booking with HME.",
};

const promos = [
  { tag: "Exchange", t: "Zero commission on major currencies", d: "No commission on USD, SGD and THB exchange this month at participating branches." },
  { tag: "Money Transfer", t: "First transfer fee waived", d: "New money transfer customers get their first transfer fee waived, terms apply." },
  { tag: "Booking", t: "Priority collection for bookings above RM5,000", d: "Book ahead and skip the queue with priority counter service." },
];

export default function PromotionsPage() {
  return (
    <>
      <PageHero eyebrow="Promotions" title="Current offers"
        lead="Take advantage of ongoing offers across exchange, money transfer and currency booking." />
      <section className="py-20">
        <div className="wrap grid gap-4 md:grid-cols-3">
          {promos.map((p) => (
            <div key={p.t} className="flex flex-col rounded-card border border-line bg-white p-6 transition hover:shadow-soft">
              <span className="eyebrow">{p.tag}</span>
              <h3 className="mt-2 text-lg font-bold text-navy">{p.t}</h3>
              <p className="mt-3 flex-1 text-sm text-slate2">{p.d}</p>
            </div>
          ))}
        </div>
        <p className="wrap mt-8 text-xs text-slate2">Promotions are subject to change and terms and conditions apply. Visit your nearest branch for full details.</p>
      </section>
    </>
  );
}
