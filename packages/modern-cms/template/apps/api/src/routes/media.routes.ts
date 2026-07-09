import { Router } from "express";
import multer from "multer";
import { nanoid } from "nanoid";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { uploadBuffer, deleteObject } from "../lib/storage/index.js";

export const mediaRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB, enough for background videos
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(png|jpeg|jpg|gif|webp|svg\+xml)$|^video\/(mp4|webm|ogg)$/;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported file type"));
  },
});

mediaRouter.use(requireAuth);

mediaRouter.get("/", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const assets = await prisma.mediaAsset.findMany({
    where: search
      ? {
          OR: [
            { filename: { contains: search, mode: "insensitive" } },
            { alt: { contains: search, mode: "insensitive" } },
            { key: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });
  res.json(assets);
});

mediaRouter.post("/", requireRole("ADMIN", "EDITOR"), upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const ext = req.file.originalname.split(".").pop() ?? "bin";
  const key = `${nanoid(16)}.${ext}`;
  const url = await uploadBuffer(key, req.file.buffer, req.file.mimetype);

  const asset = await prisma.mediaAsset.create({
    data: {
      key,
      url,
      mimeType: req.file.mimetype,
      size: req.file.size,
      filename: req.file.originalname,
    },
  });
  res.status(201).json(asset);
});

// Metadata-only update — currently just alt text, the accessibility default used
// anywhere the asset renders without a per-usage alt.
mediaRouter.put("/:id", requireRole("ADMIN", "EDITOR"), async (req, res) => {
  const alt = typeof req.body.alt === "string" ? req.body.alt : undefined;
  if (alt === undefined) return res.status(400).json({ error: "alt (string) is required" });
  try {
    const asset = await prisma.mediaAsset.update({ where: { id: req.params.id }, data: { alt } });
    res.json(asset);
  } catch {
    res.status(404).json({ error: "Not found" });
  }
});

mediaRouter.delete("/:id", requireRole("ADMIN", "EDITOR"), async (req, res) => {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: req.params.id } });
  if (!asset) return res.status(404).json({ error: "Not found" });
  await deleteObject(asset.key);
  await prisma.mediaAsset.delete({ where: { id: asset.id } });
  res.status(204).end();
});
