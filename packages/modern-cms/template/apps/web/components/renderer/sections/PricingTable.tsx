import { Check } from "lucide-react";
import { Button } from "./Button";
import type { SectionProps } from "./types";

type Tier = {
  name: string;
  price: string;
  period?: string;
  features?: string;
  buttonText?: string;
  buttonHref?: string;
  highlighted?: boolean;
};

export function PricingTable({ node }: SectionProps) {
  const heading = node.props.heading as string;
  const tiers = (node.props.tiers as Tier[]) ?? [];

  if (tiers.length === 0) return null;

  return (
    <div>
      {heading && <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{heading}</h2>}
      <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(4, tiers.length)}, minmax(0, 1fr))` }}>
        {tiers.map((tier, i) => {
          const features = (tier.features ?? "").split("\n").map((f) => f.trim()).filter(Boolean);
          return (
            <div
              key={i}
              className={`flex flex-col gap-4 rounded-xl border p-6 ${
                tier.highlighted ? "border-theme-primary shadow-lg scale-105 bg-white" : "bg-white"
              }`}
            >
              {tier.highlighted && (
                <span className="self-start text-xs font-semibold uppercase tracking-wide text-theme-primary">Popular</span>
              )}
              <h3 className="text-lg font-semibold">{tier.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{tier.price}</span>
                {tier.period && <span className="text-sm opacity-60">{tier.period}</span>}
              </div>
              {features.length > 0 && (
                <ul className="flex flex-col gap-2 text-sm flex-1">
                  {features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <Check size={16} className="text-theme-primary shrink-0 mt-0.5" />
                      <span className="opacity-80">{f}</span>
                    </li>
                  ))}
                </ul>
              )}
              {tier.buttonText && (
                <Button
                  text={tier.buttonText}
                  href={tier.buttonHref || "#"}
                  variant={tier.highlighted ? "primary" : "outline"}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
