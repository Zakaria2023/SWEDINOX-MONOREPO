"use client";

import Link from "next/link";
import { useState } from "react";
import { CustomerProspectRow } from "@/app/(dashboard)/customers-and-prospects/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { formatDateValue, formatRevenue } from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type ColumnKey = keyof CustomerProspectRow | "contactPerson";

const ALL_COLUMNS: Array<{
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
}> = [
  { key: "searchCode3", label: "Searchcode 3", defaultVisible: true },
  { key: "companyName", label: "Company", defaultVisible: true },
  { key: "visitCity", label: "Visit-City", defaultVisible: true },
  { key: "isCustomer", label: "Customer", defaultVisible: true },
  { key: "isProspect", label: "Prospect", defaultVisible: true },
  { key: "isSupplier", label: "Supplier", defaultVisible: true },
  { key: "isProcessor", label: "Processor", defaultVisible: true },
  { key: "isTransporter", label: "Transporter", defaultVisible: true },
  { key: "isAgent", label: "Agent", defaultVisible: true },
  { key: "isOther", label: "Other", defaultVisible: true },
  { key: "visitPostalCode", label: "Visit-Postcode", defaultVisible: true },
  { key: "visitTelephone", label: "Visit-Telephone", defaultVisible: false },
  { key: "visitFax", label: "Visit-Fax", defaultVisible: false },
  { key: "representative", label: "Representative", defaultVisible: true },
  {
    key: "targetVisitsPerYear",
    label: "Target #visits / year",
    defaultVisible: true,
  },
  { key: "customerGroup", label: "Customer group", defaultVisible: true },
  { key: "cocNumber", label: "C. of C. no.", defaultVisible: true },
  { key: "creditLimit", label: "Credit limit", defaultVisible: true },
  { key: "revenueLastYear", label: "Revenue last year", defaultVisible: true },
  { key: "revenueThisYear", label: "Revenue this year", defaultVisible: true },
  { key: "competitors", label: "Competitors", defaultVisible: true },
  {
    key: "correspondenceStreetAndNo",
    label: "Correspondence Address",
    defaultVisible: true,
  },
  {
    key: "correspondencePostalCode",
    label: "Correspondence Postal code",
    defaultVisible: true,
  },
  {
    key: "correspondenceCity",
    label: "Correspondence City",
    defaultVisible: true,
  },
  {
    key: "correspondenceCountry",
    label: "Correspondence Country",
    defaultVisible: true,
  },
  {
    key: "correspondenceTelephone",
    label: "Correspondence Phone. No.",
    defaultVisible: true,
  },
  {
    key: "correspondenceFax",
    label: "Correspondence Fax No.",
    defaultVisible: true,
  },
  {
    key: "deliveryStreetAndNo",
    label: "Delivery address",
    defaultVisible: true,
  },
  {
    key: "deliveryPostalCode",
    label: "Delivery Postal code",
    defaultVisible: true,
  },
  { key: "deliveryCity", label: "Delivery City", defaultVisible: true },
  { key: "deliveryCountry", label: "Delivery Country", defaultVisible: true },
  { key: "contactPerson", label: "Contact person", defaultVisible: true },
  { key: "contactEmail", label: "Contact e-mail", defaultVisible: true },
  {
    key: "contactMobile",
    label: "Contact mobile no.",
    defaultVisible: true,
  },
  { key: "customerRegionCode", label: "Region code", defaultVisible: true },
  { key: "region", label: "Region", defaultVisible: true },
  {
    key: "accountManager",
    label: "Account manager",
    defaultVisible: true,
  },
  { key: "searchCode2", label: "Searchcode 2", defaultVisible: true },
  { key: "searchCode1", label: "Searchcode 1", defaultVisible: true },
  {
    key: "completeDelivery",
    label: "Complete delivery",
    defaultVisible: true,
  },
  { key: "companyCode", label: "Company code", defaultVisible: true },
  { key: "createdAt", label: "Customer since", defaultVisible: true },
  { key: "contactCreatedAt", label: "Created on", defaultVisible: true },
];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, col) => ({ ...acc, [col.key]: col.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type Props = { rows: CustomerProspectRow[] };

export const CustomersAndProspectsTable = ({ rows }: Props) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: CustomerProspectRow, key: ColumnKey) => {
    switch (key) {
      case "searchCode3":
        return <TableCell key={key}>{row.searchCode3 ?? "—"}</TableCell>;
      case "companyName":
        return (
          <TableCell key={key} className="font-medium">
            <Link
              href={`/companies/${row.companyUuid}`}
              className="underline-offset-4 hover:underline"
            >
              {row.companyName}
            </Link>
          </TableCell>
        );
      case "visitCity":
        return <TableCell key={key}>{row.visitCity ?? "—"}</TableCell>;
      case "isCustomer":
        return (
          <TableCell key={key} className="text-center">
            {row.isCustomer ? "✓" : ""}
          </TableCell>
        );
      case "isProspect":
        return (
          <TableCell key={key} className="text-center">
            {row.isProspect ? "✓" : ""}
          </TableCell>
        );
      case "isSupplier":
        return (
          <TableCell key={key} className="text-center">
            {row.isSupplier ? "✓" : ""}
          </TableCell>
        );
      case "isProcessor":
        return (
          <TableCell key={key} className="text-center">
            {row.isProcessor ? "✓" : ""}
          </TableCell>
        );
      case "isTransporter":
        return (
          <TableCell key={key} className="text-center">
            {row.isTransporter ? "✓" : ""}
          </TableCell>
        );
      case "isAgent":
        return (
          <TableCell key={key} className="text-center">
            {row.isAgent ? "✓" : ""}
          </TableCell>
        );
      case "isOther":
        return (
          <TableCell key={key} className="text-center">
            {row.isOther ? "✓" : ""}
          </TableCell>
        );
      case "visitPostalCode":
        return <TableCell key={key}>{row.visitPostalCode ?? "—"}</TableCell>;
      case "visitTelephone":
        return <TableCell key={key}>{row.visitTelephone ?? "—"}</TableCell>;
      case "visitFax":
        return <TableCell key={key}>{row.visitFax ?? "—"}</TableCell>;
      case "representative":
        return <TableCell key={key}>{row.representative ?? "—"}</TableCell>;
      case "targetVisitsPerYear":
        return (
          <TableCell key={key} className="text-right">
            {row.targetVisitsPerYear.toLocaleString("nl-NL", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </TableCell>
        );
      case "customerGroup":
        return <TableCell key={key}>{row.customerGroup ?? "—"}</TableCell>;
      case "cocNumber":
        return <TableCell key={key}>{row.cocNumber ?? "—"}</TableCell>;
      case "creditLimit":
        return (
          <TableCell key={key} className="text-right">
            {formatRevenue(row.creditLimit)}
          </TableCell>
        );
      case "revenueLastYear":
        return (
          <TableCell key={key} className="text-right">
            {formatRevenue(row.revenueLastYear)}
          </TableCell>
        );
      case "revenueThisYear":
        return (
          <TableCell key={key} className="text-right">
            {formatRevenue(row.revenueThisYear)}
          </TableCell>
        );
      case "competitors":
        return <TableCell key={key}>{row.competitors ?? "—"}</TableCell>;
      case "correspondenceStreetAndNo":
        return (
          <TableCell key={key}>
            {row.correspondenceStreetAndNo ?? "—"}
          </TableCell>
        );
      case "correspondencePostalCode":
        return (
          <TableCell key={key}>{row.correspondencePostalCode ?? "—"}</TableCell>
        );
      case "correspondenceCity":
        return <TableCell key={key}>{row.correspondenceCity ?? "—"}</TableCell>;
      case "correspondenceCountry":
        return (
          <TableCell key={key}>{row.correspondenceCountry ?? "—"}</TableCell>
        );
      case "correspondenceTelephone":
        return (
          <TableCell key={key}>{row.correspondenceTelephone ?? "—"}</TableCell>
        );
      case "correspondenceFax":
        return <TableCell key={key}>{row.correspondenceFax ?? "—"}</TableCell>;
      case "deliveryStreetAndNo":
        return (
          <TableCell key={key}>{row.deliveryStreetAndNo ?? "—"}</TableCell>
        );
      case "deliveryPostalCode":
        return <TableCell key={key}>{row.deliveryPostalCode ?? "—"}</TableCell>;
      case "deliveryCity":
        return <TableCell key={key}>{row.deliveryCity ?? "—"}</TableCell>;
      case "deliveryCountry":
        return <TableCell key={key}>{row.deliveryCountry ?? "—"}</TableCell>;
      case "contactPerson": {
        const parts = [row.contactFirstName, row.contactLastName].filter(
          Boolean,
        );
        return <TableCell key={key}>{parts.join(" ") || "—"}</TableCell>;
      }
      case "contactEmail":
        return <TableCell key={key}>{row.contactEmail ?? "—"}</TableCell>;
      case "contactMobile":
        return <TableCell key={key}>{row.contactMobile ?? "—"}</TableCell>;
      case "customerRegionCode":
        return <TableCell key={key}>{row.customerRegionCode ?? "—"}</TableCell>;
      case "region":
        return <TableCell key={key}>{row.region ?? "—"}</TableCell>;
      case "accountManager":
        return <TableCell key={key}>{row.accountManager ?? "—"}</TableCell>;
      case "searchCode2":
        return <TableCell key={key}>{row.searchCode2 ?? "—"}</TableCell>;
      case "searchCode1":
        return <TableCell key={key}>{row.searchCode1 ?? "—"}</TableCell>;
      case "completeDelivery":
        return (
          <TableCell key={key} className="text-center">
            {row.completeDelivery ? "✓" : ""}
          </TableCell>
        );
      case "companyCode":
        return <TableCell key={key}>{row.companyCode}</TableCell>;
      case "createdAt":
        return (
          <TableCell key={key}>{formatDateValue(row.createdAt)}</TableCell>
        );
      case "contactCreatedAt":
        return (
          <TableCell key={key}>
            {formatDateValue(row.contactCreatedAt)}
          </TableCell>
        );
      default:
        return <TableCell key={key}>—</TableCell>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-end gap-2">
        <ColumnSelector
          columns={ALL_COLUMNS.map((col) => ({
            key: col.key,
            label: col.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
        <TableExportButton
          tableId="customers-and-prospects-table"
          fileName="customers-and-prospects"
          sheetName="Customers and Prospects"
        />
      </div>

      <div>
        <Table id="customers-and-prospects-table">
          <TableHeader>
            <TableRow>
              {visibleColumns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center"
                >
                  No customers or prospects found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.companyUuid}>
                  {visibleColumns.map((col) => renderCell(row, col.key))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
