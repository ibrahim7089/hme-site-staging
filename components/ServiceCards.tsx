import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  Building2,
  CalendarClock,
  Globe,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import SectionHeading from "./SectionHeading";
import currencyCounter from "@/public/images/currency-exchange-counter.webp";
import transferCounter from "@/public/images/moneytransfer-counter.webp";
import branchesCounter from "@/public/images/branches-counter.webp";
import agentHandshake from "@/public/images/agent-handshake.webp";

type ServiceCardProps = {
  icon: LucideIcon;
  title: string;
  copy: string;
  href: string;
  label: string;
  image?: StaticImageData;
  className?: string;
  light?: boolean;
};

function ServiceCard({
  icon: Icon,
  title,
  copy,
  href,
  label,
  image,
  className = "",
  light = false,
}: ServiceCardProps) {
  const foreground = light ? "text-navy" : "text-white";
  const secondary = light ? "text-slate2" : "text-white/72";
  const cardClass = [
    "service-bento-card group relative isolate flex min-h-[300px] overflow-hidden rounded-card border p-6 shadow-soft transition duration-500 hover:-translate-y-1 hover:shadow-deep md:p-8",
    light ? "border-line bg-white" : "border-white/10 bg-navy-deep",
    className,
  ].join(" ");

  return (
    <Link href={href} className={cardClass}>
      {image && (
        <>
          <Image
            src={image}
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 1023px) 100vw, 58vw"
            className="object-cover transition duration-700 group-hover:scale-[1.035]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#051530] via-[#071E44]/75 to-[#071E44]/5" />
        </>
      )}

      <div className={["service-card-body relative z-10 mt-auto max-w-xl", foreground].join(" ")}>
        <div
          className={[
            "mb-5 grid h-11 w-11 place-items-center rounded-xl",
            light ? "bg-brand-bluesoft" : "border border-white/15 bg-white/10 backdrop-blur",
          ].join(" ")}
        >
          <Icon
            className={["h-5 w-5", light ? "text-brand-blue" : "text-[#9AC8FF]"].join(" ")}
            strokeWidth={1.8}
          />
        </div>
        <p
          className={[
            "mb-2 text-xs font-bold uppercase tracking-[0.14em]",
            light ? "text-brand-red" : "text-[#9AC8FF]",
          ].join(" ")}
        >
          {label}
        </p>
        <h3 className="font-display text-2xl font-extrabold tracking-tight">{title}</h3>
        <p className={["mt-3 max-w-lg text-sm leading-relaxed", secondary].join(" ")}>
          {copy}
        </p>
        <span
          className={[
            "mt-5 inline-flex items-center gap-2 text-sm font-bold",
            light ? "text-brand-blue" : "text-white",
          ].join(" ")}
        >
          Learn more
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

export default function ServiceCards() {
  return (
    <section className="scroll-reveal bg-cloud pb-20 pt-16 md:pb-28 md:pt-24" id="services">
      <div className="wrap">
        <SectionHeading
          eyebrow="Start with your need"
          title="Five everyday needs. One trusted HME network."
          lead="Choose what you need today. Every service connects to the same experienced teams and nationwide branch network."
        />

        <div className="service-bento mt-11 grid gap-5 lg:grid-cols-12">
          <ServiceCard
            icon={ArrowLeftRight}
            title="Exchange with confidence"
            copy="Buy and sell foreign currencies with help from an experienced HME branch team."
            href="/currency-exchange"
            label="Currency Exchange"
            image={currencyCounter}
            className="min-h-[390px] lg:col-span-7 lg:min-h-[440px]"
          />
          <ServiceCard
            icon={Globe}
            title="Send money worldwide"
            copy="Make secure international transfers through a broad global payout network."
            href="/money-transfer"
            label="International Money Transfer"
            image={transferCounter}
            className="min-h-[390px] lg:col-span-5 lg:min-h-[440px]"
          />
          <ServiceCard
            icon={CalendarClock}
            title="Reserve before you go"
            copy="Book your preferred foreign currency and arrange collection at a convenient branch."
            href="/currency-booking"
            label="Currency Booking"
            light
            className="lg:col-span-4"
          />
          <ServiceCard
            icon={MapPin}
            title="Find HME nearby"
            copy="Search 50+ locations by state, city or available service."
            href="/locate-us"
            label="Branch Network"
            image={branchesCounter}
            className="lg:col-span-4"
          />
          <ServiceCard
            icon={Building2}
            title="Support for business"
            copy="Practical currency and transfer support for Malaysian corporate clients."
            href="/corporate"
            label="Business Services"
            image={agentHandshake}
            className="lg:col-span-4"
          />
        </div>
      </div>
    </section>
  );
}
