"use client";

import { useState, type FormEvent } from "react";
import type { SectionProps } from "./types";

type FormFieldDef = { key: string; label: string; fieldType: "text" | "email" | "tel" | "textarea"; required?: boolean };

export function ContactForm({ node }: SectionProps) {
  const heading = node.props.heading as string;
  const subheading = node.props.subheading as string;
  const formName = (node.props.formName as string) || "Contact";
  const fields = (node.props.fields as FormFieldDef[]) ?? [];
  const submitButtonText = (node.props.submitButtonText as string) || "Send";
  const successMessage = (node.props.successMessage as string) || "Thanks — we'll be in touch.";

  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const form = e.currentTarget;
    const hp = (form.elements.namedItem("_hp") as HTMLInputElement | null)?.value ?? "";
    try {
      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formName,
          pageSlug: window.location.pathname,
          data: values,
          _hp: hp,
        }),
      });
      if (!res.ok) throw new Error("submit failed");
      setStatus("done");
      setValues({});
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="text-center">
        <p className="text-lg">{successMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {heading && <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">{heading}</h2>}
      {subheading && <p className="text-center opacity-80 mb-6">{subheading}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot — hidden from users, bots often fill it */}
        <input type="text" name="_hp" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <label className="text-sm font-medium block">
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </label>
            {field.fieldType === "textarea" ? (
              <textarea
                required={field.required}
                value={values[field.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                rows={4}
                className="w-full border rounded-md px-3 py-2 text-sm text-slate-900 bg-white"
              />
            ) : (
              <input
                type={field.fieldType}
                required={field.required}
                value={values[field.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm text-slate-900 bg-white"
              />
            )}
          </div>
        ))}
        {status === "error" && (
          <p className="text-sm text-red-500">Something went wrong sending your message — please try again.</p>
        )}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full bg-theme-primary text-white rounded-md py-2.5 font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {status === "submitting" ? "Sending..." : submitButtonText}
        </button>
      </form>
    </div>
  );
}
