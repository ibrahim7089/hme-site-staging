import Link from "next/link";
import { LineChart, Globe, MapPin, MessageCircle } from "lucide-react";
import { site } from "@/lib/site";

export default function MobileStickyCTA() {
  const items = [
    { icon: LineChart, label: "Rates", href: "/rates" },
    { icon: Globe, label: "Send Money", href: "/money-transfer" },
    { icon: MapPin, label: "Locate Us", href: "/locate-us" },
    { icon: MessageCircle, label: "WhatsApp", href: site.whatsapp, hot: true },
  ];
  return (
    <nav aria-label="Quick actions"
      className="fixed inset-x-0 bottom-0 z-[60] grid grid-cols-4 border-t border-line bg-white shadow-[0_-8px_24px_rgba(11,46,99,.10)] md:hidden">
      {items.map((i) => (
        <Link key={i.label} href={i.href}
          className={`flex flex-col items-center gap-1 px-1 pb-3 pt-2.5 font-display text-[10.5px] font-bold ${i.hot ? "text-brand-red" : "text-slate2"}`}>
          <i.icon className="h-[19px] w-[19px]" strokeWidth={2.25} />{i.label}
        </Link>
      ))}
    </nav>
  );
}
