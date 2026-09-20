import { RemarkPerCompanyRow } from "@/app/(dashboard)/remarks-per-company/actions";
import { ExportColumn, numberCell, textCell } from "@/lib/excel";
import {
  representativeInitials,
  salesRepresentativeLabel,
} from "@/lib/helpers";

/**
 * Remarks per company as a sheet.
 *
 * The reference prints this as a Report rather than a grid — Excel gets one
 * column and the pairs have to be rebuilt — so these columns are the shape the
 * report's own lines carry (`Klant no.`, `Customer`, `City`, `Representative`,
 * `Initials`, then the remark underneath), not a column list copied off a
 * screen.
 */

export type RemarkPerCompanyColumnKey =
  | "companyCode"
  | "customer"
  | "city"
  | "representative"
  | "initials"
  | "remarks";

export const REMARK_PER_COMPANY_COLUMNS: Array<
  ExportColumn<RemarkPerCompanyRow, RemarkPerCompanyColumnKey>
> = [
  {
    key: "companyCode",
    label: "Customer no.",
    defaultVisible: true,
    value: (row) => numberCell(row.companyCode),
  },
  {
    key: "customer",
    label: "Customer",
    defaultVisible: true,
    value: (row) => textCell(row.customer),
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
    value: (row) =>
      textCell(
        row.representative
          ? salesRepresentativeLabel(row.representative)
          : null,
      ),
  },
  {
    key: "initials",
    label: "Initials",
    defaultVisible: true,
    value: (row) => textCell(representativeInitials(row.representative)),
  },
  {
    key: "remarks",
    label: "Remarks",
    defaultVisible: true,
    value: (row) => textCell(row.remarks),
  },
];
