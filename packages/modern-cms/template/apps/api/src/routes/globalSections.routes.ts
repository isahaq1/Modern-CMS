import { Router } from "express";
import { PageNodeSchema } from "@pgcms/shared";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const globalSectionsRouter = Router();

const KINDS = new Set(["header", "footer", "goToTop"]);

const UpdateGlobalSectionSchema = z.object({
  enabled: z.boolean().optional(),
  content: PageNodeSchema.optional(),
});

// Public: both global sections in one response — the public site fetches this once
// per request alongside the page/theme.
globalSectionsRouter.get("/", async (_req, res) => {
  const sections = await prisma.globalSection.findMany();
  res.json(sections);
});

globalSectionsRouter.put("/:kind", requireAuth, requireRole("ADMIN", "EDITOR"), async (req, res) => {
  const kind = req.params.kind;
  if (!KINDS.has(kind)) return res.status(400).json({ error: "kind must be 'header' or 'footer'" });

  const parsed = UpdateGlobalSectionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const section = await prisma.globalSection.upsert({
    where: { kind },
    update: {
      ...(parsed.data.enabled !== undefined ? { enabled: parsed.data.enabled } : {}),
      ...(parsed.data.content !== undefined ? { content: parsed.data.content as object } : {}),
    },
    create: {
      kind,
      enabled: parsed.data.enabled ?? false,
      content: (parsed.data.content ?? { id: "root", type: "root", props: {}, style: {}, children: [] }) as object,
    },
  });
  res.json(section);
});
