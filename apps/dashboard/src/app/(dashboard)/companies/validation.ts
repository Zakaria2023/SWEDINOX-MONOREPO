import { addressCategories, availableAtOptions } from "@/lib/enums";
import { z } from "zod";

const optionalEmail = z.union([
  z.email({ error: "Invalid email address" }),
  z.literal(""),
  z.undefined(),
]);

const optionalUrl = z.union([
  z.url({ error: "Invalid website URL" }),
  z.literal(""),
  z.undefined(),
]);

export const addressSchema = z.object({
  altName: z.string().optional(),
  poBox: z.boolean().optional(),
  streetAndNo: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  house: z.string().optional(),
  telephone: z.string().optional(),
  fax: z.string().optional(),
  email: optionalEmail,
  website: optionalUrl,
  billingAttention: z.string().optional(),
  billingAttentionAdditional: z.string().optional(),
  gln: z.union([
    z.string().max(13, "GLN must be 13 characters or less"),
    z.literal(""),
    z.undefined(),
  ]),
  peppolId: z.union([
    z
      .string()
      .regex(
        /^\d{4}:.+$/,
        "Format must be 4 digits then a colon then an identifier (e.g. 1204:identifier)",
      ),
    z.literal(""),
    z.undefined(),
  ]),
  sequenceNumber: z.string().optional(),
  category: z
    .array(z.enum(addressCategories))
    .min(1, "At least one category is required"),
  needCrane: z.boolean().optional(),
  canopyRequired: z.boolean().optional(),
  bundleSeparately: z.boolean().optional(),
  addressComplete: z.boolean().optional(),
  specialTransport: z.boolean().optional(),
  availableAt: z.union([z.enum(availableAtOptions), z.literal(""), z.undefined()]),
  unloadingStartTime: z.union([z.string(), z.literal(""), z.undefined()]),
  unloadingEndTime: z.union([z.string(), z.literal(""), z.undefined()]),
  maxLength: z.string().optional(),
  maxBundleWeight: z.string().optional(),
  loadingInstructions: z.string().optional(),
});

export const companySchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  address: addressSchema,
});

export type AddressFormValues = z.infer<typeof addressSchema>;
export type CompanyFormValues = z.infer<typeof companySchema>;
