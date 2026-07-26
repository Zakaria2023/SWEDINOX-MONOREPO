import type { CommunicationSettingFormValues } from "@/app/(dashboard)/companies/validation";
import type {
  InsertCommunicationSettings,
  SelectCommunicationSettings,
} from "@/db/schema/communication-settings";

// The communication-setting dialog edits the row's enum/contact columns —
// these two mappers convert between the dialog's value shape and the stored
// row. Like the legacy save handler, the email/fax value is only kept for its
// matching communication type; anything else is cleared to null.

export const communicationSettingRowToDialogValues = (
  row: SelectCommunicationSettings,
): CommunicationSettingFormValues => ({
  documentType: row.documentType,
  communicationType: row.communicationType,
  shape: row.shape ?? "",
  email: row.email ?? "",
  fax: row.fax ?? "",
});

export const communicationSettingValuesToColumns = (
  values: CommunicationSettingFormValues,
): Partial<InsertCommunicationSettings> => ({
  documentType:
    values.documentType as InsertCommunicationSettings["documentType"],
  communicationType:
    values.communicationType as InsertCommunicationSettings["communicationType"],
  shape: (values.shape || null) as InsertCommunicationSettings["shape"],
  email: values.communicationType === "email" ? values.email || null : null,
  fax: values.communicationType === "fax" ? values.fax || null : null,
});
