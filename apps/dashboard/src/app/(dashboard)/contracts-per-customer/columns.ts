import { ContractPerCustomerRow } from "@/app/(dashboard)/contracts/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import { customerGroupLabel, salesRepresentativeLabel } from "@/lib/helpers";
import { COMPANY_ROLE_LABELS } from "@/lib/labels";

/**
 * Contracts per customer or prospect as a sheet, in the reference's column
 * order.
 *
 * All eighteen are carried. `Preference`, `Sales` and `Revenue` are `0` and
 * `Most recent invoice date` is empty on all 173 rows — the per-link counters
 * are never maintained — and `Region number` is `0`, the seventh screen to
 * show it dead. `Sales` and `Revenue` read the contract's own counters; the
 * invoice date is the customer's latest inside the contract's dates;
 * `Preference` and `Region number` print blank.
 *
 * `End date` reads 31-12-9999 on all 173 rows: the no-end sentinel, the same
 * one the purchase side uses.
 */

export type ContractPerCustomerColumnKey =
  | "role"
  | "companyCode"
  | "companyName"
  | "city"
  | "representative"
  | "customerGroup"
  | "code"
  | "description"
  | "contractGroupName"
  | "priceDate"
  | "startingDate"
  | "endDate"
  | "region"
  | "regionNumber"
  | "preference"
  | "salesKg"
  | "revenue"
  | "mostRecentInvoiceDate";

export const CONTRACT_PER_CUSTOMER_COLUMNS: Array<
  ExportColumn<ContractPerCustomerRow, ContractPerCustomerColumnKey>
> = [
  {
    key: "role",
    label: "Company role",
    defaultVisible: true,
    value: (row) => textCell(row.role ? COMPANY_ROLE_LABELS[row.role] : null),
  },
  {
    key: "companyCode",
    label: "Company code",
    defaultVisible: true,
    value: (row) => numberCell(row.id),
  },
  {
    key: "companyName",
    label: "Company",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "city",
    label: "City",
    defaultVisible: true,
    value: (row) => textCell(row.city),
  },
  {
    key: "representative",
    label: "Representative",
    defaultVisible: true,
    value: (row) => textCell(salesRepresentativeLabel(row.representative)),
  },
  {
    key: "customerGroup",
    label: "Customer group",
    defaultVisible: true,
    value: (row) => textCell(customerGroupLabel(row.customerGroup)),
  },
  {
    key: "code",
    label: "Contract code",
    defaultVisible: true,
    value: (row) => textCell(row.code),
  },
  {
    key: "description",
    label: "Description",
    defaultVisible: true,
    value: (row) => textCell(row.description),
  },
  {
    key: "contractGroupName",
    label: "Contract group",
    defaultVisible: true,
    value: (row) => textCell(row.contractGroupName),
  },
  {
    key: "priceDate",
    label: "Price date",
    defaultVisible: true,
    value: (row) => dateCell(row.priceDate),
  },
  {
    key: "startingDate",
    label: "Starting date",
    defaultVisible: true,
    value: (row) => dateCell(row.startingDate),
  },
  {
    key: "endDate",
    label: "End date",
    defaultVisible: true,
    value: (row) => dateCell(row.endDate),
  },
  {
    key: "preference",
    label: "Preference",
    defaultVisible: false,
    // A ranking between two contracts that cover the same goods. `0` on
    // every reference row, and not modelled here.
    value: () => null,
  },
  {
    key: "salesKg",
    label: "Sales",
    defaultVisible: false,
    value: (row) => numberCell(row.salesKg),
  },
  {
    key: "revenue",
    label: "Revenue",
    defaultVisible: false,
    value: (row) => numberCell(row.revenue),
  },
  {
    key: "mostRecentInvoiceDate",
    label: "Most recent invoice date",
    defaultVisible: false,
    value: (row) => dateCell(row.mostRecentInvoiceDate),
  },
  {
    key: "regionNumber",
    label: "Region number",
    defaultVisible: false,
    // `0` on every reference row, and nothing here numbers a region.
    value: () => null,
  },
  {
    key: "region",
    label: "Region",
    defaultVisible: true,
    value: (row) => textCell(row.region),
  },
];
