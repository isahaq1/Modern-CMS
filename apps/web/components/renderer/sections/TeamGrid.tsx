import { Link2 } from "lucide-react";
import { CmsImage } from "../CmsImage";
import type { SectionProps } from "./types";

type Member = { photo?: string; name: string; role?: string; bio?: string; linkedinUrl?: string; twitterUrl?: string };

export function TeamGrid({ node }: SectionProps) {
  const heading = node.props.heading as string;
  const members = (node.props.members as Member[]) ?? [];
  const columns = Math.max(1, Math.min(5, Number(node.props.columns) || 4));

  if (members.length === 0) return null;

  return (
    <div>
      {heading && <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{heading}</h2>}
      <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {members.map((member, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            {member.photo ? (
              <div className="relative w-28 h-28 rounded-full overflow-hidden">
                <CmsImage src={member.photo} alt={member.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-28 h-28 rounded-full bg-slate-200" />
            )}
            <h3 className="font-semibold">{member.name}</h3>
            {member.role && <p className="text-sm opacity-60">{member.role}</p>}
            {member.bio && <p className="text-sm opacity-75">{member.bio}</p>}
            {(member.linkedinUrl || member.twitterUrl) && (
              <div className="flex gap-3 mt-1">
                {member.linkedinUrl && (
                  <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on LinkedIn`} className="opacity-60 hover:opacity-100">
                    <Link2 size={18} />
                  </a>
                )}
                {member.twitterUrl && (
                  <a href={member.twitterUrl} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on Twitter/X`} className="opacity-60 hover:opacity-100">
                    <Link2 size={18} />
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
