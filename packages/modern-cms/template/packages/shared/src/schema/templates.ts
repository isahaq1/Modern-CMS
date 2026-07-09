import { z } from "zod";
import { PageNodeSchema } from "./pageNode.js";

export const PageTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  thumbnail: z.string().nullable().optional(),
  content: PageNodeSchema,
  createdAt: z.string().optional(),
});
export type PageTemplate = z.infer<typeof PageTemplateSchema>;

export const CreatePageTemplateInputSchema = z.object({
  name: z.string().min(1).max(80),
  category: z.string().min(1).max(40).optional(),
  thumbnail: z.string().nullable().optional(),
  content: PageNodeSchema,
});
export type CreatePageTemplateInput = z.infer<typeof CreatePageTemplateInputSchema>;
