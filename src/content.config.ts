import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const dateSchema = z
  .union([z.coerce.date(), z.string()])
  .nullish()
  .transform((val) => {
    if (!val) return undefined;
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
  });

const stringArraySchema = z
  .union([z.array(z.string()), z.string().transform((s) => [s])])
  .default([]);

const baseSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    date: dateSchema,
    keywords: stringArraySchema,
    tags: stringArraySchema,
    slug: z.string().optional(),
  })
  .passthrough();

export const collections = {
  posts: defineCollection({
    loader: glob({
      pattern: "**/*.md",
      base: "./src/content/posts",
      generateId: ({ entry }) => entry.replace(/\.md$/, ""),
    }),
    schema: baseSchema,
  }),
  plans: defineCollection({
    loader: glob({
      pattern: "**/*.md",
      base: "./src/content/plans",
      generateId: ({ entry }) => entry.replace(/\.md$/, ""),
    }),
    schema: baseSchema,
  }),
  notes: defineCollection({
    loader: glob({
      pattern: "**/*.md",
      base: "./src/content/notes",
      generateId: ({ entry }) => entry.replace(/\.md$/, ""),
    }),
    schema: baseSchema,
  }),
};
