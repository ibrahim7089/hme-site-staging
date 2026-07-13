"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { nav } from "@/lib/site";
import Logo from "./Logo";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const closeMenus = () => {
    setOpen(false);
    setOpenMobileMenu(null);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  const contextualCta = pathname.startsWith("/rates")
    ? { href: "/locate-us", label: "Find a Branch" }
    : pathname.startsWith("/locate-us")
      ? { href: "/contact", label: "Contact HME" }
      : pathname.startsWith("/money-transfer") || pathname.startsWith("/currency-booking")
        ? { href: "/locate-us", label: "Find a Branch" }
        : { href: "/rates", label: "Check Rates" };

  const desktopLinkClass = (active: boolean) => {
    if (scrolled) {
      return active
        ? "bg-brand-bluesoft text-brand-blue"
        : "text-slate2 hover:bg-brand-bluesoft hover:text-navy";
    }
    return active
      ? "bg-white/15 text-white"
      : "text-white/90 hover:bg-white/10 hover:text-white";
  };

  return (
    <header className={`fixed inset-x-0 top-0 z-50 w-full transition-all duration-300 ${
      scrolled
        ? "border-b border-line bg-white/95 shadow-sm backdrop-blur-md"
        : "border-b border-white/10 bg-transparent"
    }`}>
      <div className="wrap flex h-[72px] items-center gap-4">
        <Link onClick={closeMenus} href="/" aria-label="HME home" className="flex flex-none items-center">
          <Logo size="sm" dark={!scrolled} />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 xl:flex">
          {nav.map((item) => {
            const childActive = "children" in item && item.children?.some((child) => isActive(child.href));
            const active = isActive(item.href) || Boolean(childActive);

            return "children" in item && item.children ? (
              <div key={item.label} className="group relative">
                <button
                  type="button"
                  aria-haspopup="true"
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${desktopLinkClass(active)}`}
                >
                  {item.label}
                  <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180 group-focus-within:rotate-180" strokeWidth={2.5} />
                </button>
                <div className="invisible absolute left-0 top-full z-20 min-w-[220px] translate-y-1 rounded-xl border border-line bg-white p-2 opacity-0 shadow-deep transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  {item.children.map((child) => (
                    <Link onClick={closeMenus}
                      key={child.href}
                      href={child.href}
                      className={`block rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition ${
                        isActive(child.href)
                          ? "bg-brand-bluesoft text-brand-blue"
                          : "text-slate2 hover:bg-brand-bluesoft hover:text-navy"
                      }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link onClick={closeMenus} key={item.href} href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${desktopLinkClass(active)}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex flex-none items-center gap-2.5">
          <Link onClick={closeMenus} href={contextualCta.href} className="btn-primary hidden !px-4 !py-2.5 !text-[13.5px] sm:inline-flex">
            {contextualCta.label}
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className={`grid h-10 w-10 place-items-center rounded-lg border xl:hidden ${
              scrolled ? "border-line text-navy" : "border-white/30 text-white"
            }`}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Mobile navigation" className="max-h-[calc(100vh-72px)] overflow-y-auto border-t border-line bg-white xl:hidden">
          <div className="wrap flex flex-col py-3">
            {nav.map((item) => {
              const childActive = "children" in item && item.children?.some((child) => isActive(child.href));
              const active = isActive(item.href) || Boolean(childActive);

              return "children" in item && item.children ? (
                <div key={item.label}>
                  <button
                    type="button"
                    aria-expanded={openMobileMenu === item.label}
                    onClick={() => setOpenMobileMenu(openMobileMenu === item.label ? null : item.label)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-[15px] font-semibold ${
                      active ? "bg-brand-bluesoft text-brand-blue" : "text-slate2 hover:bg-brand-bluesoft hover:text-navy"
                    }`}
                  >
                    {item.label}
                    <ChevronDown className={`h-4 w-4 transition ${openMobileMenu === item.label ? "rotate-180" : ""}`} strokeWidth={2.5} />
                  </button>
                  {openMobileMenu === item.label && (
                    <div className="ml-3 flex flex-col border-l border-line pl-3">
                      {item.children.map((child) => (
                        <Link onClick={closeMenus} key={child.href} href={child.href}
                          className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                            isActive(child.href) ? "text-brand-blue" : "text-slate2 hover:bg-brand-bluesoft hover:text-navy"
                          }`}>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link onClick={closeMenus} key={item.href} href={item.href}
                  className={`rounded-lg px-3 py-3 text-[15px] font-semibold ${
                    active ? "bg-brand-bluesoft text-brand-blue" : "text-slate2 hover:bg-brand-bluesoft hover:text-navy"
                  }`}>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
