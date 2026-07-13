import Link from "next/link";
import { ArrowLeftRight, Globe, CalendarClock, Building2, ArrowRight } from "lucide-react";
import SectionHeading from "./SectionHeading";

const services = [
  { icon: ArrowLeftRight, title: "Currency Exchange",
    copy: "Buy and sell foreign currencies through HME's nationwide branch network.",
    href: "/currency-exchange" },
  { icon: Globe, title: "International Money Transfer",
    copy: "Send money to more than 150,000 payout locations worldwide, safely and securely.",
    href: "/money-transfer" },
  { icon: CalendarClock, title: "Currency Booking",
    copy: "Reserve your preferred currency and arrange collection at your chosen branch.",
    href: "/currency-booking" },
  { icon: Building2, title: "Business Services",
    copy: "Foreign currency and money transfer support for businesses and corporate clients.",
    href: "/corporate" },
];

function ServiceCard({ icon: Icon, title, copy, href }: { icon: typeof ArrowLeftRight; title: string; copy: string; href: string }) {
  return (
    <Link href={href} className="group flex h-full flex-col rounded-card border border-line bg-white p-6 text-left shadow-soft transition hover:-translate-y-1 hover:border-brand-blue/40 hover:shadow-deep">
      <span className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-brand-bluesoft transition group-hover:bg-brand-blue">
        <Icon className="h-6 w-6 text-brand-blue transition group-hover:text-white" strokeWidth={1.75} />
      </span>
      <h3 className="mb-2 font-display text-lg font-bold text-navy">{title}</h3>
      <p className="mb-5 text-sm leading-relaxed text-slate2">{copy}</p>
      <span className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-brand-blue">
        Learn more <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export default function ServiceCards() {
  return (
    <section className="bg-white py-16 md:py-20" id="services">
      <div className="wrap">
        <SectionHeading eyebrow="Our Services" title="Everything you need, in one network"
          lead="Choose the service that fits your needs. Our branch teams can help with rates, requirements and next steps." />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => <ServiceCard key={service.title} {...service} />)}
        </div>
      </div>
    </section>
  );
}
