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
  | "isBillingAddress"
  | "isVisitingAddress"
  | "isCorrespondenceAddress"
  | "isDeliveryAddress"
  | "addressComplete"
  | "needCrane"
  | "canopyRequired"
  | "bundleSeparately"
  | "specialTransport"
  | "availableAt"
  | "forkliftUnloading"
  | "craneUnloading"
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
    key: "companyCode",
    label: "Code",
    defaultVisible: true,
    value: (row) => row.Companies?.id ?? null,
  },
  {
    key: "companyName",
    label: "Company name",
    defaultVisible: true,
    value: (row) => textCell(row.Companies?.companyName),
  },
  {
    key: "altName",
    label: "Alternative name",
    defaultVisible: true,
    value: (row) => textCell(row.CompanyAddresses.altName),
  },
  {
    key: "poBox",
    label: "Is PO Box",
    defaultVisible: false,
    value: (row) => yesNoCell(row.CompanyAddresses.poBox),
  },
  {
    key: "streetAndNo",
    label: "Street + No",
    defaultVisible: true,
    value: (row) => textCell(row.CompanyAddresses.streetAndNo),
  },
  {
    key: "house",
    label: "Addition",
    defaultVisible: false,
    value: (row) => textCell(row.CompanyAddresses.house),
  },
  {
    key: "postalCode",
    label: "Postal code",
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
    label: "E-mail",
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
    key: "sequenceNumber",
    label: "Sequence number",
    defaultVisible: false,
    value: (row) => numberCell(row.CompanyAddresses.sequenceNumber),
  },
  {
    key: "billingAttention",
    label: "Invoice attention1",
    defaultVisible: false,
    value: (row) => textCell(row.CompanyAddresses.billingAttention),
  },
  {
    key: "billingAttentionAdditional",
    label: "Invoice attention2",
    defaultVisible: false,
    value: (row) => textCell(row.CompanyAddresses.billingAttentionAdditional),
  },
  {
    // The reference prints this string too, and gets it wrong: on 2 913 of its
    // 4 739 rows a delivery address reads `Bezoek` a second time instead of
    // `Levering`. Its own advice is to read the flags and never parse the text,
    // so the four columns below are the truth and this one is rendered from
    // them rather than stored.
    key: "category",
    label: "Categories",
    defaultVisible: true,
    value: (row) =>
      textCell(
        row.CompanyAddresses.category
          .map((category) => ADDRESS_CATEGORY_LABELS[category])
          .join(", "),
      ),
  },
  {
    key: "unloadingStartTime",
    label: "Start time Unloading",
    defaultVisible: false,
    value: (row) => textCell(row.CompanyAddresses.unloadingStartTime),
  },
  {
    key: "unloadingEndTime",
    label: "End time Unloading",
    defaultVisible: false,
    value: (row) => textCell(row.CompanyAddresses.unloadingEndTime),
  },
  {
    key: "maxLength",
    label: "Maximum Length",
    defaultVisible: false,
    value: (row) => numberCell(row.CompanyAddresses.maxLength),
  },
  {
    key: "maxBundleWeight",
    label: "Maximum Bundle Weight",
    defaultVisible: false,
    value: (row) => numberCell(row.CompanyAddresses.maxBundleWeight),
  },
  {
    key: "needCrane",
    label: "Crane",
    defaultVisible: false,
    value: (row) => yesNoCell(row.CompanyAddresses.needCrane),
  },
  {
    key: "bundleSeparately",
    label: "Separate Bundling",
    defaultVisible: false,
    value: (row) => yesNoCell(row.CompanyAddresses.bundleSeparately),
  },
  {
    key: "addressComplete",
    label: "Address Complete",
    defaultVisible: true,
    value: (row) => yesNoCell(row.CompanyAddresses.addressComplete),
  },
  {
    key: "canopyRequired",
    label: "Canopy",
    defaultVisible: false,
    value: (row) => yesNoCell(row.CompanyAddresses.canopyRequired),
  },
  {
    // The reference carries these as two separate ticks. They are never both
    // on one row there, which is why one column holds them here — these two
    // are that one column, read the way its screen reads it.
    key: "forkliftUnloading",
    label: "Forklift Unloading",
    defaultVisible: false,
    value: (row) =>
      yesNoCell(row.CompanyAddresses.availableAt === "forklift_unloading"),
  },
  {
    key: "craneUnloading",
    label: "Crane Unloading",
    defaultVisible: false,
    value: (row) =>
      yesNoCell(row.CompanyAddresses.availableAt === "crane_unloading"),
  },
  {
    key: "loadingInstructions",
    label: "Loading instructions",
    defaultVisible: false,
    value: (row) => textCell(row.CompanyAddresses.loadingInstructions),
  },
  {
    key: "gln",
    label: "GLN",
    defaultVisible: true,
    value: (row) => textCell(row.CompanyAddresses.gln),
  },
  {
    key: "isBillingAddress",
    label: "Is Billing Address",
    defaultVisible: true,
    value: (row) =>
      yesNoCell(row.CompanyAddresses.category.includes("invoice")),
  },
  {
    key: "isVisitingAddress",
    label: "Is Visiting Address",
    defaultVisible: true,
    value: (row) => yesNoCell(row.CompanyAddresses.category.includes("visit")),
  },
  {
    key: "isCorrespondenceAddress",
    label: "Is Correspondence address",
    defaultVisible: true,
    value: (row) =>
      yesNoCell(row.CompanyAddresses.category.includes("correspondence")),
  },
  {
    key: "isDeliveryAddress",
    label: "Is Delivery Address",
    defaultVisible: true,
    value: (row) =>
      yesNoCell(row.CompanyAddresses.category.includes("delivery")),
  },
  {
    key: "id",
    label: "Address #",
    defaultVisible: true,
    value: (row) => row.CompanyAddresses.id,
  },
  {
    key: "country",
    label: "Country",
    defaultVisible: true,
    value: (row) => textCell(row.CompanyAddresses.country),
  },
  {
    key: "peppolId",
    label: "Peppol ID",
    defaultVisible: true,
    value: (row) => textCell(row.CompanyAddresses.peppolId),
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
    key: "createdAt",
    label: "Created on",
    defaultVisible: false,
    value: (row) => dateCell(row.CompanyAddresses.createdAt),
  },
  {
    key: "updatedAt",
    label: "Modified on",
    defaultVisible: false,
    value: (row) => dateCell(row.CompanyAddresses.updatedAt),
  },
];
