import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";

export function IconRenderer({ name, ...props }: { name: string } & LucideProps) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name] ?? Icons.Square;
  return <Icon {...props} />;
}
