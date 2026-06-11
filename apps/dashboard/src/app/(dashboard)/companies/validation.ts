import type { TFunction } from "i18next";
import { z } from "zod";
import {
  addressCategories,
  availableAtOptions,
  companyLangs,
  companyRoles,
} from "@/lib/enums";

const createOptionalEmailSchema = (t: TFunction) =>
  z.union([
    z.email({ error: t("validation.invalid-email-address") }),
    z.literal(""),
    z.undefined(),
  ]);

const createOptionalUrlSchema = (t: TFunction) =>
  z.union([
    z.url({ error: t("validation.invalid-website-url") }),
    z.literal(""),
    z.undefined(),
  ]);

export const createAddressSchema = (t: TFunction) =>
  z.object({
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
    email: createOptionalEmailSchema(t),
    website: createOptionalUrlSchema(t),
    billingAttention: z.string().optional(),
    billingAttentionAdditional: z.string().optional(),
    gln: z.union([
      z.string().max(13, t("validation.gln-too-long")),
      z.literal(""),
      z.undefined(),
    ]),
    peppolId: z.union([
      z
        .string()
        .regex(/^\d{4}:.+$/, t("validation.peppol-format")),
      z.literal(""),
      z.undefined(),
    ]),
    sequenceNumber: z.string().optional(),
    category: z
      .array(z.enum(addressCategories))
      .min(1, t("validation.at-least-one-category")),
    needCrane: z.boolean().optional(),
    canopyRequired: z.boolean().optional(),
    bundleSeparately: z.boolean().optional(),
    addressComplete: z.boolean().optional(),
    specialTransport: z.boolean().optional(),
    availableAt: z.union([
      z.enum(availableAtOptions),
      z.literal(""),
      z.undefined(),
    ]),
    unloadingStartTime: z.union([z.string(), z.literal(""), z.undefined()]),
    unloadingEndTime: z.union([z.string(), z.literal(""), z.undefined()]),
    maxLength: z.string().optional(),
    maxBundleWeight: z.string().optional(),
    loadingInstructions: z.string().optional(),
  });

export const createCompanySchema = (t: TFunction) =>
  z.object({
    companyName: z.string().min(1, t("validation.company-name-required")),
    correspName: z.string().optional(),
    remarks: z.string().optional(),
    lang: z.union([z.enum(companyLangs), z.literal(""), z.undefined()]),
    roles: z.array(z.enum(companyRoles)),
    searchCode1: z.string().optional(),
    searchCode2: z.string().optional(),
    searchCode3: z.string().optional(),
    address: createAddressSchema(t),
  });

export type AddressFormValues = z.infer<ReturnType<typeof createAddressSchema>>;
export type CompanyFormValues = z.infer<ReturnType<typeof createCompanySchema>>;
