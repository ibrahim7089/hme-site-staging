import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import AgentCTA from "@/components/AgentCTA";

export const metadata: Metadata = {
  title: "Be Our Agent | Partner with HME Money Services",
  description:
    "Become an HME agent and offer licensed currency exchange and money transfer services at your location \u2014 with training, compliance and operational support.",
};

const fields = [
  ["Full Name", "text", true], ["Company Name (SDN BHD)", "text", true],
  ["Company Registration No. (SSM)", "text", false],
  ["Business Type / Nature of Business", "text", false],
  ["Phone", "tel", true], ["Email Address", "email", true],
] as const;

const states = [
  "Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Labuan", "Malacca",
  "Negeri Sembilan", "Pahang", "Penang", "Perak", "Perlis", "Putrajaya",
  "Sabah", "Sarawak", "Selangor", "Terengganu",
];

export default function AgentPage() {
  return (
    <>
      <PageHero eyebrow="Be Our Agent" title="Grow with HME"
        lead="Partner with a licensed Malaysian MSB network and expand access to reliable money services across your location." />
      <section className="py-20">
        <div className="wrap grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="text-xl font-bold text-navy">Why partner with HME</h3>
            <ul className="mt-5 space-y-3 text-sm text-slate2">
              <li>&#10003; Operate under a licensed, regulated MSB network</li>
              <li>&#10003; Full training, compliance and operational support</li>
              <li>&#10003; Exchange and money transfer revenue streams</li>
              <li>&#10003; Established brand, rate infrastructure and systems</li>
              <li>&#10003; Ongoing AML/CFT guidance and monitoring support</li>
            </ul>
            <p className="mt-5 text-xs text-mist">Agent appointments are subject to due diligence and applicable regulatory requirements.</p>
          </div>
          <div className="rounded-card border border-line bg-white p-7 shadow-soft">
            <h3 className="text-xl font-bold text-navy">Apply as Agent</h3>
            <form className="mt-6 grid gap-4">
              {fields.map(([label, type, required]) => (
                <label key={label} className="grid gap-1.5 text-sm font-medium text-navy">
                  {label}{required && <span className="text-brand-red"> *</span>}
                  <input type={type} required={required}
                    className="rounded-xl border border-line px-4 py-3 text-sm font-normal" />
                </label>
              ))}
              <label className="grid gap-1.5 text-sm font-medium text-navy">
                Proposed State
                <select defaultValue="" className="rounded-xl border border-line px-4 py-3 text-sm font-normal text-slate2">
                  <option value="" disabled>Select proposed state</option>
                  {states.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-navy">
                Proposed Location / Address
                <input type="text" className="rounded-xl border border-line px-4 py-3 text-sm font-normal" />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-navy">
                Message<span className="text-brand-red"> *</span>
                <textarea required rows={4} className="rounded-xl border border-line px-4 py-3 text-sm font-normal" />
              </label>
              <button type="button" className="btn-red">Apply as Agent</button>
            </form>
          </div>
        </div>
      </section>
      <AgentCTA />
    </>
  );
}
