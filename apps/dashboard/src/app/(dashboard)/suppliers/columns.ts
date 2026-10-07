import type { SupplierRow } from "@/app/(dashboard)/suppliers/actions";
import {
  ExportCellValue,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import {
  INVOICE_PAYMENT_TERM_CODES,
  INVOICE_PAYMENT_TERM_LABELS,
} from "@/lib/labels";

/**
 * `Suppliers` — all 29 columns of the reference's export (1 108 suppliers,
 * exports/supplier.tsv), in its own order.
 *
 * Reasoned rather than captured: `Purchaser` is the purchaser on the
 * supplier's most recent purchase order (no company-level purchaser exists
 * here), `w. cert` is the company's certificate flag, and `certificate` — blank
 * on all 1 108 — reads blank.
 */

export type SupplierColumnKey =
  | "searchCode3"
  | "companyName"
  | "isSupplier"
  | "isProcessor"
  | "isTransporter"
  | "isAgent"
  | "isOther"
  | "isCustomer"
  | "isProspect"
  | "visitCity"
  | "purchaser"
  | "paymentTermsCode"
  | "paymentTerms"
  | "creditorNumber"
  | "correspondenceAddress"
  | "correspondencePostalCode"
  | "correspondenceCity"
  | "correspondenceCountry"
  | "correspondenceTelephone"
  | "correspondenceFax"
  | "contactPerson"
  | "contactEmail"
  | "contactMobile"
  | "withCertificate"
  | "certificate"
  | "searchCode2"
  | "searchCode1"
  | "companyCode"
  | "printConsignment";

type Column = ExportColumn<SupplierRow, SupplierColumnKey>;

const column = (
  key: SupplierColumnKey,
  label: string,
  defaultVisible: boolean,
  value: (row: SupplierRow) => ExportCellValue,
): Column => ({ key, label, defaultVisible, value });

export const SUPPLIER_COLUMNS: Column[] = [
  column("searchCode3", "Searchcode 3", true, (row) => textCell(row.searchCode3)),
  column("companyName", "Company", true, (row) => textCell(row.companyName)),
  column("isSupplier", "Supplier", true, (row) => yesNoCell(row.isSupplier)),
  column("isProcessor", "Processor", true, (row) => yesNoCell(row.isProcessor)),
  column("isTransporter", "Transporter", true, (row) =>
    yesNoCell(row.isTransporter),
  ),
  column("isAgent", "Agent", false, (row) => yesNoCell(row.isAgent)),
  column("isOther", "Other", false, (row) => yesNoCell(row.isOther)),
  column("isCustomer", "Customer", true, (row) => yesNoCell(row.isCustomer)),
  column("isProspect", "Prospect", false, (row) => yesNoCell(row.isProspect)),
  column("visitCity", "Visit-City", true, (row) => textCell(row.visitCity)),
  column("purchaser", "Purchaser", true, (row) => textCell(row.purchaserName)),
  column("paymentTermsCode", "Payment terms (Code)", false, (row) =>
    row.paymentTerms ? textCell(INVOICE_PAYMENT_TERM_CODES[row.paymentTerms]) : null,
  ),
  column("paymentTerms", "Payment terms (Description)", true, (row) =>
    row.paymentTerms ? INVOICE_PAYMENT_TERM_LABELS[row.paymentTerms] : null,
  ),
  column("creditorNumber", "Creditor number", false, (row) =>
    textCell(row.creditorNumber),
  ),
  column("correspondenceAddress", "Correspondence Address", false, (row) =>
    textCell(row.correspondenceStreetAndNo),
  ),
  column("correspondencePostalCode", "Correspondence Postal code", false, (row) =>
    textCell(row.correspondencePostalCode),
  ),
  column("correspondenceCity", "Correspondence City", false, (row) =>
    textCell(row.correspondenceCity),
  ),
  column("correspondenceCountry", "Correspondence Country", false, (row) =>
    textCell(row.correspondenceCountry),
  ),
  column("correspondenceTelephone", "Correspondence Telephone", true, (row) =>
    textCell(row.correspondenceTelephone),
  ),
  column("correspondenceFax", "Correspondence Fax", false, (row) =>
    textCell(row.correspondenceFax),
  ),
  column("contactPerson", "Contact person", true, (row) =>
    textCell(
      [row.contactFirstName, row.contactLastName].filter(Boolean).join(" "),
    ),
  ),
  column("contactEmail", "Contact e-mail", true, (row) => textCell(row.contactEmail)),
  column("contactMobile", "Contact mobile no.", false, (row) =>
    textCell(row.contactMobile),
  ),
  column("withCertificate", "w. cert", false, (row) =>
    yesNoCell(row.requiresCertificate),
  ),
  column("certificate", "certificate", false, () => null),
  column("searchCode2", "Searchcode 2", false, (row) => textCell(row.searchCode2)),
  column("searchCode1", "Searchcode 1", false, (row) => textCell(row.searchCode1)),
  column("companyCode", "Company code", true, (row) => numberCell(row.companyCode)),
  column("printConsignment", "Print consignment", false, (row) =>
    yesNoCell(row.printConsignment),
  ),
];
