import Link from "next/link";
import type { ReactNode } from "react";

const isExternal = (href: string) => /^https?:\/\//.test(href);

export function Eyebrow({
  children,
  onDark = false,
  className = "",
}: {
  children: ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <p className={`cfc-eyebrow ${onDark ? "on-dark" : ""} ${className}`}>
      {children}
    </p>
  );
}

type CtaVariant = "primary" | "ghost" | "ghost-on-dark" | "outline-white";

const VARIANT_CLASS: Record<CtaVariant, string> = {
  primary: "cfc-btn-primary",
  ghost: "cfc-btn-ghost",
  "ghost-on-dark": "cfc-btn-ghost on-dark",
  "outline-white": "cfc-btn-outline-white",
};

/** Internal hrefs use next/link; external ones open in a new tab. */
export function Cta({
  href,
  variant = "primary",
  children,
  className = "",
}: {
  href: string;
  variant?: CtaVariant;
  children: ReactNode;
  className?: string;
}) {
  const cls = `${VARIANT_CLASS[variant]} ${className}`.trim();
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-5 md:px-8 ${className}`}>
      {children}
    </div>
  );
}
