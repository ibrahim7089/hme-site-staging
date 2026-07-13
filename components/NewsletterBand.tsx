import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { site } from "@/lib/site";

export default function NewsletterBand() {
  return (
    <section className="bg-[radial-gradient(900px_400px_at_50%_-20%,#E8F0FC_0%,#F4F7FB_60%)] py-16">
      <div className="wrap text-center">
        <h2 className="font-display text-[22px] font-extrabold text-navy sm:text-2xl">
          Need the latest rate or availability?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate2">
          Contact an HME branch directly and confirm the details before your transaction.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={site.whatsapp} target="_blank" rel="noreferrer" className="btn-red">
            <MessageCircle className="h-4 w-4" /> Ask on WhatsApp
          </a>
          <Link href="/locate-us" className="btn-primary">Find a Branch</Link>
        </div>
      </div>
    </section>
  );
}
