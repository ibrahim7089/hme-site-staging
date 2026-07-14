"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LineChart, Globe, MapPin, MessageCircle } from "lucide-react";
import { site } from "@/lib/site";

export default function MobileStickyCTA() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  const items = [
    { icon: LineChart, label: "Rates", href: "/rates" },
    { icon: Globe, label: "Send Money", href: "/money-transfer" },
    { icon: MapPin, label: "Locate Us", href: "/locate-us" },
    { icon: MessageCircle, label: "WhatsApp", href: site.whatsapp, external: true },
  ];

  const className = (active: boolean, external?: boolean) =>
    `flex flex-col items-center gap-1 px-1 pb-3 pt-2.5 font-display text-[10.5px] font-bold transition ${
      external ? "text-brand-red" : active ? "bg-brand-bluesoft text-brand-blue" : "text-slate2"
    }`;

  return (
    <nav aria-label="Quick actions"
      className="fixed inset-x-0 bottom-0 z-[60] grid grid-cols-4 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(11,46,99,.10)] md:hidden">
      {items.map((item) => {
        const active = !item.external && (pathname === item.href || pathname.startsWith(`${item.href}/`));
        const content = <><item.icon className="h-[19px] w-[19px]" strokeWidth={2.25} />{item.label}</>;

        return item.external ? (
          <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className={className(false, true)}>
            {content}
          </a>
        ) : (
          <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={className(active)}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
