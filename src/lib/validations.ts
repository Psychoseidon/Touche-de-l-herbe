import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2, "Nom trop court"),
  pseudo: z
    .string()
    .min(3, "Pseudo trop court")
    .regex(/^[a-zA-Z0-9_-]+$/, "Lettres, chiffres, - et _ uniquement"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(6, "Numéro de téléphone invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  birthDate: z.string().refine((value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    const age = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return age >= 18;
  }, "Tu dois avoir 18 ans ou plus (loi SREN 2024)"),
  bio: z.string().max(280).optional(),
  photo: z.string().url("Photo de profil requise"),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
