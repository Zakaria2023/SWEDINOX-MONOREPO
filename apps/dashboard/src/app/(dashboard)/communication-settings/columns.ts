import { CommunicationSettingListItem } from "@/app/(dashboard)/communication-settings/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import {
  COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS,
  COMMUNICATION_SETTING_SHAPE_LABELS,
  COMMUNICATION_SETTING_TYPE_LABELS,
} from "@/lib/labels";

/**
 * Communication settings as a sheet — the reference's eleven columns, in its
 * order. The recipient is three of them: the contact chosen, that contact's
 * address, and the address typed by hand when no contact was chosen.
 */

export type CommunicationSettingColumnKey =
  | "createdAt"
  | "updatedAt"
  | "modifiedBy"
  | "companyId"
  | "companyName"
  | "documentType"
  | "communicationType"
  | "shape"
  | "contactName"
  | "contactEmail"
  | "customContact";

export const COMMUNICATION_SETTING_COLUMNS: Array<
  ExportColumn<CommunicationSettingListItem, CommunicationSettingColumnKey>
> = [
  {
    key: "createdAt",
    label: "Created on",
    defaultVisible: true,
    value: (row) => dateCell(row.createdAt),
  },
  {
    key: "updatedAt",
    label: "Adjusted on",
    defaultVisible: true,
    value: (row) => dateCell(row.updatedAt),
  },
  {
    key: "modifiedBy",
    label: "Modified by",
    defaultVisible: true,
    value: (row) => textCell(row.modifiedBy),
  },
  {
    key: "companyId",
    label: "Company code",
    defaultVisible: true,
    value: (row) => numberCell(row.companyId),
  },
  {
    key: "companyName",
    label: "Company",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "documentType",
    label: "Documenttype",
    defaultVisible: true,
    value: (row) => COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS[row.documentType],
  },
  {
    key: "communicationType",
    label: "Communication type",
    defaultVisible: true,
    value: (row) => COMMUNICATION_SETTING_TYPE_LABELS[row.communicationType],
  },
  {
    key: "shape",
    label: "Shape",
    defaultVisible: true,
    value: (row) =>
      row.shape ? COMMUNICATION_SETTING_SHAPE_LABELS[row.shape] : null,
  },
  {
    key: "contactName",
    label: "Contact name",
    defaultVisible: true,
    value: (row) => textCell(row.contactName),
  },
  {
    key: "contactEmail",
    label: "Contact email",
    defaultVisible: true,
    value: (row) => textCell(row.contactUuid ? row.contactEmail : null),
  },
  {
    key: "customContact",
    label: "Custom contact",
    defaultVisible: true,
    value: (row) => textCell(row.contactUuid ? null : row.email),
  },
];
