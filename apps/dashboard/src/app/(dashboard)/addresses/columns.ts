import { AddressListItem } from "@/app/(dashboard)/addresses/actions";
import {
  dateCell,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import { ADDRESS_CATEGORY_LABELS, AVAILABLE_AT_LABELS } from "@/lib/labels";

/**
 * Every column the addresses overview has, declared once.
 *
 * The table builds its column selector from this list and the export writes its
 * sheet from it, which is the reason it is a plain module rather than part of
 * either: a client component cannot be read by a Server Action, and an overview
 * with two column lists grows a column on screen that quietly never reaches the
 * file.
 *
 * `value` is the plain value behind the cell, not what the cell renders — a
 * street exports as its text rather than as the link it is shown as, and a
 * category array as its labels rather than as a row of badges.
 */

export type AddressColumnKey =
  | "id"
  | "companyCode"
  | "companyName"
  | "altName"
  | "streetAndNo"
  | "postalCode"
  | "city"
  | "region"
  | "country"
  | "house"
  | "poBox"
  | "gln"
  | "peppolId"
  | "telephone"
  | "fax"
  | "email"
  | "website"
  | "billingAttention"
  | "billingAttentionAdditional"
  | "sequenceNumber"
  | "category"
  | "addressComplete"
  | "needCrane"
  | "canopyRequired"
  | "bundleSeparately"
  | "specialTransport"
  | "availableAt"
  | "unloadingStartTime"
  | "unloadingEndTime"
  | "maxLength"
  | "maxBundleWeight"
  | "loadingInstructions"
  | "createdAt"
  | "updatedAt";

export const ADDRESS_COLUMNS: Array<
  ExportColumn<AddressListItem, AddressColumnKey>
> = [
  {
    key: "id",
    label: "Code",
    defaultVisible: true,
    value: (row) => row.CompanyAddresses.id,
  },
  {
    key: "companyCode",
    label: "Company Code",
    defaultVisible: true,
    value: (row) => row.Companies?.id ?? null,
  },
  {
    key: "companyName",
    label: "Company Name",
    defaultVisible: true,
    value: (row) => textCell(row.Companies?.companyName),
  },
  {
    key: "altName",
    label: "Alt Name",
    defaultVisible: true,
    value: (row) => textCell(row.CompanyAddresses.altName),
  },
  {
    key: "streetAndNo",
    label: "Street & No.",
    defaultVisible: true,
    value: (row) => textCell(row.CompanyAddresses.streetAndNo),
  },
  {
    key: "postalCode",
    label: "Postal Code",
    defaultVisible: true,
    value: (row) => textCell(row.CompanyAddresses.postalCode),
  },
  {
    key: "city",
    label: "City",
    defaultVisible: true,
    value: (row) => textCell(row.CompanyAddresses.city),
  },
  {
    key: "region",
    label: "Region",
    defaultVisible: true,
    value: (row) => textCell(row.CompanyAddresses.region),
  },
  {
    key: "country",
    label: "Country",
    defaultVisible: true,
    value: (row) => textCell(row.CompanyAddresses.country),
  },
  {
    key: "house",
    label: "House",
    defaultVisible: false,
    value: (row) => textCell(row.CompanyAddresses.house),
  },
  {
    key: "poBox",
    label: "PO Box",
    defaultVisible: false,
    value: (row) => yesNoCell(row.CompanyAddresses.poBox),
  },
  {
    key: "gln",
    label: "GLN",
    defaultVisible: true,
    value: (row) => textCell(row.CompanyAddresses.gln),
  },
  {
    key: "peppolId",
    label: "Peppol ID",
    defaultVisible: true,
    value: (row) => textCell(row.CompanyAddresses.peppolId),
  },
  {
    key: "telephone",
    label: "Telephone",
    defaultVisible: false,
    value: (row) => textCell(row.CompanyAddresses.telephone),
  },
  {
    key: "fax",
    label: "Fax",
    defaultVisible: false,
    value: (row) => textCell(row.CompanyAddresses.fax),
  },
  {
    key: "email",
    label: "Email",
    defaultVisible: false,
    value: (row) => textCell(row.CompanyAddresses.email),
  },
  {
    key: "website",
    label: "Website",
    defaultVisible: false,
    value: (row) => textCell(row.CompanyAddresses.website),
  },
  {
    key: "billingAttention",
    label: "Billing Attention",
    defaultVisible: false,
    value: (row) => textCell(row.CompanyAddresses.billingAttention),
  },
  {
    key: "billingAttentionAdditional",
    label: "Billing Attention 2",
    defaultVisible: false,
    value: (row) => textCell(row.CompanyAddresses.billingAttentionAdditional),
  },
  {
    key: "sequenceNumber",
    label: "Sequence No.",
    defaultVisible: false,
    value: (row) => numberCell(row.CompanyAddresses.sequenceNumber),
  },
  {
    key: "category",
    label: "Category",
    defaultVisible: true,
    value: (row) =>
      textCell(
        row.CompanyAddresses.category
          .map((category) => ADDRESS_CATEGORY_LABELS[category])
          .join(", "),
      ),
  },
  {
    key: "addressComplete",
    label: "Address Complete",
    defaultVisible: true,
    value: (row) => yesNoCell(row.CompanyAddresses.addressComplete),
  },
  {
    key: "needCrane",
    label: "Need Crane",
    defaultVisible: false,
    value: (row) => yesNoCell(row.CompanyAddresses.needCrane),
  },
  {
    key: "canopyRequired",
    label: "Canopy Required",
    defaultVisible: false,
    value: (row) => yesNoCell(row.CompanyAddresses.canopyRequired),
  },
  {
    key: "bundleSeparately",
    label: "Bundle Separately",
    defaultVisible: false,
    value: (row) => yesNoCell(row.CompanyAddresses.bundleSeparately),
  },
  {
    key: "specialTransport",
    label: "Special Transport",
    defaultVisible: false,
    value: (row) => yesNoCell(row.CompanyAddresses.specialTransport),
  },
  {
    key: "availableAt",
    label: "Available At",
    defaultVisible: false,
    value: (row) => {
      const availableAt = row.CompanyAddresses.availableAt;
      return availableAt ? AVAILABLE_AT_LABELS[availableAt] : null;
    },
  },
  {
    key: "unloadingStartTime",
    label: "Unloading Start",
    defaultVisible: false,
    value: (row) => textCell(row.CompanyAddresses.unloadingStartTime),
  },
  {
    key: "unloadingEndTime",
    label: "Unloading End",
    defaultVisible: false,
    value: (row) => textCell(row.CompanyAddresses.unloadingEndTime),
  },
  {
    key: "maxLength",
    label: "Max Length (mm)",
    defaultVisible: false,
    value: (row) => numberCell(row.CompanyAddresses.maxLength),
  },
  {
    key: "maxBundleWeight",
    label: "Max Bundle Weight (kg)",
    defaultVisible: false,
    value: (row) => numberCell(row.CompanyAddresses.maxBundleWeight),
  },
  {
    key: "loadingInstructions",
    label: "Loading Instructions",
    defaultVisible: false,
    value: (row) => textCell(row.CompanyAddresses.loadingInstructions),
  },
  {
    key: "createdAt",
    label: "Created At",
    defaultVisible: false,
    value: (row) => dateCell(row.CompanyAddresses.createdAt),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    defaultVisible: false,
    value: (row) => dateCell(row.CompanyAddresses.updatedAt),
  },
];
