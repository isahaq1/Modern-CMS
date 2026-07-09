"use client";

import { useEffect, useState } from "react";
import { Trash2, Download } from "lucide-react";
import { api } from "@/lib/api";

type Submission = { id: string; formName: string; pageSlug: string; data: Record<string, string>; createdAt: string };

export default function FormSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [formFilter, setFormFilter] = useState<string>("");

  function refresh() {
    const query = formFilter ? `?formName=${encodeURIComponent(formFilter)}` : "";
    api.get<Submission[]>(`/api/forms/submissions${query}`).then(setSubmissions);
  }

  useEffect(refresh, [formFilter]);

  async function remove(id: string) {
    if (!confirm("Delete this submission?")) return;
    await api.delete(`/api/forms/submissions/${id}`);
    refresh();
  }

  function exportCsv() {
    const query = formFilter ? `?formName=${encodeURIComponent(formFilter)}` : "";
    window.open(`/api/forms/submissions/export${query}`, "_blank");
  }

  const formNames = Array.from(new Set(submissions?.map((s) => s.formName) ?? []));

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">Form Submissions</h1>
        <div className="flex items-center gap-2">
          <select
            value={formFilter}
            onChange={(e) => setFormFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="">All forms</option>
            {formNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 border rounded-md px-3 py-2 text-sm hover:bg-slate-50"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg divide-y">
        {submissions?.length === 0 && <div className="p-6 text-sm text-slate-500">No submissions yet.</div>}
        {submissions?.map((sub) => (
          <div key={sub.id} className="flex items-start justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span className="font-medium text-slate-600">{sub.formName}</span>
                <span>·</span>
                <span>{sub.pageSlug || "/"}</span>
                <span>·</span>
                <span>{new Date(sub.createdAt).toLocaleString()}</span>
              </div>
              <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-sm">
                {Object.entries(sub.data).map(([key, value]) => (
                  <div key={key} className="contents">
                    <dt className="text-slate-400 capitalize">{key}:</dt>
                    <dd className="text-slate-800 break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <button onClick={() => remove(sub.id)} className="text-slate-400 hover:text-red-600 shrink-0">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
