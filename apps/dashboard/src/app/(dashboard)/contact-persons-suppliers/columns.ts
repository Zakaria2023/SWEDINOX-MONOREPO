import type { ContactPersonSupplierRow } from "@/app/(dashboard)/contact-persons-suppliers/actions";
import {
  CONTACT_PERSON_COLUMNS,
  ContactPersonColumnKey,
} from "@/app/(dashboard)/contact-persons-customers-and-prospects/columns";
import { ExportColumn, textCell } from "@/lib/excel";

/**
 * Contact persons (suppliers) — all 35 columns of the reference's export
 * (2 006 rows), in its order. The columns are the customer list's, read the
 * same way from the company; only the order differs, and `Purchaser` takes the
 * place the account manager has there.
 *
 * `Purchaser` is reasoned rather than captured: no company-level purchaser
 * exists here, so it is the purchaser on the supplier's latest purchase order —
 * the same rule the Suppliers overview uses.
 */

export type ContactPersonSupplierColumnKey =
  | Extract<
      ContactPersonColumnKey,
      | "searchCode3"
      | "companyName"
      | "isCustomer"
      | "isProspect"
      | "isSupplier"
      | "isProcessor"
      | "isTransporter"
      | "isAgent"
      | "isOther"
      | "visitStreetAndNo"
      | "visitPostalCode"
      | "visitCity"
      | "visitCountry"
      | "visitTelephone"
      | "visitFax"
      | "revenueLastYear"
      | "revenueThisYear"
      | "contactPerson"
      | "categories"
      | "email"
      | "telephone"
      | "address"
      | "postalCode"
      | "city"
      | "addressCountry"
      | "addressTelephone"
      | "addressFax"
      | "searchCode2"
      | "searchCode1"
      | "companyId"
      | "salutation"
      | "initials"
      | "firstName"
      | "lastName"
      | "mobile"
    >
  | "purchaser";

type Column = ExportColumn<
  ContactPersonSupplierRow,
  ContactPersonSupplierColumnKey
>;

const ORDER: ContactPersonSupplierColumnKey[] = [
  "searchCode3",
  "companyName",
  "isCustomer",
  "isProspect",
  "isSupplier",
  "isProcessor",
  "isTransporter",
  "isAgent",
  "isOther",
  "visitStreetAndNo",
  "visitPostalCode",
  "visitCity",
  "visitCountry",
  "visitTelephone",
  "visitFax",
  "revenueLastYear",
  "revenueThisYear",
  "contactPerson",
  "categories",
  "email",
  "telephone",
  "address",
  "postalCode",
  "city",
  "addressCountry",
  "addressTelephone",
  "addressFax",
  "purchaser",
  "searchCode2",
  "searchCode1",
  "companyId",
  "salutation",
  "initials",
  "firstName",
  "lastName",
  "mobile",
];

const PURCHASER: Column = {
  key: "purchaser",
  label: "Purchaser",
  defaultVisible: true,
  value: (row) => textCell(row.purchaserName),
};

const shared = (key: ContactPersonSupplierColumnKey): Column[] =>
  CONTACT_PERSON_COLUMNS.filter((column) => column.key === key).map(
    (column): Column => ({
      key,
      label: column.label,
      defaultVisible: column.defaultVisible,
      value: column.value,
    }),
  );

export const CONTACT_PERSON_SUPPLIER_COLUMNS: Column[] = ORDER.flatMap((key) =>
  key === "purchaser" ? [PURCHASER] : shared(key),
);
