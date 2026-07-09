import { Router } from "express";
import { CreatePageTemplateInputSchema } from "@pgcms/shared";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const templatesRouter = Router();

// The whole gallery is builder-only — no public route, since templates are starting
// points for editors, not content anyone visits directly.
templatesRouter.use(requireAuth);

templatesRouter.get("/", async (_req, res) => {
  const templates = await prisma.pageTemplate.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, category: true, thumbnail: true, createdAt: true },
  });
  res.json(templates);
});

templatesRouter.post("/", requireRole("ADMIN", "EDITOR", "AUTHOR"), async (req, res) => {
  const parsed = CreatePageTemplateInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const template = await prisma.pageTemplate.create({
    data: {
      name: parsed.data.name,
      category: parsed.data.category || "General",
      thumbnail: parsed.data.thumbnail ?? null,
      content: parsed.data.content as object,
    },
  });
  res.status(201).json(template);
});

templatesRouter.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    await prisma.pageTemplate.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Template not found" });
  }
});
