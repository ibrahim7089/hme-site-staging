import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Careers at HME | Join a Growing Malaysian MSB",
  description:
    "Build your career in financial services with HME \u2014 branch, compliance, IT and operations roles across a growing licensed Malaysian MSB network.",
};

const roles = [
  { t: "Branch Customer Service Officer", l: "Multiple locations", d: "Front-line exchange and money transfer service." },
  { t: "Compliance Officer (AML/CFT)", l: "Head Office", d: "Transaction monitoring, screening and reporting." },
  { t: "IT Executive", l: "Head Office", d: "Internal systems, digital platform and branch support." },
];

export default function CareerPage() {
  return (
    <>
      <PageHero eyebrow="Career" title="Grow your career in regulated financial services"
        lead="Join a team where compliance, technology and customer service come together — with real responsibility from day one." />
      <section className="py-20">
        <div className="wrap">
          <div className="grid gap-4 md:grid-cols-3">
            {roles.map((r) => (
              <div key={r.t} className="flex flex-col rounded-card border border-line bg-white p-6 transition hover:shadow-soft">
                <h3 className="text-lg font-bold text-navy">{r.t}</h3>
                <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-mist">{r.l}</span>
                <p className="mt-3 flex-1 text-sm text-slate2">{r.d}</p>
                <Link href="/contact" className="mt-4 font-display text-sm font-bold text-brand-blue">Apply now &rarr;</Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-slate2">
            Don&rsquo;t see your role? Send your CV to <b className="text-navy">careers@hmeremit.com.my</b> and tell us where you fit.
          </p>
        </div>
      </section>
    </>
  );
}
