import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const SITE = "https://www.constructionforchange.org";

interface FooterLink {
  label: string;
  href: string;
}

const QUICK_LINKS: FooterLink[] = [
  { label: "Our Story", href: `${SITE}/our-story/` },
  { label: "Our Team", href: `${SITE}/our-team/` },
  { label: "Our Work", href: "/map" },
  { label: "Our Services", href: `${SITE}/our-services/` },
];

const GET_INVOLVED: FooterLink[] = [
  { label: "Ways to Give", href: `${SITE}/ways-to-give/` },
  { label: "Volunteer", href: `${SITE}/volunteer/` },
  { label: "Join Our Board", href: `${SITE}/join-the-board/` },
  { label: "Opportunities for You", href: `${SITE}/opportunities-for-you/` },
];

const SOCIALS: { label: string; href: string; icon: LucideIcon }[] = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/ConstructionForChange/",
    icon: Facebook,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/construction-for-change/",
    icon: Linkedin,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@constructionforchange",
    icon: Youtube,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/constructionforchange/",
    icon: Instagram,
  },
];

const linkClass =
  "text-[15px] text-white/75 transition-colors hover:text-white";

function FooterAnchor({ link }: { link: FooterLink }) {
  if (link.href.startsWith("/")) {
    return (
      <Link href={link.href} className={linkClass}>
        {link.label}
      </Link>
    );
  }
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClass}
    >
      {link.label}
    </a>
  );
}

function LinkColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title}>
      <h3 className="font-heading text-[13px] uppercase tracking-[2px] text-cfc-gold">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <FooterAnchor link={l} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-cfc-slate-dark text-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div>
            <Link
              href="/"
              aria-label="Construction for Change, home"
              className="inline-flex items-center bg-white px-4 py-2.5"
            >
              <Image
                src="/cfc-logo.png"
                alt="Construction for Change"
                width={750}
                height={236}
                className="h-9 w-auto"
              />
            </Link>
            <p className="mt-6 max-w-xs text-[15px] leading-relaxed text-white/75">
              Delivering high-quality, sustainable social infrastructure that
              strengthens communities.
            </p>
            <ul className="mt-6 flex gap-2">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Construction for Change on ${label}`}
                    className="inline-flex h-10 w-10 items-center justify-center border border-white/15 text-white/80 transition-colors hover:border-cfc-red hover:bg-cfc-red hover:text-white"
                  >
                    <Icon size={18} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <LinkColumn title="Quick Links" links={QUICK_LINKS} />
          <LinkColumn title="Get Involved" links={GET_INVOLVED} />

          <div>
            <h3 className="font-heading text-[13px] uppercase tracking-[2px] text-cfc-gold">
              Contact
            </h3>
            <address className="mt-4 space-y-2.5 text-[15px] not-italic leading-relaxed text-white/75">
              <p>
                PO Box 15110
                <br />
                Seattle, WA 98115
              </p>
              <p>
                <a
                  href="mailto:info@constructionforchange.org"
                  className="transition-colors hover:text-white"
                >
                  info@constructionforchange.org
                </a>
              </p>
              <p>
                501(c)(3) Non-Profit Organization
                <br />
                Tax ID 26-2654958
              </p>
            </address>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-6 text-[13px] text-white/50">
          &copy; 2026 Construction for Change
        </div>
      </div>
    </footer>
  );
}
