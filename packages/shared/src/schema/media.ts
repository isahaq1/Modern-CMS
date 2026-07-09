import { z } from "zod";

export const MediaAssetSchema = z.object({
  id: z.string(),
  key: z.string(),
  url: z.string(),
  mimeType: z.string(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  size: z.number(),
  createdAt: z.string().optional(),
});
export type MediaAsset = z.infer<typeof MediaAssetSchema>;
