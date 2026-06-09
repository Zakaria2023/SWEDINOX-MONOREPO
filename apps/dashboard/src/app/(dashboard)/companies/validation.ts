import { z } from "zod";

export const companySchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(255, "Company name must be 255 characters or less"),
  addressId: z.string().optional(),
});

export type CompanyFormValues = z.infer<typeof companySchema>;
