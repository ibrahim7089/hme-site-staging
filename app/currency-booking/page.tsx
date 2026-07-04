import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import CurrencyExchangeSteps from "@/components/CurrencyExchangeSteps";

export const metadata: Metadata = {
  title: "Currency Booking | Reserve Foreign Currency Online",
  description:
    "Reserve your foreign currency online and collect at selected HME branches in Malaysia \u2014 ideal for travellers who want their currency ready on arrival.",
};

export default function CurrencyBookingPage() {
  return (
    <>
      <PageHero eyebrow="Currency Booking"
        title="Book your currency. Collect at your branch."
        lead="Travelling soon? Reserve your preferred currency and amount online, then collect it at a selected HME branch — no queuing twice, no missed availability." />
      <section className="py-20">
        <div className="wrap grid gap-6 md:grid-cols-2 md:items-start">
          <CurrencyExchangeSteps />
          <div className="rounded-card border border-line bg-white p-7 shadow-soft">
            <h3 className="text-xl font-bold text-navy">Submit a booking inquiry</h3>
            <p className="mt-1 text-sm text-slate2">We will confirm availability, collection branch and window.</p>
            <form className="mt-6 grid gap-4">
              <input className="rounded-xl border border-line px-4 py-3 text-sm" placeholder="Full name" />
              <div className="grid grid-cols-2 gap-4">
                <input className="rounded-xl border border-line px-4 py-3 text-sm" placeholder="Currency (e.g. USD)" />
                <input className="rounded-xl border border-line px-4 py-3 text-sm" placeholder="Amount" />
              </div>
              <input className="rounded-xl border border-line px-4 py-3 text-sm" placeholder="Preferred collection branch" />
              <div className="grid grid-cols-2 gap-4">
                <input className="rounded-xl border border-line px-4 py-3 text-sm" placeholder="Phone" />
                <input className="rounded-xl border border-line px-4 py-3 text-sm" placeholder="Email" />
              </div>
              <button type="button" className="btn-red">Submit Booking Inquiry</button>
              <p className="text-[11px] text-mist">Bookings are subject to availability and confirmation. Final rate is applied at collection.</p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
