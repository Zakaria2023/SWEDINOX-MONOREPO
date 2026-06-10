import { contactTypes } from "@/lib/enums";
import { z } from "zod";

export const contactSchema = z.object({
  contactType: z.enum(contactTypes).optional(),

  code: z.string().min(1, "Code is required"),
  description: z.string().min(1, "Description is required"),

  contactGroupUuid: z.string().optional(),

  quicklyChangeOrder: z.string().optional(),
  hasPriceDate: z.boolean(),
  priceDate: z.string().optional(),
  linkToNewCustomer: z.boolean(),

  searchCode1: z.string().optional(),
  searchCode2: z.string().optional(),
  searchCode3: z.string().optional(),

  websiteSorting: z.union([z.string(), z.literal(""), z.undefined()]),
  hideOnWebsite: z.boolean(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
