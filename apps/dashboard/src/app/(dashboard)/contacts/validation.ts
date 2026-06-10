import { contactSalutations } from "@/lib/enums";
import { z } from "zod";

export const contactSchema = z.object({
  // Identity
  salutation: z.union([z.enum(contactSalutations), z.literal(""), z.undefined()]),
  title: z.string().optional(),
  name: z.string().optional(),
  initials: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().min(1, "Full name is required"),

  // Contact info
  telephone: z.string().optional(),
  mobile: z.string().optional(),
  fax: z.string().optional(),
  email: z.union([
    z.email({ error: "Invalid email address" }),
    z.literal(""),
    z.undefined(),
  ]),
  website: z.union([
    z.url({ error: "Invalid website URL" }),
    z.literal(""),
    z.undefined(),
  ]),

  // Business — keep as string; submit handler calls Number()
  btwNumber: z.string().optional(),
  categoryAddition: z.string().optional(),
  sequenceNumber: z.union([z.string(), z.literal(""), z.undefined()]),

  // Linked records
  addressUuid: z.string().optional(),
  locationUuid: z.string().optional(),

  // Standalone address
  streetAndNumber: z.string().optional(),
  house: z.string().optional(),
  poBox: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  annex: z.string().optional(),
  alternativeName: z.string().optional(),

  // Other — no .default(); defaults live in useForm's defaultValues
  isActive: z.boolean(),
  notes: z.string().optional(),

  // Category links — no .default(); defaultValues provides []
  categoryUuids: z.array(z.string()),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
