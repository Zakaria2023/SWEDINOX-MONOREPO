import { ContactPersonRow } from "@/lib/server/contact-persons";
import { ExportColumn, numberCell, textCell, yesNoCell } from "@/lib/excel";
import {
  contactPersonName,
  customerGroupLabel,
  salesRepresentativeLabel,
} from "@/lib/helpers";
import {
  COMPANY_CLASSIFICATION_LABELS,
  CONTACT_CATEGORY_LABELS,
  CONTACT_SALUTATION_LABELS,
} from "@/lib/labels";

/**
 * Contact persons as a sheet — the company's columns first, then the contact's,
 * which is the order the reference prints them in.
 *
 * Nothing company-level is stored on a contact: the address, the revenue, the
 * classification and the rest are read from the company the contact belongs to,
 * proved on all 2 188 of the reference's rows.
 */

export type ContactPersonColumnKey =
  | "companyId"
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
  | "accountManager"
  | "representative"
  | "customerGroup"
  | "industry"
  | "classification"
  | "creditLimit"
  | "competitors"
  | "customerRegion"
  | "targetAnnualSales"
  | "searchCode1"
  | "searchCode2"
  | "searchCode3"
  | "salutation"
  | "initials"
  | "firstName"
  | "lastName"
  | "sequenceNumber"
  | "mobile"
  | "industryName"
  | "classificationName"
  | "regionNumber"
  | "targetYearRevenue";

const categoriesLabel = (row: ContactPersonRow): string | null => {
  const categories = row.categories ?? [];
  if (categories.length === 0) {
    return null;
  }
  return categories
    .map((category) => CONTACT_CATEGORY_LABELS[category] ?? category)
    .join(", ");
};

export const CONTACT_PERSON_COLUMNS: Array<
  ExportColumn<ContactPersonRow, ContactPersonColumnKey>
> = [
  {
    key: "searchCode1",
    label: "Searchcode 1",
    defaultVisible: true,
    value: (row) => textCell(row.searchCode1),
  },
  {
    key: "companyName",
    label: "Company",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "isCustomer",
    label: "Customer",
    defaultVisible: true,
    value: (row) => yesNoCell(row.isCustomer),
  },
  {
    key: "isProspect",
    label: "Prospect",
    defaultVisible: true,
    value: (row) => yesNoCell(row.isProspect),
  },
  {
    key: "isSupplier",
    label: "Supplier",
    defaultVisible: true,
    value: (row) => yesNoCell(row.isSupplier),
  },
  {
    key: "isProcessor",
    label: "Processor",
    defaultVisible: true,
    value: (row) => yesNoCell(row.isProcessor),
  },
  {
    key: "isTransporter",
    label: "Transporter",
    defaultVisible: true,
    value: (row) => yesNoCell(row.isTransporter),
  },
  {
    key: "isAgent",
    label: "Agent",
    defaultVisible: true,
    value: (row) => yesNoCell(row.isAgent),
  },
  {
    key: "isOther",
    label: "Other",
    defaultVisible: true,
    value: (row) => yesNoCell(row.isOther),
  },
  {
    key: "visitStreetAndNo",
    label: "Visiting address",
    defaultVisible: true,
    value: (row) => textCell(row.visitStreetAndNo),
  },
  {
    key: "visitPostalCode",
    label: "Visit-postal code",
    defaultVisible: true,
    value: (row) => textCell(row.visitPostalCode),
  },
  {
    key: "visitCity",
    label: "Visit-city",
    defaultVisible: true,
    value: (row) => textCell(row.visitCity),
  },
  {
    key: "visitCountry",
    label: "Visit-country",
    defaultVisible: true,
    value: (row) => textCell(row.visitCountry),
  },
  {
    key: "visitTelephone",
    label: "Visit-telephone",
    defaultVisible: true,
    value: (row) => textCell(row.visitTelephone),
  },
  {
    key: "visitFax",
    label: "Visit-fax",
    defaultVisible: true,
    value: (row) => textCell(row.visitFax),
  },
  {
    key: "revenueLastYear",
    label: "Revenue last year",
    defaultVisible: true,
    value: (row) => numberCell(row.revenueLastYear),
  },
  {
    key: "revenueThisYear",
    label: "Revenue this year",
    defaultVisible: true,
    value: (row) => numberCell(row.revenueThisYear),
  },
  {
    key: "contactPerson",
    label: "Contact person",
    defaultVisible: true,
    value: (row) => textCell(contactPersonName(row)),
  },
  {
    key: "categories",
    label: "Contact person category(ies)",
    defaultVisible: true,
    value: (row) => textCell(categoriesLabel(row)),
  },
  {
    key: "email",
    label: "Contact person e-mail address",
    defaultVisible: true,
    value: (row) => textCell(row.email),
  },
  {
    key: "telephone",
    label: "Contact person telephone",
    defaultVisible: true,
    value: (row) => textCell(row.telephone),
  },
  {
    key: "address",
    label: "Correspondence address",
    defaultVisible: true,
    value: (row) => textCell(row.address),
  },
  {
    key: "postalCode",
    label: "Correspondence postal code",
    defaultVisible: true,
    value: (row) => textCell(row.postalCode),
  },
  {
    key: "city",
    label: "Correspondence city",
    defaultVisible: true,
    value: (row) => textCell(row.city),
  },
  {
    key: "addressCountry",
    label: "Correspondence country",
    defaultVisible: true,
    value: (row) => textCell(row.addressCountry),
  },
  {
    key: "addressTelephone",
    label: "Correspondence telephone",
    defaultVisible: true,
    value: (row) => textCell(row.addressTelephone),
  },
  {
    key: "addressFax",
    label: "Correspondence fax",
    defaultVisible: true,
    value: (row) => textCell(row.addressFax),
  },
  {
    key: "accountManager",
    label: "Account manager",
    defaultVisible: true,
    value: (row) =>
      textCell(
        row.accountManager
          ? salesRepresentativeLabel(row.accountManager)
          : null,
      ),
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
    key: "customerGroup",
    label: "Customer group",
    defaultVisible: true,
    value: (row) =>
      textCell(
        row.customerGroup ? customerGroupLabel(row.customerGroup) : null,
      ),
  },
  {
    key: "industry",
    label: "Industry code",
    defaultVisible: true,
    value: (row) => textCell(row.industry),
  },
  {
    key: "industryName",
    label: "Industry",
    defaultVisible: false,
    // The company stores a ten-character industry code and there is no list
    // of industries to name it from. Empty on every reference row too.
    value: () => null,
  },
  {
    key: "classification",
    label: "Classification code",
    defaultVisible: true,
    value: (row) => textCell(row.classification),
  },
  {
    key: "classificationName",
    label: "Classification",
    defaultVisible: true,
    value: (row) =>
      row.classification
        ? COMPANY_CLASSIFICATION_LABELS[row.classification]
        : null,
  },
  {
    key: "creditLimit",
    label: "Credit limit",
    defaultVisible: true,
    value: (row) => numberCell(row.creditLimit),
  },
  {
    key: "competitors",
    label: "Competitors",
    defaultVisible: true,
    value: (row) => textCell(row.competitors),
  },
  {
    key: "regionNumber",
    label: "Region number",
    defaultVisible: false,
    // `0` on every reference row, and nothing here numbers a region.
    value: () => null,
  },
  {
    key: "customerRegion",
    label: "Region",
    defaultVisible: true,
    value: (row) => textCell(row.customerRegion),
  },
  {
    key: "targetYearRevenue",
    label: "Target year revenue",
    defaultVisible: false,
    value: (row) => numberCell(row.targetAnnualRevenue),
  },
  {
    key: "targetAnnualSales",
    label: "Target annual sales",
    defaultVisible: true,
    value: (row) => numberCell(row.targetAnnualSales),
  },
  {
    key: "searchCode2",
    label: "Searchcode 2",
    defaultVisible: true,
    value: (row) => textCell(row.searchCode2),
  },
  {
    key: "searchCode3",
    label: "Searchcode 3",
    defaultVisible: true,
    value: (row) => textCell(row.searchCode3),
  },
  {
    key: "companyId",
    label: "Company code",
    defaultVisible: true,
    value: (row) => numberCell(row.companyId),
  },
  {
    key: "salutation",
    label: "Title",
    defaultVisible: true,
    value: (row) =>
      textCell(
        row.salutation ? CONTACT_SALUTATION_LABELS[row.salutation] : null,
      ),
  },
  {
    key: "initials",
    label: "Initials",
    defaultVisible: true,
    value: (row) => textCell(row.initials),
  },
  {
    key: "firstName",
    label: "First name",
    defaultVisible: true,
    value: (row) => textCell(row.firstName),
  },
  {
    key: "lastName",
    label: "Last name",
    defaultVisible: true,
    value: (row) => textCell(row.lastName),
  },
  {
    // Where the contact sits in the company's own list. 6 369 of the
    // reference's 6 796 are the first, 237 the second, up to a sixteenth —
    // so it is the order somebody put them in, not a code.
    key: "sequenceNumber",
    label: "Sequence number",
    defaultVisible: true,
    value: (row) => numberCell(row.sequenceNumber),
  },
  {
    // Ours alone: the reference has no mobile column on this screen.
    key: "mobile",
    label: "Mobile",
    defaultVisible: false,
    value: (row) => textCell(row.mobile),
  },
];
