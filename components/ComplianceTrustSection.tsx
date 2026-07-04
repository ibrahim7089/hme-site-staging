import { ShieldCheck, ClipboardCheck, IdCard, Lock, Eye, MessageCircle } from "lucide-react";
import SectionHeading from "./SectionHeading";

const cards = [
  { icon: ShieldCheck, title: "Licensed MSB", copy: "Operating under a Money Services Business licence regulated in Malaysia." },
  { icon: ClipboardCheck, title: "AML/CFT compliance", copy: "Anti-money laundering and counter-financing of terrorism controls across all branches." },
  { icon: IdCard, title: "Customer verification", copy: "Proper identification and due diligence to protect every customer and transaction." },
  { icon: Lock, title: "Secure transactions", copy: "Controlled processes, proper receipts and secure handling of every transaction." },
  { icon: Eye, title: "Transparent process", copy: "Clear rates, clear fees and clear documentation \u2014 no hidden surprises." },
  { icon: MessageCircle, title: "Complaints & support", copy: "A dedicated channel to raise issues, give feedback and get help quickly." },
];

export default function ComplianceTrustSection() {
  return (
    <section className="py-20">
      <div className="wrap">
        <SectionHeading eyebrow="Compliance & Customer Protection"
          title="Built on trust, compliance & customer protection"
          lead="HME operates as a licensed Money Services Business under Malaysian regulation, with compliance embedded in every transaction." />
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.title} className="rounded-[10px] border border-line border-l-4 border-l-navy bg-white p-5 transition hover:border-l-brand-red hover:shadow-soft">
              <h4 className="mb-1.5 flex items-center gap-2 font-display text-[15.5px] font-bold text-navy">
                <c.icon className="h-[18px] w-[18px] flex-none text-brand-blue" strokeWidth={2.25} /> {c.title}
              </h4>
              <p className="text-[13px] text-slate2">{c.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
