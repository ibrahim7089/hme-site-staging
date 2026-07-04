import Link from "next/link";
import { site, legalLinks } from "@/lib/site";
import Logo from "./Logo";

const socialLinks = [
  { label: "f", href: site.social.facebook },
  { label: "ig", href: site.social.instagram },
  { label: "tt", href: site.social.tiktok },
  { label: "in", href: site.social.linkedin },
];

export default function Footer() {
  return (
    <footer className="bg-navy-ink pt-16 text-mist">
      <div className="wrap">
        <div className="grid gap-9 pb-11 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Logo size="md" dark />
            <p className="my-4 max-w-xs text-[13px]">
              {site.legalName} &mdash; currency exchange, international money transfer and currency
              booking through one trusted Malaysian MSB network.
            </p>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-[11.5px] leading-relaxed">
              <b className="mb-1 block text-xs text-[#D7E3F6]">Licensed Money Services Business</b>
              Company Reg. No. {site.regNo} &middot; MSB Licence No. {site.msbNo}<br />
              {site.licenceLine}
            </div>
          </div>
          <div>
            <h5 className="mb-4 font-display text-[13px] font-bold uppercase tracking-widest text-white">Services</h5>
            <ul className="flex flex-col gap-2.5 text-[13.5px]">
              <li><Link className="hover:text-white" href="/currency-exchange">Foreign Currency Exchange</Link></li>
              <li><Link className="hover:text-white" href="/money-transfer">International Money Transfer</Link></li>
              <li><Link className="hover:text-white" href="/currency-booking">Currency Booking</Link></li>
              <li><Link className="hover:text-white" href="/corporate">Corporate Services</Link></li>
              <li><Link className="hover:text-white" href="/be-our-agent">Be Our Agent</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="mb-4 font-display text-[13px] font-bold uppercase tracking-widest text-white">Company</h5>
            <ul className="flex flex-col gap-2.5 text-[13.5px]">
              <li><Link className="hover:text-white" href="/about">Our History</Link></li>
              <li><Link className="hover:text-white" href="/compliance">Compliance Policies</Link></li>
              <li><Link className="hover:text-white" href="/career">Career</Link></li>
              <li><Link className="hover:text-white" href="/faq">FAQ</Link></li>
              <li><Link className="hover:text-white" href="/contact">Inquiry</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="mb-4 font-display text-[13px] font-bold uppercase tracking-widest text-white">Head Office</h5>
            <ul className="flex flex-col gap-2.5 text-[13.5px]">
              <li>{site.hqAddress1}</li>
              <li>{site.hqAddress2}</li>
              <li><a className="hover:text-white" href={`tel:${site.phone}`}>&#128222; {site.phone}</a></li>
              <li><a className="hover:text-white" href={`mailto:${site.email}`}>&#9993; {site.email}</a></li>
            </ul>
          </div>
        </div>
        <nav aria-label="Legal and policy links" className="flex flex-wrap gap-y-2 border-t border-white/10 py-5 text-[12.5px]">
          {legalLinks.map((l, i) => (
            <span key={l.href} className="flex items-center">
              <Link href={l.href} className="hover:text-white">{l.label}</Link>
              {i < legalLinks.length - 1 && <span className="mx-2.5 text-white/20">|</span>}
            </span>
          ))}
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-white/10 py-5 text-xs">
          <span>{site.licenceLine}<br />&copy; 2026 {site.legalName}. All rights reserved.</span>
          <div className="flex gap-2.5">
            {socialLinks.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                className="grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-white/5 text-sm transition hover:bg-brand-blue hover:text-white">{s.label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
