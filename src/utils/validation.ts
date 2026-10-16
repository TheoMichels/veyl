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

export const digestSchema = z.object({
  id: z.string().min(1),
  category: digestCategorySchema,
  title: z.string().min(1),
  content: z.string(),
  createdAt: z.string(),
});

export const digestsListSchema = z.array(digestSchema);

export const sourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  url: z.string().trim().url(),
  category: digestCategorySchema,
  isActive: z.boolean(),
});

export const sourcesListSchema = z.array(sourceSchema);

export const credentialsSchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide.'),
  password: z.string().min(6, 'Le mot de passe doit comporter au moins 6 caractères.'),
});

export const settingsSchema = z.object({
  id: z.string().default('default'),
  geminiPromptIA: z.string(),
  geminiPromptLux: z.string(),
  geminiPromptTech: z.string(),
  cronEnabled: z.boolean().default(true),
});

export function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(issue ? issue.message : 'Validation des données échouée.');
  }
  return result.data;
}

export type CreateSourceInput = z.infer<typeof createSourceSchema>;
export type ToggleSourceInput = z.infer<typeof toggleSourceSchema>;
export type DeleteSourceInput = z.infer<typeof deleteSourceSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type GoFurtherInput = z.infer<typeof goFurtherSchema>;
export type CreateDigestInput = z.infer<typeof createDigestSchema>;

