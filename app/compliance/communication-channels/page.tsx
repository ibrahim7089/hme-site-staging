import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Communication Channels | HME Compliance",
  description: "Official channels to reach HME for enquiries, feedback and complaints.",
};

const channels = [
  { h: "Branch counter", p: "Raise any question or concern directly with staff at any HME branch — see our Branches page to find one near you." },
  { h: "Phone", p: `Call us at ${site.phone} (Sungai Petani) or ${site.klPhone} (Kuala Lumpur) during business hours.` },
  { h: "Online enquiry", p: "Use our secure online form for enquiries, feedback and complaints. We acknowledge submissions promptly and keep you updated until resolved.", href: "/enquiry" },
  { h: "WhatsApp", p: "Message us on WhatsApp for quick questions about rates, branches or services." },
  { h: "Social media", p: "Follow and message HME on Facebook, Instagram, TikTok and LinkedIn for updates and general enquiries." },
];

export default function CommunicationChannelsPage() {
  return (
    <>
      <PageHero pageKey="communication-channels" eyebrow="Compliance" title="Communication Channels"
        lead="Official ways to reach HME for enquiries, feedback or to raise a complaint." />
      <section className="py-20">
        <div className="wrap max-w-3xl">
          {channels.map((channel) => (
            <div key={channel.h} className="border-t border-line py-6 first:border-t-0 first:pt-0">
              <h3 className="mb-2 text-lg font-bold text-navy">{channel.h}</h3>
              <p className="text-sm leading-relaxed text-slate2">{channel.p}</p>
              {channel.href && <Link href={channel.href} className="mt-3 inline-flex text-sm font-bold text-brand-blue hover:underline">Open enquiry form &rarr;</Link>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
