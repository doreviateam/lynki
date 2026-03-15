import * as z from "zod";

export const SUBJECT_OPTIONS = [
  "Découvrir Dorevia",
  "Explorer un cas d'usage",
  "Demander une démo",
  "Partenariat",
  "Autre sujet",
] as const;

export type SubjectValue = (typeof SUBJECT_OPTIONS)[number];

export interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  errors?: {
    [K in keyof T]?: string[];
  };
  inputs?: T;
}

export const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  company: z.string().min(1, "L'entreprise est requise"),
  function: z.string().optional(),
  subject: z.enum(SUBJECT_OPTIONS, {
    message: "Veuillez choisir un sujet",
  }),
  message: z.string().min(1, "Le message est requis"),
});
