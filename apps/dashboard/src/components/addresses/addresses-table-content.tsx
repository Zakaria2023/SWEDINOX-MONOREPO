"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { type AddressListItem } from "@/app/(dashboard)/addresses/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";

type ColumnKey =
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

const ALL_COLUMNS: Array<{
  defaultVisible: boolean;
  key: ColumnKey;
  labelKey: string;
}> = [
  { key: "id", labelKey: "addresses-table-content.columns.id", defaultVisible: true },
  { key: "companyCode", labelKey: "addresses-table-content.columns.company-code", defaultVisible: true },
  { key: "companyName", labelKey: "addresses-table-content.columns.company-name", defaultVisible: true },
  { key: "altName", labelKey: "addresses-table-content.columns.alt-name", defaultVisible: true },
  { key: "streetAndNo", labelKey: "addresses-table-content.columns.street-and-no", defaultVisible: true },
  { key: "postalCode", labelKey: "addresses-table-content.columns.postal-code", defaultVisible: true },
  { key: "city", labelKey: "addresses-table-content.columns.city", defaultVisible: true },
  { key: "region", labelKey: "addresses-table-content.columns.region", defaultVisible: true },
  { key: "country", labelKey: "addresses-table-content.columns.country", defaultVisible: true },
  { key: "house", labelKey: "addresses-table-content.columns.house", defaultVisible: false },
  { key: "poBox", labelKey: "addresses-table-content.columns.po-box", defaultVisible: false },
  { key: "gln", labelKey: "addresses-table-content.columns.gln", defaultVisible: true },
  { key: "peppolId", labelKey: "addresses-table-content.columns.peppol-id", defaultVisible: true },
  { key: "telephone", labelKey: "addresses-table-content.columns.telephone", defaultVisible: false },
  { key: "fax", labelKey: "addresses-table-content.columns.fax", defaultVisible: false },
  { key: "email", labelKey: "addresses-table-content.columns.email", defaultVisible: false },
  { key: "website", labelKey: "addresses-table-content.columns.website", defaultVisible: false },
  { key: "billingAttention", labelKey: "addresses-table-content.columns.billing-attention", defaultVisible: false },
  {
    key: "billingAttentionAdditional",
    labelKey: "addresses-table-content.columns.billing-attention-additional",
    defaultVisible: false,
  },
  { key: "sequenceNumber", labelKey: "addresses-table-content.columns.sequence-number", defaultVisible: false },
  { key: "category", labelKey: "addresses-table-content.columns.category", defaultVisible: true },
  { key: "addressComplete", labelKey: "addresses-table-content.columns.address-complete", defaultVisible: true },
  { key: "needCrane", labelKey: "addresses-table-content.columns.need-crane", defaultVisible: false },
  { key: "canopyRequired", labelKey: "addresses-table-content.columns.canopy-required", defaultVisible: false },
  { key: "bundleSeparately", labelKey: "addresses-table-content.columns.bundle-separately", defaultVisible: false },
  { key: "specialTransport", labelKey: "addresses-table-content.columns.special-transport", defaultVisible: false },
  { key: "availableAt", labelKey: "addresses-table-content.columns.available-at", defaultVisible: false },
  { key: "unloadingStartTime", labelKey: "addresses-table-content.columns.unloading-start-time", defaultVisible: false },
  { key: "unloadingEndTime", labelKey: "addresses-table-content.columns.unloading-end-time", defaultVisible: false },
  { key: "maxLength", labelKey: "addresses-table-content.columns.max-length", defaultVisible: false },
  { key: "maxBundleWeight", labelKey: "addresses-table-content.columns.max-bundle-weight", defaultVisible: false },
  { key: "loadingInstructions", labelKey: "addresses-table-content.columns.loading-instructions", defaultVisible: false },
  { key: "createdAt", labelKey: "addresses-table-content.columns.created-at", defaultVisible: false },
  { key: "updatedAt", labelKey: "addresses-table-content.columns.updated-at", defaultVisible: false },
];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, column) => ({ ...acc, [column.key]: column.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type AddressesTableContentProps = {
  addresses: AddressListItem[];
};

export const AddressesTableContent = ({
  addresses,
}: AddressesTableContentProps) => {
  const { t } = useTranslation();
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) => {
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key as ColumnKey] }));
  };

  const visibleColumns = ALL_COLUMNS.filter((column) => columnVisibility[column.key]);
  const fallbackValue = t("common.not-available");

  const boolCell = (value: boolean | null) => (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${
        value ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {value ? t("common.yes") : t("common.no")}
    </span>
  );

  const renderCell = (item: AddressListItem, key: ColumnKey) => {
    const address = item.CompanyAddresses;
    const company = item.Companies;

    switch (key) {
      case "id":
        return <TableCell key={key} className="font-medium">{address.id}</TableCell>;
      case "companyCode":
        return <TableCell key={key}>{company?.id ?? fallbackValue}</TableCell>;
      case "companyName":
        return <TableCell key={key}>{company?.companyName ?? fallbackValue}</TableCell>;
      case "altName":
        return <TableCell key={key}>{address.altName || fallbackValue}</TableCell>;
      case "streetAndNo":
        return <TableCell key={key}>{address.streetAndNo || fallbackValue}</TableCell>;
      case "postalCode":
        return <TableCell key={key}>{address.postalCode || fallbackValue}</TableCell>;
      case "city":
        return <TableCell key={key}>{address.city || fallbackValue}</TableCell>;
      case "region":
        return <TableCell key={key}>{address.region || fallbackValue}</TableCell>;
      case "country":
        return <TableCell key={key}>{address.country || fallbackValue}</TableCell>;
      case "house":
        return <TableCell key={key}>{address.house || fallbackValue}</TableCell>;
      case "poBox":
        return <TableCell key={key}>{boolCell(address.poBox ?? false)}</TableCell>;
      case "gln":
        return <TableCell key={key}>{address.gln || fallbackValue}</TableCell>;
      case "peppolId":
        return <TableCell key={key}>{address.peppolId || fallbackValue}</TableCell>;
      case "telephone":
        return <TableCell key={key}>{address.telephone || fallbackValue}</TableCell>;
      case "fax":
        return <TableCell key={key}>{address.fax || fallbackValue}</TableCell>;
      case "email":
        return <TableCell key={key}>{address.email || fallbackValue}</TableCell>;
      case "website":
        return <TableCell key={key}>{address.website || fallbackValue}</TableCell>;
      case "billingAttention":
        return <TableCell key={key}>{address.billingAttention || fallbackValue}</TableCell>;
      case "billingAttentionAdditional":
        return (
          <TableCell key={key}>
            {address.billingAttentionAdditional || fallbackValue}
          </TableCell>
        );
      case "sequenceNumber":
        return <TableCell key={key}>{address.sequenceNumber ?? fallbackValue}</TableCell>;
      case "category":
        return (
          <TableCell key={key}>
            <div className="flex flex-wrap gap-1">
              {address.category.length > 0 ? (
                address.category.map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                  >
                    {t(`address-form.categories.${category}`)}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground">{fallbackValue}</span>
              )}
            </div>
          </TableCell>
        );
      case "addressComplete":
        return <TableCell key={key}>{boolCell(address.addressComplete ?? false)}</TableCell>;
      case "needCrane":
        return <TableCell key={key}>{boolCell(address.needCrane ?? false)}</TableCell>;
      case "canopyRequired":
        return <TableCell key={key}>{boolCell(address.canopyRequired ?? false)}</TableCell>;
      case "bundleSeparately":
        return <TableCell key={key}>{boolCell(address.bundleSeparately ?? false)}</TableCell>;
      case "specialTransport":
        return <TableCell key={key}>{boolCell(address.specialTransport ?? false)}</TableCell>;
      case "availableAt":
        return (
          <TableCell key={key}>
            {address.availableAt
              ? t(`address-form.available-at-options.${address.availableAt}`)
              : fallbackValue}
          </TableCell>
        );
      case "unloadingStartTime":
        return <TableCell key={key}>{address.unloadingStartTime || fallbackValue}</TableCell>;
      case "unloadingEndTime":
        return <TableCell key={key}>{address.unloadingEndTime || fallbackValue}</TableCell>;
      case "maxLength":
        return <TableCell key={key}>{address.maxLength ?? fallbackValue}</TableCell>;
      case "maxBundleWeight":
        return <TableCell key={key}>{address.maxBundleWeight ?? fallbackValue}</TableCell>;
      case "loadingInstructions":
        return (
          <TableCell key={key} className="max-w-48 truncate">
            {address.loadingInstructions || fallbackValue}
          </TableCell>
        );
      case "createdAt":
        return (
          <TableCell key={key}>
            {new Date(address.createdAt).toLocaleDateString()}
          </TableCell>
        );
      case "updatedAt":
        return (
          <TableCell key={key}>
            {new Date(address.updatedAt).toLocaleDateString()}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ColumnSelector
          columns={ALL_COLUMNS.map((column) => ({
            key: column.key,
            label: t(column.labelKey),
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead key={column.key}>{t(column.labelKey)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {addresses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                  {t("addresses-table-content.empty")}
                </TableCell>
              </TableRow>
            ) : (
              addresses.map((item) => (
                <TableRow key={item.CompanyAddresses.id}>
                  {visibleColumns.map((column) => renderCell(item, column.key))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
