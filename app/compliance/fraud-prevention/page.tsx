import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Fraud Prevention | HME Compliance",
  description: "How to recognise and report scams impersonating HME, and how we help keep your currency exchange and money transfer transactions safe.",
};

const tips = [
  "HME staff will never ask you for your online banking password, full card number or one-time password (OTP) over the phone, WhatsApp or email.",
  "Always verify branch staff identification before handing over cash or documents at the counter.",
  "Be cautious of unsolicited calls or messages offering unusually favourable exchange or money transfer rates.",
  "Double-check beneficiary details before confirming any money transfer — transfers cannot be reversed once processed.",
  "Only use official HME contact channels listed on our Communication Channels page to verify any offer or request.",
];

export default function FraudPreventionPage() {
  return (
    <>
      <PageHero eyebrow="Compliance" title="Fraud Prevention"
        lead="Simple steps to protect yourself, and how to report anything that looks suspicious." />
      <section className="py-20">
        <div className="wrap max-w-3xl">
          <div className="grid gap-3.5">
            {tips.map((t) => (
              <div key={t} className="flex items-start gap-3 rounded-tile border border-line bg-white p-4">
                <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-lg bg-brand-redsoft text-[13px] font-extrabold text-brand-red">!</span>
                <p className="text-[13.5px] font-medium leading-snug text-slate2">{t}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-slate2">
            Suspect fraud involving HME&rsquo;s name? Call {site.phone} or{" "}
            <Link href="/enquiry?type=complaint&subject=Suspected%20fraud" className="font-bold text-brand-blue hover:underline">submit a fraud report</Link> immediately.
          </p>
        </div>
      </section>
    </>
  );
}
