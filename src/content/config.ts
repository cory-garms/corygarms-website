import { defineCollection, z } from 'astro:content';

const notesCollection = defineCollection({
  type: 'content', // This collection contains markdown (.md) or MDX files
  schema: z.object({
    title: z.string(),
    publishDate: z.date(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    // You can add an optional cover image field later if you want
    // coverImage: z.string().optional(),
  }),
});

// Export a single `collections` object to register your collection
export const collections = {
  notes: notesCollection,
};
