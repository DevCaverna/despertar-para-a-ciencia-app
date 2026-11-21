import { z } from 'zod';

export const draftSchema = z.object({
  title: z.string().trim().min(1, 'validationDraftTitle'),
  content: z.string().trim().min(1, 'validationDraftContent'),
});

export type DraftValues = z.infer<typeof draftSchema>;
