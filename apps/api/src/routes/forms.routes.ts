import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { env } from "../env.js";

export const formsRouter = Router();

const SubmitFormSchema = z.object({
  formName: z.string().min(1).max(100),
  pageSlug: z.string().max(200).default(""),
  data: z.record(z.string(), z.string().max(5000)),
  /** Honeypot — real users leave this empty; bots often fill every field. */
  _hp: z.string().optional(),
});

const submitLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: "forms" });

async function notifyFormWebhook(payload: {
  formName: string;
  pageSlug: string;
  data: Record<string, string>;
  id: string;
  createdAt: Date;
}) {
  if (!env.formsWebhookUrl) return;
  try {
    await fetch(env.formsWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "form.submission", ...payload }),
    });
  } catch (err) {
    console.warn("Form webhook delivery failed:", err);
  }
}

// Public: anyone visiting the site can submit a Contact Form block.
formsRouter.post("/submit", submitLimiter, async (req, res) => {
  const parsed = SubmitFormSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (parsed.data._hp) {
    // Silently accept so bots don't retry with different payloads.
    return res.status(201).json({ id: "ok" });
  }

  const { formName, pageSlug, data } = parsed.data;
  const submission = await prisma.formSubmission.create({
    data: { formName, pageSlug, data },
  });

  void notifyFormWebhook({
    id: submission.id,
    formName,
    pageSlug,
    data,
    createdAt: submission.createdAt,
  });

  res.status(201).json({ id: submission.id });
});

// Admin: view submissions.
formsRouter.use(requireAuth, requireRole("ADMIN", "EDITOR"));

formsRouter.get("/submissions", async (req, res) => {
  const formName = typeof req.query.formName === "string" ? req.query.formName : undefined;
  const submissions = await prisma.formSubmission.findMany({
    where: formName ? { formName } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(submissions);
});

formsRouter.get("/submissions/export", async (req, res) => {
  const formName = typeof req.query.formName === "string" ? req.query.formName : undefined;
  const submissions = await prisma.formSubmission.findMany({
    where: formName ? { formName } : undefined,
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const fieldKeys = Array.from(new Set(submissions.flatMap((s) => Object.keys(s.data as Record<string, string>))));
  const header = ["id", "formName", "pageSlug", "createdAt", ...fieldKeys];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = submissions.map((s) => {
    const data = s.data as Record<string, string>;
    return [
      s.id,
      s.formName,
      s.pageSlug,
      s.createdAt.toISOString(),
      ...fieldKeys.map((k) => data[k] ?? ""),
    ]
      .map(escape)
      .join(",");
  });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="form-submissions${formName ? `-${formName}` : ""}.csv"`);
  res.send([header.map(escape).join(","), ...rows].join("\n"));
});

formsRouter.delete("/submissions/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    await prisma.formSubmission.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: "Not found" });
  }
});
