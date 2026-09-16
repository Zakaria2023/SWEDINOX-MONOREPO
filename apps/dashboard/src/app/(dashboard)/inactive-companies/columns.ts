import { InactiveCompanyRow } from "@/app/(dashboard)/inactive-companies/actions";
import {
  dateCell,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import { salesRepresentativeLabel } from "@/lib/helpers";

/**
 * Inactive companies as a sheet — the reference's sixteen columns, in its
 * order. All sixteen are on the reference's own screen, so all start visible.
 */

export type InactiveCompanyColumnKey =
  | "code"
  | "company"
  | "visitingAddress"
  | "postalCode"
  | "city"
  | "country"
  | "customer"
  | "prospect"
  | "supplier"
  | "processor"
  | "transporter"
  | "agent"
  | "other"
  | "lastModifiedBy"
  | "lastModifiedAt"
  | "representative";

export const INACTIVE_COMPANY_COLUMNS: Array<
  ExportColumn<InactiveCompanyRow, InactiveCompanyColumnKey>
> = [
  {
    key: "code",
    label: "Code",
    defaultVisible: true,
    value: (row) => numberCell(row.code),
  },
  {
    key: "company",
    label: "Company",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "visitingAddress",
    label: "Visiting address",
    defaultVisible: true,
    value: (row) => textCell(row.visitingAddress),
  },
  {
    key: "postalCode",
    label: "Postal code",
    defaultVisible: true,
    value: (row) => textCell(row.postalCode),
  },
  {
    key: "city",
    label: "City",
    defaultVisible: true,
    value: (row) => textCell(row.city),
  },
  {
    key: "country",
    label: "Country",
    defaultVisible: true,
    value: (row) => textCell(row.country),
  },
  {
    key: "customer",
    label: "Customer",
    defaultVisible: true,
    value: (row) => yesNoCell(row.isCustomer),
  },
  {
    key: "prospect",
    label: "Prospect",
    defaultVisible: true,
    value: (row) => yesNoCell(row.isProspect),
  },
  {
    key: "supplier",
    label: "Supplier",
    defaultVisible: true,
    value: (row) => yesNoCell(row.isSupplier),
  },
  {
    key: "processor",
    label: "Processor",
    defaultVisible: true,
    value: (row) => yesNoCell(row.isProcessor),
  },
  {
    key: "transporter",
    label: "Transporter",
    defaultVisible: true,
    value: (row) => yesNoCell(row.isTransporter),
  },
  {
    key: "agent",
    label: "Agent",
    defaultVisible: true,
    value: (row) => yesNoCell(row.isAgent),
  },
  {
    key: "other",
    label: "Other",
    defaultVisible: true,
    value: (row) => yesNoCell(row.isOther),
  },
  {
    key: "lastModifiedBy",
    label: "Last modified by",
    defaultVisible: true,
    value: (row) => textCell(row.lastModifiedBy),
  },
  {
    key: "lastModifiedAt",
    label: "Date last modified",
    defaultVisible: true,
    value: (row) => dateCell(row.lastModifiedAt),
  },
  {
    key: "representative",
    label: "Representative",
    defaultVisible: true,
    value: (row) =>
      textCell(
        row.representative
          ? salesRepresentativeLabel(row.representative)
          : null,
      ),
  },
];
