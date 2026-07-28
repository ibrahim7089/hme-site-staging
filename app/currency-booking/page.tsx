import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CheckCircle2, MapPin, MessageCircle, Phone } from "lucide-react";
import PageHero from "@/components/PageHero";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Currency Booking | Reserve Foreign Currency",
  description:
    "Ask HME about foreign currency availability and arrange collection at a selected branch in Malaysia. Bookings are confirmed by the branch.",
};

const steps = [
  { title: "Tell us the currency and amount", copy: "Share what you need so the branch can check current availability." },
  { title: "Choose a preferred branch and date", copy: "Let us know where and when you would like to collect." },
  { title: "Wait for branch confirmation", copy: "Your booking is only confirmed after the branch verifies availability and collection details." },
  { title: "Pay and collect at the counter", copy: "Bring accepted identification. The final rate is confirmed at collection." },
];

export default function CurrencyBookingPage() {
  const message = encodeURIComponent(
    "Hi HME, I would like to ask about a currency booking. Currency: [currency], Amount: [amount], Preferred branch: [branch], Collection date: [date].",
  );
  const whatsappUrl = `${site.whatsapp}?text=${message}`;

  return (
    <>
      <PageHero pageKey="currency-booking" eyebrow="Currency Booking"
        title="Plan ahead. Collect with confidence."
        lead="Ask your preferred HME branch to check currency availability and arrange a collection date. The branch will confirm your request before you travel." />
      <section className="py-14 md:py-20">
        <div className="wrap grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <p className="eyebrow mb-3">How it works</p>
            <h2 className="text-2xl font-extrabold text-navy sm:text-3xl">Four clear steps</h2>
            <div className="mt-7 space-y-3">
              {steps.map((step, index) => (
                <div key={step.title} className="flex gap-4 rounded-tile border border-line bg-white p-5">
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-brand-bluesoft font-mono text-xs font-bold text-brand-blue">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <b className="block font-display text-sm text-navy">{step.title}</b>
                    <span className="mt-1 block text-[13px] leading-relaxed text-slate2">{step.copy}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-card border border-line bg-white p-7 shadow-soft sm:p-9">
            <span className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-brand-redsoft">
              <CalendarClock className="h-6 w-6 text-brand-red" />
            </span>
            <h2 className="text-2xl font-bold text-navy">Start your booking inquiry</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate2">
              Send these details on WhatsApp so the team can direct your request to the right branch:
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {["Currency and amount", "Preferred HME branch", "Collection date", "Your name and contact"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate2">
                  <CheckCircle2 className="h-4 w-4 flex-none text-brand-blue" />{item}
                </li>
              ))}
            </ul>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn-red">
                <MessageCircle className="h-4 w-4" /> Ask on WhatsApp
              </a>
              <a href={`tel:${site.phone}`} className="btn-primary">
                <Phone className="h-4 w-4" /> Call HME
              </a>
            </div>
            <Link href="/locate-us" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-brand-blue hover:underline">
              <MapPin className="h-4 w-4" /> Choose a branch
            </Link>
            <p className="mt-6 border-t border-line pt-5 text-xs leading-relaxed text-slate2">
              A WhatsApp message is an inquiry, not a confirmed booking. Availability, collection window and final rate are confirmed by the branch.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
