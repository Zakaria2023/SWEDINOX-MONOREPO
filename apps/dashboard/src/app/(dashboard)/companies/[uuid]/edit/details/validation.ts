import { companyLangs } from "@/lib/enums";
import { z } from "zod";

export const companyDetailsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  correspName: z.string().optional(),
  lang: z.union([z.enum(companyLangs), z.literal(""), z.undefined()]),
  remarks: z.string().optional(),
  searchCode1: z.string().optional(),
  searchCode2: z.string().optional(),
  searchCode3: z.string().optional(),
});

export type CompanyDetailsFormValues = z.infer<typeof companyDetailsSchema>;
