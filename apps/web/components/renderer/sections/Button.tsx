import clsx from "clsx";

const SIZE_CLASSES = {
  sm: "px-4 py-1.5 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
} as const;

export function Button({
  text,
  href,
  variant = "primary",
  border = "default",
  size = "md",
}: {
  text: string;
  href: string;
  variant?: "primary" | "secondary" | "outline" | "text";
  /** Overrides the variant's implicit border — "default" leaves the variant's own
   * border behavior alone (outline gets one, primary/secondary don't). */
  border?: "default" | "none" | "solid";
  size?: "sm" | "md" | "lg";
}) {
  const showBorder = border === "solid" || (border === "default" && variant === "outline");

  return (
    <a
      href={href}
      className={clsx(
        "inline-flex items-center justify-center font-semibold transition-opacity hover:opacity-90",
        SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
        variant === "primary" && "bg-theme-primary text-white rounded-lg",
        variant === "secondary" && "bg-theme-secondary text-white rounded-lg",
        variant === "outline" && "rounded-lg",
        variant === "text" && "rounded-none bg-transparent",
        showBorder && "border-2 border-current"
      )}
    >
      {text}
    </a>
  );
}
