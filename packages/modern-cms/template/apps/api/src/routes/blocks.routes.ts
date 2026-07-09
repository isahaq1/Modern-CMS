import { Router } from "express";
import { PageNodeSchema } from "@pgcms/shared";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const blocksRouter = Router();

const CreateBlockSchema = z.object({
  name: z.string().min(1).max(80),
  content: PageNodeSchema,
});

// The whole block library is builder-only, so every route requires an editor session.
blocksRouter.use(requireAuth, requireRole("ADMIN", "EDITOR"));

blocksRouter.get("/", async (_req, res) => {
  const blocks = await prisma.savedBlock.findMany({ orderBy: { createdAt: "desc" } });
  res.json(blocks);
});

blocksRouter.post("/", async (req, res) => {
  const parsed = CreateBlockSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const block = await prisma.savedBlock.create({
    data: { name: parsed.data.name, content: parsed.data.content as object },
  });
  res.status(201).json(block);
});

blocksRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.savedBlock.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Block not found" });
  }
});
