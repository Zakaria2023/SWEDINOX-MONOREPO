"use client";

import { ContactPersonSupplierRow } from "@/app/(dashboard)/contact-persons-suppliers/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { ContactSalutation } from "@/lib/enums";
import { buildColumnVisibility, formatRevenue } from "@/lib/helpers";
import {
  COMMON_TEXT,
  CONTACT_CATEGORY_LABELS,
  CONTACT_SALUTATION_LABELS,
} from "@/lib/labels";
import { useState } from "react";

type ColumnKey = keyof ContactPersonSupplierRow | "contactPerson";

const ALL_COLUMNS: Array<{
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
}> = [
  { key: "revenueLastYear", label: "Revenue Last Year", defaultVisible: true },
  { key: "revenueThisYear", label: "Revenue This Year", defaultVisible: true },
  { key: "contactPerson", label: "Contact Person", defaultVisible: true },
  { key: "categories", label: "Contact Person Category", defaultVisible: true },
  { key: "email", label: "Contact Person E-mail", defaultVisible: true },
  { key: "telephone", label: "Contact Person Telephone", defaultVisible: true },
  { key: "address", label: "Correspondence Address", defaultVisible: true },
  {
    key: "postalCode",
    label: "Correspondence Postal Code",
    defaultVisible: true,
  },
  { key: "city", label: "Correspondence City", defaultVisible: true },
  {
    key: "addressCountry",
    label: "Correspondence Country",
    defaultVisible: true,
  },
  {
    key: "addressTelephone",
    label: "Correspondence Telephone",
    defaultVisible: true,
  },
  { key: "addressFax", label: "Correspondence Fax", defaultVisible: true },
  { key: "purchaser", label: "Purchaser", defaultVisible: true },
  { key: "searchCode2", label: "Searchcode 2", defaultVisible: true },
  { key: "searchCode1", label: "Searchcode 1", defaultVisible: true },
  { key: "companyId", label: "Company", defaultVisible: true },
  { key: "salutation", label: "Title", defaultVisible: true },
  { key: "initials", label: "Initials", defaultVisible: true },
  { key: "firstName", label: "First Name", defaultVisible: true },
  { key: "lastName", label: "Last Name", defaultVisible: true },
  { key: "searchCode3", label: "Searchcode 3", defaultVisible: true },
  { key: "companyName", label: "Company Name", defaultVisible: true },
  { key: "isCustomer", label: "Customer", defaultVisible: true },
  { key: "isProspect", label: "Prospect", defaultVisible: true },
  { key: "isSupplier", label: "Supplier", defaultVisible: true },
  { key: "isProcessor", label: "Processor", defaultVisible: true },
  { key: "isTransporter", label: "Transporter", defaultVisible: true },
  { key: "isAgent", label: "Agent", defaultVisible: true },
  { key: "isOther", label: "Other", defaultVisible: true },
  { key: "visitStreetAndNo", label: "Visiting Address", defaultVisible: true },
  { key: "visitPostalCode", label: "Visit-Postal Code", defaultVisible: true },
  { key: "visitCity", label: "Visit-City", defaultVisible: true },
  { key: "visitCountry", label: "Visit-Country", defaultVisible: true },
  { key: "visitTelephone", label: "Visit-Telephone", defaultVisible: true },
  { key: "visitFax", label: "Visit-Fax", defaultVisible: true },
  { key: "mobile", label: "Mobile", defaultVisible: false },
];

type Props = { rows: ContactPersonSupplierRow[] };


export const ContactPersonsSuppliersTable = ({ rows }: Props) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);
  const na = COMMON_TEXT.notAvailable;

  const renderCell = (row: ContactPersonSupplierRow, key: ColumnKey) => {
    switch (key) {
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
      case "contactPerson": {
        const parts = [
          row.salutation
            ? (CONTACT_SALUTATION_LABELS[row.salutation as ContactSalutation] ??
              row.salutation)
            : null,
          row.firstName,
          row.lastName,
        ].filter(Boolean);
        return <TableCell key={key}>{parts.join(" ") || na}</TableCell>;
      }
      case "categories":
        return (
          <TableCell key={key}>
            {(row.categories as string[]).length > 0
              ? (row.categories as string[])
                  .map(
                    (c) =>
                      CONTACT_CATEGORY_LABELS[
                        c as keyof typeof CONTACT_CATEGORY_LABELS
                      ] ?? c,
                  )
                  .join(", ")
              : na}
          </TableCell>
        );
      case "email":
        return <TableCell key={key}>{row.email ?? na}</TableCell>;
      case "telephone":
        return <TableCell key={key}>{row.telephone ?? na}</TableCell>;
      case "mobile":
        return <TableCell key={key}>{row.mobile ?? na}</TableCell>;
      case "address":
        return <TableCell key={key}>{row.address ?? na}</TableCell>;
      case "postalCode":
        return <TableCell key={key}>{row.postalCode ?? na}</TableCell>;
      case "city":
        return <TableCell key={key}>{row.city ?? na}</TableCell>;
      case "addressCountry":
        return <TableCell key={key}>{row.addressCountry ?? na}</TableCell>;
      case "addressTelephone":
        return <TableCell key={key}>{row.addressTelephone ?? na}</TableCell>;
      case "addressFax":
        return <TableCell key={key}>{row.addressFax ?? na}</TableCell>;
      case "purchaser":
        return <TableCell key={key}>{row.purchaser ?? na}</TableCell>;
      case "searchCode1":
        return <TableCell key={key}>{row.searchCode1 ?? na}</TableCell>;
      case "searchCode2":
        return <TableCell key={key}>{row.searchCode2 ?? na}</TableCell>;
      case "searchCode3":
        return <TableCell key={key}>{row.searchCode3 ?? na}</TableCell>;
      case "companyId":
        return <TableCell key={key}>{row.companyId}</TableCell>;
      case "companyName":
        return (
          <TableCell key={key} className="font-medium">
            {row.companyName}
          </TableCell>
        );
      case "salutation":
        return (
          <TableCell key={key}>
            {row.salutation
              ? (CONTACT_SALUTATION_LABELS[
                  row.salutation as ContactSalutation
                ] ?? row.salutation)
              : na}
          </TableCell>
        );
      case "initials":
        return <TableCell key={key}>{row.initials ?? na}</TableCell>;
      case "firstName":
        return <TableCell key={key}>{row.firstName ?? na}</TableCell>;
      case "lastName":
        return <TableCell key={key}>{row.lastName ?? na}</TableCell>;
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
      case "visitStreetAndNo":
        return <TableCell key={key}>{row.visitStreetAndNo ?? na}</TableCell>;
      case "visitPostalCode":
        return <TableCell key={key}>{row.visitPostalCode ?? na}</TableCell>;
      case "visitCity":
        return <TableCell key={key}>{row.visitCity ?? na}</TableCell>;
      case "visitCountry":
        return <TableCell key={key}>{row.visitCountry ?? na}</TableCell>;
      case "visitTelephone":
        return <TableCell key={key}>{row.visitTelephone ?? na}</TableCell>;
      case "visitFax":
        return <TableCell key={key}>{row.visitFax ?? na}</TableCell>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ColumnSelector
          columns={ALL_COLUMNS.map((col) => ({
            key: col.key,
            label: col.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
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
                  No contact persons found for suppliers.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.uuid}>
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
