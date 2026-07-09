import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const redirectsRouter = Router();

const normalizePath = (p: string) => "/" + p.trim().replace(/^\/+/, "").replace(/\/+$/, "");

const CreateRedirectSchema = z.object({
  fromPath: z.string().min(1).max(500),
  toPath: z.string().min(1).max(500),
  permanent: z.boolean().optional(),
});

// Public: resolve one path — the web app's 404 fallback asks here before giving up.
redirectsRouter.get("/resolve", async (req, res) => {
  const path = typeof req.query.path === "string" ? normalizePath(req.query.path) : null;
  if (!path) return res.status(400).json({ error: "path query param required" });
  const redirect = await prisma.redirect.findUnique({ where: { fromPath: path } });
  if (!redirect) return res.status(404).json({ error: "No redirect" });
  res.json({ toPath: redirect.toPath, permanent: redirect.permanent });
});

redirectsRouter.use(requireAuth, requireRole("ADMIN", "EDITOR"));

redirectsRouter.get("/", async (_req, res) => {
  res.json(await prisma.redirect.findMany({ orderBy: { createdAt: "desc" } }));
});

redirectsRouter.post("/", async (req, res) => {
  const parsed = CreateRedirectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const fromPath = normalizePath(parsed.data.fromPath);
  const toPath = parsed.data.toPath.startsWith("http") ? parsed.data.toPath : normalizePath(parsed.data.toPath);
  if (fromPath === toPath) return res.status(400).json({ error: "A redirect cannot point at itself" });
  const existing = await prisma.redirect.findUnique({ where: { fromPath } });
  if (existing) return res.status(409).json({ error: "A redirect from this path already exists" });
  const redirect = await prisma.redirect.create({
    data: { fromPath, toPath, permanent: parsed.data.permanent ?? true },
  });
  res.status(201).json(redirect);
});

redirectsRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.redirect.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Not found" });
  }
});
