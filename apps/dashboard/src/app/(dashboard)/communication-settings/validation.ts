import type { TFunction } from "i18next";
import { z } from "zod";
import {
  communicationSettingDocumentTypes,
  communicationSettingShapes,
  communicationSettingTypes,
} from "@/lib/enums";

export const createCommunicationSettingSchema = (t: TFunction) =>
  z.object({
    companyUuid: z.string().min(1, t("validation.company-required")),
    documentType: z.enum(communicationSettingDocumentTypes, {
      error: t("validation.document-type-required"),
    }),
    communicationType: z.enum(communicationSettingTypes, {
      error: t("validation.communication-type-required"),
    }),
    shape: z.enum(communicationSettingShapes).optional(),
    contactUuid: z.string().optional(),
    email: z.union([
      z.email({ error: t("validation.invalid-email-address") }),
      z.literal(""),
      z.undefined(),
    ]),
    fax: z.string().optional(),
  });

export type CommunicationSettingFormValues = z.infer<
  ReturnType<typeof createCommunicationSettingSchema>
>;
