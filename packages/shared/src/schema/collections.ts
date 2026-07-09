import { z } from "zod";
import { PageNodeSchema, PageStatusSchema } from "./pageNode.js";

export const CollectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string().optional(),
});
export type Collection = z.infer<typeof CollectionSchema>;

export const CollectionItemSchema = z.object({
  id: z.string(),
  collectionId: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  ogImage: z.string().nullable().optional(),
  noIndex: z.boolean().optional(),
  content: PageNodeSchema,
  status: PageStatusSchema,
  publishedAt: z.string().nullable().optional(),
  locale: z.string().optional(),
  translationOfId: z.string().nullable().optional(),
  createdById: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type CollectionItem = z.infer<typeof CollectionItemSchema>;

export const CreateCollectionInputSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
});

export const CreateCollectionItemInputSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  locale: z.string().min(2).max(20).optional(),
});

export const UpdateCollectionItemInputSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  excerpt: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  ogImage: z.string().nullable().optional(),
  noIndex: z.boolean().optional(),
  content: PageNodeSchema.optional(),
  status: PageStatusSchema.optional(),
  locale: z.string().min(2).max(20).optional(),
  translationOfId: z.string().nullable().optional(),
});

/** The card-level view of an item, as returned by the public list endpoint. */
export type CollectionItemSummary = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
};
