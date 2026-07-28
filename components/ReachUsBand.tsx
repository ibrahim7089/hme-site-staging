import Link from "next/link";
import { Phone, MessageSquareText, MapPin, MessageCircle } from "lucide-react";
import { site } from "@/lib/site";

const items = [
  { icon: Phone, label: `Call us: ${site.phone}`, href: `tel:${site.phone}` },
  { icon: MessageSquareText, label: "Send an Online Enquiry", href: "/enquiry" },
  { icon: MapPin, label: "Visit a Branch Near You", href: "/locate-us" },
  { icon: MessageCircle, label: "Message Us", href: site.whatsapp },
];

export default function ReachUsBand() {
  return (
    <section className="bg-navy py-10">
      <div className="wrap text-center">
        <h2 className="mb-5 font-display text-2xl font-extrabold text-white">Ways to Reach Us</h2>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {items.map((i) => (
            <Link key={i.label} href={i.href}
              className="flex items-center gap-2 text-[13.5px] font-medium text-[#D7E3F6] transition hover:text-white">
              <i.icon className="h-4 w-4 flex-none" strokeWidth={2.25} />
              {i.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
