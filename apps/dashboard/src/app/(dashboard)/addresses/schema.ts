import { z } from "zod";
import { addressCategories, availableAtOptions } from "@/lib/enums";

export const addressSchema = z.object({
  companyUuid: z.string().min(1, "Company is required"),
  altName: z.string().optional(),
  // Booleans use z.boolean() (no .default) so z.input = z.output = boolean.
  // Defaults are set in useAddressSubmit's defaultValues instead.
  poBox: z.boolean(),

  streetAndNo: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  house: z.string().optional(),

  telephone: z.string().optional(),
  fax: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "Invalid email address",
    ),
  website: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^https?:\/\/.+/.test(v),
      "Invalid website URL",
    ),

  // Kept as string to match the text input; converted to number in useAddressSubmit
  sequenceNumber: z
    .string()
    .optional()
    .refine(
      (v) => !v || (/^\d+$/.test(v) && parseInt(v, 10) > 0),
      "Must be a positive integer",
    ),

  category: z
    .array(z.enum(addressCategories))
    .min(1, "At least one category is required"),

  needCrane: z.boolean(),
  canopyRequired: z.boolean(),
  bundleSeparately: z.boolean(),
  addressComplete: z.boolean(),
  specialTransport: z.boolean(),

  // Kept as string to match the select input; narrowed to AvailableAt in useAddressSubmit
  availableAt: z
    .string()
    .optional()
    .refine(
      (v) => !v || (availableAtOptions as readonly string[]).includes(v),
      "Invalid option",
    ),
  unloadingStartTime: z.string().optional(),
  unloadingEndTime: z.string().optional(),

  maxLength: z.string().optional(),
  maxBundleWeight: z.string().optional(),
  loadingInstructions: z.string().optional(),
});

export type AddressFormValues = z.infer<typeof addressSchema>;
