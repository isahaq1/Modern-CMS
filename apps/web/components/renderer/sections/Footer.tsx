import Link from "next/link";
import { Globe, MapPin, Phone, Mail } from "lucide-react";
import { useSiteData } from "@/components/theme/SiteDataContext";
import type { SectionProps } from "./types";

// lucide removed brand logos from the library, so social links render as simple
// monogram badges (an original, trademark-free treatment) — the platform's initials
// in a circle, sized to match the surrounding inline icons.
const SOCIAL_MONOGRAMS: Record<string, string> = {
  facebook: "f",
  twitter: "x",
  instagram: "ig",
  linkedin: "in",
  youtube: "yt",
};

function SocialBadge({ platform }: { platform: string }) {
  const monogram = SOCIAL_MONOGRAMS[platform];
  if (!monogram) return <Globe size={18} />;
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full border border-current text-[9px] font-bold leading-none lowercase"
    >
      {monogram}
    </span>
  );
}

type LinkColumn = { title: string; links: { label: string; href: string }[] };
type ContactInfo = { address?: string; phone?: string; email?: string; extraLine?: string };

export function Footer({ node }: SectionProps) {
  const { theme } = useSiteData();
  const text = (node.props.text as string) ?? "";
  const description = (node.props.description as string) ?? "";
  const socialLinks = (node.props.socialLinks as { platform: string; url: string }[]) ?? [];
  const linkColumns = (node.props.linkColumns as LinkColumn[]) ?? [];
  const contactInfo = (node.props.contactInfo as ContactInfo) ?? {};
  const bottomLinks = (node.props.bottomLinks as { label: string; href: string }[]) ?? [];

  const hasContactInfo = contactInfo.address || contactInfo.phone || contactInfo.email || contactInfo.extraLine;

  return (
    <div className="px-4">
      {(description || linkColumns.length > 0 || hasContactInfo) && (
        <div className="grid gap-10 pb-10 mb-8 border-b border-white/10" style={{ gridTemplateColumns: "2fr repeat(auto-fit, minmax(140px, 1fr))" }}>
          <div className="space-y-3">
            <div className="font-heading text-lg font-semibold">{theme.siteName}</div>
            {description && <p className="text-sm opacity-70 max-w-sm">{description}</p>}
          </div>
          {linkColumns.map((col, i) => (
            <div key={i} className="space-y-2">
              <div className="text-sm font-semibold opacity-90">{col.title}</div>
              <ul className="space-y-1.5">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <Link href={link.href} className="text-sm opacity-70 hover:opacity-100">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {hasContactInfo && (
            <div className="space-y-2">
              <div className="text-sm font-semibold opacity-90">Get In Touch</div>
              <ul className="space-y-2">
                {contactInfo.address && (
                  <li className="flex items-start gap-2 text-sm opacity-70">
                    <MapPin size={14} className="mt-0.5 shrink-0" /> {contactInfo.address}
                  </li>
                )}
                {contactInfo.phone && (
                  <li className="flex items-center gap-2 text-sm opacity-70">
                    <Phone size={14} className="shrink-0" /> {contactInfo.phone}
                  </li>
                )}
                {contactInfo.email && (
                  <li className="flex items-center gap-2 text-sm opacity-70">
                    <Mail size={14} className="shrink-0" /> {contactInfo.email}
                  </li>
                )}
                {contactInfo.extraLine && <li className="text-xs opacity-50">{contactInfo.extraLine}</li>}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-3 text-center md:text-left">
          <p className="text-sm opacity-80">{text}</p>
          {bottomLinks.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {bottomLinks.map((link, i) => (
                <Link key={i} href={link.href} className="text-xs opacity-70 hover:opacity-100 underline underline-offset-2">
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
        {socialLinks.length > 0 && (
          <div className="flex items-center gap-4">
            {socialLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noreferrer" aria-label={link.platform}>
                <SocialBadge platform={link.platform} />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
