import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { site } from "@/lib/site";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact HME | Customer Support & Inquiries",
  description:
    "Contact Hasani Munawarah Exchange \u2014 call, WhatsApp or email our team, visit a branch, or send an inquiry about exchange, money transfer or partnership.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact Us" title="We're here to help"
        lead="Questions about rates, a transaction, booking or partnership — reach the HME team whichever way suits you." />
      <section className="py-20">
        <div className="wrap grid gap-10 md:grid-cols-2">
          <div className="space-y-4">
            {[
              ["\u{1F4DE}", "Call us", site.phone],
              ["\u{1F4AC}", "WhatsApp", "Chat with our team"],
              ["\u2709\uFE0F", "Email", site.email],
              ["\u{1F4CD}", "Head Office", "[HQ Address], Malaysia"],
            ].map(([i, t, v]) => (
              <div key={t} className="flex items-center gap-4 rounded-tile border border-line bg-white p-5">
                <span className="text-2xl">{i}</span>
                <span><b className="block font-display text-[15px] text-navy">{t}</b>
                <span className="text-sm text-slate2">{v}</span></span>
              </div>
            ))}
            <Link href="/locate-us" className="btn-outline">Find a Branch Instead</Link>
          </div>
          <div className="rounded-card border border-line bg-white p-7 shadow-soft">
            <h3 className="text-xl font-bold text-navy">Send an inquiry</h3>
            <form className="mt-6 grid gap-4">
              <input className="rounded-xl border border-line px-4 py-3 text-sm" placeholder="Full name" />
              <div className="grid grid-cols-2 gap-4">
                <input className="rounded-xl border border-line px-4 py-3 text-sm" placeholder="Email" />
                <input className="rounded-xl border border-line px-4 py-3 text-sm" placeholder="Phone" />
              </div>
              <select className="rounded-xl border border-line px-4 py-3 text-sm text-slate2">
                <option>Inquiry type</option><option>Exchange rates</option><option>Money Transfer</option>
                <option>Currency booking</option><option>Agent / corporate</option><option>Complaint / feedback</option>
              </select>
              <textarea rows={4} className="rounded-xl border border-line px-4 py-3 text-sm" placeholder="Message" />
              <button type="button" className="btn-primary">Send Message</button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
