import Link from "next/link";
import { ArrowLeftRight, Globe, CalendarClock, Building2, Star, Handshake, MapPin, ShieldCheck } from "lucide-react";
import SectionHeading from "./SectionHeading";

const services = [
  { icon: ArrowLeftRight, title: "Foreign Currency Exchange",
    copy: "Buy and sell foreign currencies at competitive rates through HME's branch network.",
    href: "/currency-exchange" },
  { icon: Globe, title: "International Money Transfer",
    copy: "Send money to over 150,000 payout locations worldwide, safely and securely.",
    href: "/money-transfer" },
  { icon: CalendarClock, title: "Currency Booking",
    copy: "Reserve your preferred currency online and collect it at your chosen branch.",
    href: "/currency-booking" },
  { icon: Building2, title: "Corporate & Agent Services",
    copy: "Foreign currency and money transfer solutions for businesses and corporate clients.",
    href: "/corporate" },
];

const more = [
  { icon: Star, title: "First Class Service", copy: "Best rates guaranteed, with no commission.", href: "/currency-exchange" },
  { icon: Handshake, title: "Be Our Agent", copy: "Partner with a licensed Malaysian MSB network.", href: "/be-our-agent" },
  { icon: MapPin, title: "Locate a Branch", copy: "Find your nearest HME branch nationwide.", href: "/locate-us" },
  { icon: ShieldCheck, title: "Compliance", copy: "Licensed and regulated under the MSB Act 2011.", href: "/compliance" },
];

function Tile({ icon: Icon, title, copy, href }: { icon: typeof ArrowLeftRight; title: string; copy: string; href: string }) {
  return (
    <Link href={href} className="group flex flex-col items-center px-4 text-center">
      <span className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-bluesoft transition group-hover:bg-brand-blue">
        <Icon className="h-7 w-7 text-brand-blue transition group-hover:text-white" strokeWidth={1.75} />
      </span>
      <h3 className="mb-1.5 font-display text-[15px] font-bold text-navy">{title}</h3>
      <p className="text-[13px] leading-snug text-slate2">{copy}</p>
    </Link>
  );
}

export default function ServiceCards() {
  return (
    <section className="py-20">
      <div className="wrap text-center">
        <SectionHeading center eyebrow="Our Services" title="What we offer" />
        <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => <Tile key={s.title} {...s} />)}
        </div>
        <div className="mt-12 grid gap-x-6 gap-y-12 border-t border-line pt-12 sm:grid-cols-2 lg:grid-cols-4">
          {more.map((s) => <Tile key={s.title} {...s} />)}
        </div>
      </div>
    </section>
  );
}
