import { AddressFormValues } from "@/app/(dashboard)/companies/validation";
import {
  InsertCompanyAddresses,
  SelectCompanyAddresses,
} from "@/db/schema/company-addresses";

// The address dialog edits every user-facing CompanyAddresses column — these
// two mappers convert between the dialog's string-based value shape and the
// stored row. Empty inputs map to null on save so clearing a field works.

// MySQL TIME columns come back as "HH:MM:SS"; the dialog's time selects use
// "HH:MM" option values, so trim the seconds when loading a row.
const toTimeValue = (value: string | null): string =>
  value ? value.slice(0, 5) : "";

export const addressRowToFormValues = (
  row: SelectCompanyAddresses,
): AddressFormValues => ({
  altName: row.altName ?? "",
  poBox: row.poBox ?? false,
  streetAndNo: row.streetAndNo ?? "",
  postalCode: row.postalCode ?? "",
  country: row.country ?? "",
  city: row.city ?? "",
  region: row.region ?? "",
  house: row.house ?? "",
  telephone: row.telephone ?? "",
  fax: row.fax ?? "",
  email: row.email ?? "",
  website: row.website ?? "",
  billingAttention: row.billingAttention ?? "",
  billingAttentionAdditional: row.billingAttentionAdditional ?? "",
  gln: row.gln ?? "",
  peppolId: row.peppolId ?? "",
  sequenceNumber: row.sequenceNumber != null ? String(row.sequenceNumber) : "",
  category: row.category ?? [],
  needCrane: row.needCrane ?? false,
  canopyRequired: row.canopyRequired ?? false,
  bundleSeparately: row.bundleSeparately ?? false,
  addressComplete: row.addressComplete ?? false,
  specialTransport: row.specialTransport ?? false,
  availableAt: row.availableAt ?? "",
  unloadingStartTime: toTimeValue(row.unloadingStartTime),
  unloadingEndTime: toTimeValue(row.unloadingEndTime),
  maxLength: row.maxLength ?? "",
  maxBundleWeight: row.maxBundleWeight ?? "",
  loadingInstructions: row.loadingInstructions ?? "",
});

export const addressValuesToColumns = (
  values: AddressFormValues,
): Partial<InsertCompanyAddresses> => ({
  altName: values.altName || null,
  poBox: values.poBox ?? false,
  streetAndNo: values.streetAndNo || null,
  postalCode: values.postalCode || null,
  country: values.country || null,
  city: values.city || null,
  region: values.region || null,
  house: values.house || null,
  telephone: values.telephone || null,
  fax: values.fax || null,
  email: values.email || null,
  website: values.website || null,
  billingAttention: values.billingAttention || null,
  billingAttentionAdditional: values.billingAttentionAdditional || null,
  gln: values.gln || null,
  peppolId: values.peppolId || null,
  sequenceNumber: values.sequenceNumber ? Number(values.sequenceNumber) : null,
  category: values.category,
  needCrane: values.needCrane ?? false,
  canopyRequired: values.canopyRequired ?? false,
  bundleSeparately: values.bundleSeparately ?? false,
  addressComplete: values.addressComplete ?? false,
  specialTransport: values.specialTransport ?? false,
  availableAt: (values.availableAt ||
    null) as InsertCompanyAddresses["availableAt"],
  unloadingStartTime: values.unloadingStartTime || null,
  unloadingEndTime: values.unloadingEndTime || null,
  maxLength: values.maxLength || null,
  maxBundleWeight: values.maxBundleWeight || null,
  loadingInstructions: values.loadingInstructions || null,
});
