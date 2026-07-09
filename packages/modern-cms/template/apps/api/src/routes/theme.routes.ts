import { Router } from "express";
import { UpdateThemeInputSchema, UpsertNavItemInputSchema } from "@pgcms/shared";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { triggerRevalidation } from "../lib/revalidate.js";

export const themeRouter = Router();

async function getOrCreateTheme() {
  const existing = await prisma.siteTheme.findFirst();
  if (existing) return existing;
  return prisma.siteTheme.create({ data: {} });
}

// Public: theme + nav are needed to render the public site
themeRouter.get("/public", async (_req, res) => {
  const theme = await getOrCreateTheme();
  res.json(theme);
});

themeRouter.get("/nav/public", async (_req, res) => {
  const items = await prisma.navItem.findMany({ orderBy: { order: "asc" } });
  res.json(items);
});

themeRouter.use(requireAuth);

themeRouter.get("/", async (_req, res) => {
  res.json(await getOrCreateTheme());
});

themeRouter.put("/", requireRole("ADMIN"), async (req, res) => {
  const parsed = UpdateThemeInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const current = await getOrCreateTheme();
  const updated = await prisma.siteTheme.update({ where: { id: current.id }, data: parsed.data });
  void triggerRevalidation(["cms", "cms-theme"]);
  res.json(updated);
});

themeRouter.get("/nav", async (_req, res) => {
  const items = await prisma.navItem.findMany({ orderBy: { order: "asc" } });
  res.json(items);
});

themeRouter.post("/nav", requireRole("ADMIN"), async (req, res) => {
  const parsed = UpsertNavItemInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const item = await prisma.navItem.create({ data: parsed.data });
  void triggerRevalidation(["cms", "cms-nav"]);
  res.status(201).json(item);
});

themeRouter.put("/nav/:id", requireRole("ADMIN"), async (req, res) => {
  const parsed = UpsertNavItemInputSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const item = await prisma.navItem.update({ where: { id: req.params.id }, data: parsed.data });
    void triggerRevalidation(["cms", "cms-nav"]);
    res.json(item);
  } catch {
    res.status(404).json({ error: "Not found" });
  }
});

themeRouter.delete("/nav/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    await prisma.navItem.delete({ where: { id: req.params.id } });
    void triggerRevalidation(["cms", "cms-nav"]);
    res.status(204).end();
  } catch {
    res.status(404).json({ error: "Not found" });
  }
});
