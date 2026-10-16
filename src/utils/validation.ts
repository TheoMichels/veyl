import { z } from 'zod';

export const digestCategorySchema = z.enum(['IA', 'Luxembourg', 'Tech'], {
  message: 'La catégorie doit être IA, Luxembourg ou Tech.',
});

export const createSourceSchema = z.object({
  name: z.string().trim().min(1, 'Le nom de la source est requis.'),
  url: z
    .string()
    .trim()
    .url('URL du flux RSS invalide.')
    .refine((val: string) => /^https?:\/\/.+/i.test(val), {
      message: "L'URL du flux RSS doit commencer par http:// ou https://.",
    }),
  category: digestCategorySchema,
});

export const toggleSourceSchema = z.object({
  id: z.string().trim().min(1, 'Identifiant de la source requis.'),
  isActive: z.boolean(),
});

export const deleteSourceSchema = z.object({
  id: z.string().trim().min(1, 'Identifiant de la source requis.'),
});

export const updateSettingsSchema = z.object({
  geminiPromptIA: z.string().trim().min(1, 'Le prompt IA ne peut pas être vide.'),
  geminiPromptLux: z.string().trim().min(1, 'Le prompt Luxembourg ne peut pas être vide.'),
  geminiPromptTech: z.string().trim().min(1, 'Le prompt Tech ne peut pas être vide.'),
  cronEnabled: z.boolean().optional(),
});

export const goFurtherSchema = z.object({
  text: z.string().trim().min(1, "Le texte de l'actualité à approfondir est requis."),
});

export const createDigestSchema = z.object({
  category: digestCategorySchema,
  title: z.string().trim().min(1, 'Le titre de la synthèse est requis.'),
  content: z.string().trim().min(1, 'Le contenu de la synthèse est requis.'),
});

export type CreateSourceInput = z.infer<typeof createSourceSchema>;
export type ToggleSourceInput = z.infer<typeof toggleSourceSchema>;
export type DeleteSourceInput = z.infer<typeof deleteSourceSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type GoFurtherInput = z.infer<typeof goFurtherSchema>;
export type CreateDigestInput = z.infer<typeof createDigestSchema>;
