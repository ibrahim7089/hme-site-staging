"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { nav } from "@/lib/site";
import Logo from "./Logo";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkCls = scrolled
    ? "text-slate2 hover:bg-brand-bluesoft hover:text-navy"
    : "text-white/90 hover:bg-white/10 hover:text-white";

  return (
    <header className={`fixed left-0 right-0 top-0 z-50 w-full transition-all duration-300 ${
      scrolled
        ? "border-b border-line bg-white/95 shadow-sm backdrop-blur-md"
        : "border-b border-white/10 bg-transparent"
    }`}>
      <div className="wrap flex h-[72px] items-center gap-6">
        <Link href="/" className="flex flex-none items-center">
          <Logo size="sm" dark={!scrolled} />
        </Link>

        <Link href="/money-transfer" className="btn-red hidden !px-4 !py-2.5 !text-[13.5px] lg:inline-flex">
          Send Money
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {nav.map((i) =>
            "children" in i && i.children ? (
              <div key={i.label} className="group relative">
                <button className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition ${linkCls}`}>
                  {i.label}
                  <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" strokeWidth={2.5} />
                </button>
                <div className="invisible absolute left-0 top-full z-20 min-w-[220px] rounded-xl border border-line bg-white p-2 opacity-0 shadow-deep transition group-hover:visible group-hover:opacity-100">
                  {i.children.map((c) => (
                    <Link key={c.href} href={c.href}
                      className="block rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-slate2 hover:bg-brand-bluesoft hover:text-navy">
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link key={i.href} href={i.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${linkCls}`}>
                {i.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex flex-none items-center gap-2.5 lg:ml-auto">
          <Link href="/rates" className="btn-primary hidden !px-4 !py-2.5 !text-[13.5px] sm:inline-flex">
            Check Today&rsquo;s Rates
          </Link>
          <button aria-label="Menu" onClick={() => setOpen(!open)}
            className={`grid h-10 w-10 place-items-center rounded-lg border lg:hidden ${
              scrolled ? "border-line text-navy" : "border-white/30 text-white"
            }`}>
            <span>{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-white lg:hidden">
          <div className="wrap flex flex-col py-3">
            {nav.map((i) =>
              "children" in i && i.children ? (
                <div key={i.label}>
                  <button onClick={() => setOpenMobileMenu(openMobileMenu === i.label ? null : i.label)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium text-slate2 hover:bg-brand-bluesoft hover:text-navy">
                    {i.label}
                    <ChevronDown className={`h-4 w-4 transition ${openMobileMenu === i.label ? "rotate-180" : ""}`} strokeWidth={2.5} />
                  </button>
                  {openMobileMenu === i.label && (
                    <div className="ml-3 flex flex-col border-l border-line pl-3">
                      {i.children.map((c) => (
                        <Link key={c.href} href={c.href} onClick={() => setOpen(false)}
                          className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate2 hover:bg-brand-bluesoft hover:text-navy">
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link key={i.href} href={i.href} onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-[15px] font-medium text-slate2 hover:bg-brand-bluesoft hover:text-navy">
                  {i.label}
                </Link>
              )
            )}
            <Link href="/contact" onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-[15px] font-medium text-slate2 hover:bg-brand-bluesoft hover:text-navy">
              Contact
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
