"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/map", label: "Projects" },
  { href: "/where-we-work", label: "Where We Work" },
  { href: "/form", label: "Contact" },
];

const DONATE_URL = "https://www.constructionforchange.org/donate/";

const subscribeScroll = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
};
const getScrolled = () => window.scrollY > 32;
const getServerScrolled = () => false;

export function NavBar() {
  const pathname = usePathname();
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    getScrolled,
    getServerScrolled
  );
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Modal behaviour while the mobile menu is open: lock page scroll, make the
  // rest of the page inert, close on Escape, and return focus to the toggle.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const inertTargets = Array.from(
      document.querySelectorAll<HTMLElement>("main, footer")
    );
    for (const el of inertTargets) el.setAttribute("inert", "");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const toggle = toggleRef.current;
    return () => {
      document.body.style.overflow = previousOverflow;
      for (const el of inertTargets) el.removeAttribute("inert");
      window.removeEventListener("keydown", onKey);
      toggle?.focus();
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          solid
            ? "bg-cfc-slate/95 shadow-[0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 md:px-8"
        >
          <Link
            href="/"
            aria-label="Construction for Change, home"
            className="inline-flex items-center rounded-md bg-white px-3 py-1.5"
          >
            <Image
              src="/cfc-logo.png"
              alt="Construction for Change"
              width={750}
              height={236}
              priority
              className="h-7 w-auto md:h-8"
            />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative rounded-md px-3.5 py-2 font-heading text-[15px] uppercase tracking-[1.5px] transition-colors ${
                    active ? "text-white" : "text-white/75 hover:text-white"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3.5 -bottom-0.5 h-0.5 bg-cfc-red"
                    />
                  )}
                </Link>
              );
            })}
            <a
              href={DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="cfc-btn-primary sm ml-3"
            >
              Donate
            </a>
          </div>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-white md:hidden"
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </nav>
      </header>

      {/* Always rendered so aria-controls resolves; toggled with `hidden`. */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        hidden={!open}
        className={`fixed inset-0 z-40 flex-col bg-cfc-slate px-6 pt-[96px] pb-10 md:hidden ${
          open ? "flex" : "hidden"
        }`}
      >
        <ul className="flex flex-col gap-2">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === link.href ? "page" : undefined}
                className={`block border-b border-white/10 py-4 font-heading text-2xl uppercase tracking-[2px] ${
                  pathname === link.href ? "text-white" : "text-white/80"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <a
          href={DONATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="cfc-btn-primary mt-8 text-center"
        >
          Donate
        </a>
      </div>
    </>
  );
}
