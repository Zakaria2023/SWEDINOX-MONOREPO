import {
  communicationSettingDocumentTypes,
  communicationSettingShapes,
  communicationSettingTypes,
} from "@/lib/enums";
import { z } from "zod";

export const communicationSettingSchema = z.object({
  companyUuid: z.string().min(1, "Company is required"),
  documentType: z.enum(communicationSettingDocumentTypes, {
    error: "Document type is required",
  }),
  communicationType: z.enum(communicationSettingTypes, {
    error: "Communication type is required",
  }),
  shape: z.enum(communicationSettingShapes).optional(),
  contactUuid: z.string().optional(),
  email: z.union([
    z.email({ error: "Invalid email address" }),
    z.literal(""),
    z.undefined(),
  ]),
  fax: z.string().optional(),
});

export type CommunicationSettingFormValues = z.infer<typeof communicationSettingSchema>;
