import Link from "next/link";
import { Clock3, MapPin, MessageCircle } from "lucide-react";
import { site } from "@/lib/site";

export default function RateUnavailableNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded-card border border-line bg-white shadow-soft ${compact ? "p-5" : "p-7 sm:p-9"}`}>
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-brand-bluesoft">
          <Clock3 className="h-5 w-5 text-brand-blue" />
        </span>
        <div>
          <h3 className="font-display text-lg font-extrabold text-navy">Online rates are being updated</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate2">
            For the latest available rate, contact an HME branch before you travel or send money. Final rates are confirmed at the branch.
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={site.whatsapp} target="_blank" rel="noreferrer" className="btn-red">
          <MessageCircle className="h-4 w-4" /> Ask on WhatsApp
        </a>
        <Link href="/locate-us" className="btn-primary">
          <MapPin className="h-4 w-4" /> Find a Branch
        </Link>
      </div>
    </div>
  );
}
