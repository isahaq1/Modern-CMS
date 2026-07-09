"use client";

import { useEffect, useState } from "react";
import { Search, ScrollText } from "lucide-react";
import { api } from "@/lib/api";

type AuditEntry = {
  id: string;
  userEmail: string | null;
  action: string;
  entityPath: string;
  status: number;
  createdAt: string;
};

/** Read-only trail of every successful content/settings mutation: who, what URL,
 * when. Captured automatically by API middleware; admin-only. */
export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get<AuditEntry[]>(`/api/audit${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`)
        .then(setEntries)
        .catch(() => setEntries([]));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-semibold flex items-center gap-2 shrink-0">
          <ScrollText size={22} /> Audit Log
        </h1>
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by user, action, or path…"
            className="w-full border rounded-md pl-8 pr-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Who</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Path</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries === null && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-400">Loading…</td></tr>
            )}
            {entries?.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-400">No entries{search ? " match that filter" : " yet"}.</td></tr>
            )}
            {entries?.map((e) => (
              <tr key={e.id}>
                <td className="px-3 py-2 whitespace-nowrap text-slate-500">{new Date(e.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2 whitespace-nowrap">{e.userEmail ?? <span className="text-slate-400">anonymous</span>}</td>
                <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">{e.action}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-500 truncate max-w-[280px]" title={e.entityPath}>{e.entityPath}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-3">Latest 200 entries shown. Failed requests aren&apos;t recorded.</p>
    </div>
  );
}
