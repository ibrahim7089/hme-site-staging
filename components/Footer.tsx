import Link from "next/link";
import { FaFacebookF, FaInstagram, FaTiktok, FaLinkedinIn } from "react-icons/fa6";
import { site, legalLinks } from "@/lib/site";

const socialLinks = [
  { label: "Facebook", icon: FaFacebookF, href: site.social.facebook },
  { label: "Instagram", icon: FaInstagram, href: site.social.instagram },
  { label: "TikTok", icon: FaTiktok, href: site.social.tiktok },
  { label: "LinkedIn", icon: FaLinkedinIn, href: site.social.linkedin },
];

export default function Footer() {
  return (
    <footer className="bg-navy-ink text-[#B9C8E0]">
      <div className="wrap">
        <nav aria-label="Legal and policy links" className="flex flex-wrap gap-y-2 py-6 text-[12.5px]">
          {legalLinks.map((link, index) => (
            <span key={link.href} className="flex items-center">
              <Link href={link.href} className="hover:text-white">{link.label}</Link>
              {index < legalLinks.length - 1 && <span className="mx-2.5 text-white/20">|</span>}
            </span>
          ))}
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-white/10 py-5 text-xs">
          <span>&copy; 2026 {site.legalName}. All rights reserved.</span>
          <div className="flex gap-2.5">
            {socialLinks.map((social) => (
              <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}
                className="grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-white/5 text-sm transition hover:bg-brand-blue hover:text-white">
                <social.icon size={15} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
