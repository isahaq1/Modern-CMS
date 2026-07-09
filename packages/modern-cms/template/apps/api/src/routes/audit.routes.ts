import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const auditRouter = Router();

// Reading the audit trail is an admin-only capability.
auditRouter.use(requireAuth, requireRole("ADMIN"));

auditRouter.get("/", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const entries = await prisma.auditLog.findMany({
    where: search
      ? {
          OR: [
            { userEmail: { contains: search, mode: "insensitive" } },
            { entityPath: { contains: search, mode: "insensitive" } },
            { action: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(entries);
});
