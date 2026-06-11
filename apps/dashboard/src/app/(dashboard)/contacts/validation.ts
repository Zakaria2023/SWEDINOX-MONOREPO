import type { TFunction } from "i18next";
import { z } from "zod";
import { contactTypes } from "@/lib/enums";

export const createContactSchema = (t: TFunction) =>
  z.object({
    contactType: z.enum(contactTypes).optional(),
    description: z.string().min(1, t("validation.description-required")),
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

export type ContactFormValues = z.infer<ReturnType<typeof createContactSchema>>;
