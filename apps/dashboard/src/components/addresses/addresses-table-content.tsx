"use client";

import Link from "next/link";
import { AddressListItem } from "@/app/(dashboard)/addresses/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { buildColumnVisibility } from "@/lib/helpers";
import { ADDRESS_CATEGORY_LABELS, AVAILABLE_AT_LABELS } from "@/lib/labels";
import { useState } from "react";

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
  label: string;
}> = [
  { key: "id", label: "Code", defaultVisible: true },
  { key: "companyCode", label: "Company Code", defaultVisible: true },
  { key: "companyName", label: "Company Name", defaultVisible: true },
  { key: "altName", label: "Alt Name", defaultVisible: true },
  { key: "streetAndNo", label: "Street & No.", defaultVisible: true },
  { key: "postalCode", label: "Postal Code", defaultVisible: true },
  { key: "city", label: "City", defaultVisible: true },
  { key: "region", label: "Region", defaultVisible: true },
  { key: "country", label: "Country", defaultVisible: true },
  { key: "house", label: "House", defaultVisible: false },
  { key: "poBox", label: "PO Box", defaultVisible: false },
  { key: "gln", label: "GLN", defaultVisible: true },
  { key: "peppolId", label: "Peppol ID", defaultVisible: true },
  { key: "telephone", label: "Telephone", defaultVisible: false },
  { key: "fax", label: "Fax", defaultVisible: false },
  { key: "email", label: "Email", defaultVisible: false },
  { key: "website", label: "Website", defaultVisible: false },
  {
    key: "billingAttention",
    label: "Billing Attention",
    defaultVisible: false,
  },
  {
    key: "billingAttentionAdditional",
    label: "Billing Attention 2",
    defaultVisible: false,
  },
  { key: "sequenceNumber", label: "Sequence No.", defaultVisible: false },
  { key: "category", label: "Category", defaultVisible: true },
  { key: "addressComplete", label: "Address Complete", defaultVisible: true },
  { key: "needCrane", label: "Need Crane", defaultVisible: false },
  { key: "canopyRequired", label: "Canopy Required", defaultVisible: false },
  {
    key: "bundleSeparately",
    label: "Bundle Separately",
    defaultVisible: false,
  },
  {
    key: "specialTransport",
    label: "Special Transport",
    defaultVisible: false,
  },
  { key: "availableAt", label: "Available At", defaultVisible: false },
  {
    key: "unloadingStartTime",
    label: "Unloading Start",
    defaultVisible: false,
  },
  { key: "unloadingEndTime", label: "Unloading End", defaultVisible: false },
  { key: "maxLength", label: "Max Length (mm)", defaultVisible: false },
  {
    key: "maxBundleWeight",
    label: "Max Bundle Weight (kg)",
    defaultVisible: false,
  },
  {
    key: "loadingInstructions",
    label: "Loading Instructions",
    defaultVisible: false,
  },
  { key: "createdAt", label: "Created At", defaultVisible: false },
  { key: "updatedAt", label: "Updated At", defaultVisible: false },
];

type AddressesTableContentProps = {
  addresses: AddressListItem[];
};

export const AddressesTable = ({
  addresses,
}: AddressesTableContentProps) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));
  };

  const visibleColumns = ALL_COLUMNS.filter(
    (column) => columnVisibility[column.key],
  );
  const fallbackValue = "—";

  const boolCell = (value: boolean | null) => (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${
        value ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {value ? "Yes" : "No"}
    </span>
  );

  const renderCell = (item: AddressListItem, key: ColumnKey) => {
    const address = item.CompanyAddresses;
    const company = item.Companies;

    switch (key) {
      case "id":
        return (
          <TableCell key={key} className="font-medium">
            {address.id}
          </TableCell>
        );
      case "companyCode":
        return <TableCell key={key}>{company?.id ?? fallbackValue}</TableCell>;
      case "companyName":
        return (
          <TableCell key={key}>
            {company?.companyName ?? fallbackValue}
          </TableCell>
        );
      case "altName":
        return (
          <TableCell key={key}>{address.altName || fallbackValue}</TableCell>
        );
      case "streetAndNo":
        return (
          <TableCell key={key} className="font-medium">
            <Link
              href={`/addresses/${address.uuid}`}
              className="text-primary hover:underline"
            >
              {address.streetAndNo || fallbackValue}
            </Link>
          </TableCell>
        );
      case "postalCode":
        return (
          <TableCell key={key}>{address.postalCode || fallbackValue}</TableCell>
        );
      case "city":
        return <TableCell key={key}>{address.city || fallbackValue}</TableCell>;
      case "region":
        return (
          <TableCell key={key}>{address.region || fallbackValue}</TableCell>
        );
      case "country":
        return (
          <TableCell key={key}>{address.country || fallbackValue}</TableCell>
        );
      case "house":
        return (
          <TableCell key={key}>{address.house || fallbackValue}</TableCell>
        );
      case "poBox":
        return (
          <TableCell key={key}>{boolCell(address.poBox ?? false)}</TableCell>
        );
      case "gln":
        return <TableCell key={key}>{address.gln || fallbackValue}</TableCell>;
      case "peppolId":
        return (
          <TableCell key={key}>{address.peppolId || fallbackValue}</TableCell>
        );
      case "telephone":
        return (
          <TableCell key={key}>{address.telephone || fallbackValue}</TableCell>
        );
      case "fax":
        return <TableCell key={key}>{address.fax || fallbackValue}</TableCell>;
      case "email":
        return (
          <TableCell key={key}>{address.email || fallbackValue}</TableCell>
        );
      case "website":
        return (
          <TableCell key={key}>{address.website || fallbackValue}</TableCell>
        );
      case "billingAttention":
        return (
          <TableCell key={key}>
            {address.billingAttention || fallbackValue}
          </TableCell>
        );
      case "billingAttentionAdditional":
        return (
          <TableCell key={key}>
            {address.billingAttentionAdditional || fallbackValue}
          </TableCell>
        );
      case "sequenceNumber":
        return (
          <TableCell key={key}>
            {address.sequenceNumber ?? fallbackValue}
          </TableCell>
        );
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
                    {ADDRESS_CATEGORY_LABELS[category]}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground">{fallbackValue}</span>
              )}
            </div>
          </TableCell>
        );
      case "addressComplete":
        return (
          <TableCell key={key}>
            {boolCell(address.addressComplete ?? false)}
          </TableCell>
        );
      case "needCrane":
        return (
          <TableCell key={key}>
            {boolCell(address.needCrane ?? false)}
          </TableCell>
        );
      case "canopyRequired":
        return (
          <TableCell key={key}>
            {boolCell(address.canopyRequired ?? false)}
          </TableCell>
        );
      case "bundleSeparately":
        return (
          <TableCell key={key}>
            {boolCell(address.bundleSeparately ?? false)}
          </TableCell>
        );
      case "specialTransport":
        return (
          <TableCell key={key}>
            {boolCell(address.specialTransport ?? false)}
          </TableCell>
        );
      case "availableAt":
        return (
          <TableCell key={key}>
            {address.availableAt
              ? AVAILABLE_AT_LABELS[address.availableAt]
              : fallbackValue}
          </TableCell>
        );
      case "unloadingStartTime":
        return (
          <TableCell key={key}>
            {address.unloadingStartTime || fallbackValue}
          </TableCell>
        );
      case "unloadingEndTime":
        return (
          <TableCell key={key}>
            {address.unloadingEndTime || fallbackValue}
          </TableCell>
        );
      case "maxLength":
        return (
          <TableCell key={key}>{address.maxLength ?? fallbackValue}</TableCell>
        );
      case "maxBundleWeight":
        return (
          <TableCell key={key}>
            {address.maxBundleWeight ?? fallbackValue}
          </TableCell>
        );
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
            label: column.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
      </div>

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {addresses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center"
                >
                  No addresses found
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
