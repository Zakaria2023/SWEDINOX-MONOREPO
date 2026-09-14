import { ContactDialogValues } from "@/app/(dashboard)/companies/validation";
import { InsertContacts, SelectContacts } from "@/db/schema/contacts";
import { ContactCategory } from "@/lib/enums";

// The contact dialog edits the contact's own columns — these two mappers convert
// between the form and the stored row. Company-level values are not stored on
// a contact at all; they are joined from the company.

export const contactRowToDialogValues = (
  row: SelectContacts,
): ContactDialogValues => ({
  salutation: row.salutation ?? undefined,
  firstName: row.firstName ?? "",
  initials: row.initials ?? "",
  lastName: row.lastName ?? "",
  telephone: row.telephone ?? "",
  mobile: row.mobile ?? "",
  fax: row.fax ?? "",
  email: row.email ?? "",
  address: row.address ?? "",
  categoryAddition: row.categoryAddition ?? "",
  btwNumber: row.btwNumber ?? "",
  country: row.country ?? "",
  postal: row.postal ?? "",
  house: row.house ?? "",
  poBox: row.poBox,
  streetAndNo: row.streetAndNo ?? "",
  annex: row.annex ?? "",
  postalCode: row.postalCode ?? "",
  city: row.city ?? "",
  region: row.region ?? "",
  addressCountry: row.addressCountry ?? "",
  addressTelephone: row.addressTelephone ?? "",
  addressFax: row.addressFax ?? "",
  addressEmail: row.addressEmail ?? "",
  website: row.website ?? "",
  categories: row.categories,
  sequenceNumber: row.sequenceNumber,
});

export const contactValuesToColumns = (
  values: ContactDialogValues,
): Partial<InsertContacts> => ({
  salutation: (values.salutation || null) as InsertContacts["salutation"],
  firstName: values.firstName || null,
  initials: values.initials || null,
  lastName: values.lastName || null,
  telephone: values.telephone || null,
  mobile: values.mobile || null,
  fax: values.fax || null,
  email: values.email || null,
  address: values.address || null,
  categoryAddition: values.categoryAddition || null,
  btwNumber: values.btwNumber || null,
  country: values.country || null,
  postal: values.postal || null,
  house: values.house || null,
  poBox: values.poBox,
  streetAndNo: values.streetAndNo || null,
  annex: values.annex || null,
  postalCode: values.postalCode || null,
  city: values.city || null,
  region: values.region || null,
  addressCountry: values.addressCountry || null,
  addressTelephone: values.addressTelephone || null,
  addressFax: values.addressFax || null,
  addressEmail: values.addressEmail || null,
  website: values.website || null,
  categories: values.categories as ContactCategory[],
  sequenceNumber: values.sequenceNumber,
});
