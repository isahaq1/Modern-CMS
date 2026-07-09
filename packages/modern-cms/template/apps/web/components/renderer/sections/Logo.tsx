import Link from "next/link";
import { useSiteData } from "@/components/theme/SiteDataContext";
import { CmsImage } from "../CmsImage";
import type { SectionProps } from "./types";

export function Logo({ node }: SectionProps) {
  const { theme } = useSiteData();
  const useSiteLogo = node.props.useSiteLogo !== false;
  const customImage = node.props.customImage as string;
  const href = (node.props.href as string) || "/";
  const height = (node.props.height as string) || "36px";

  const src = useSiteLogo ? theme.logoUrl : customImage || theme.logoUrl;

  return (
    <Link href={href} className="inline-flex items-center font-heading text-lg font-semibold shrink-0">
      {src ? (
        <CmsImage src={src} alt={theme.siteName} width={240} height={80} style={{ height, width: "auto" }} />
      ) : (
        <span>{theme.siteName}</span>
      )}
    </Link>
  );
}
