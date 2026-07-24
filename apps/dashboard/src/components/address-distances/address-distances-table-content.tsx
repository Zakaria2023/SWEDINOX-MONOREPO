"use client";

import { AddressDistanceListItem } from "@/app/(dashboard)/address-distances/actions";
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
import { useState } from "react";

type ColumnKey =
  | "companyName"
  | "country"
  | "city"
  | "street"
  | "postalCode"
  | "km"
  | "createdAt";

const ALL_COLUMNS: Array<{
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
}> = [
  { key: "companyName", label: "Company", defaultVisible: true },
  { key: "country", label: "Country", defaultVisible: true },
  { key: "city", label: "City", defaultVisible: true },
  { key: "street", label: "Street", defaultVisible: true },
  { key: "postalCode", label: "Postal Code", defaultVisible: true },
  { key: "km", label: "Km", defaultVisible: true },
  { key: "createdAt", label: "Created At", defaultVisible: false },
];

type Props = {
  addressDistances: AddressDistanceListItem[];
};

export const AddressDistancesTable = ({ addressDistances }: Props) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);
  const fallback = "—";

  const renderCell = (row: AddressDistanceListItem, key: ColumnKey) => {
    switch (key) {
      case "companyName":
        return <TableCell key={key}>{row.companyName ?? fallback}</TableCell>;
      case "country":
        return <TableCell key={key}>{row.country ?? fallback}</TableCell>;
      case "city":
        return <TableCell key={key}>{row.city ?? fallback}</TableCell>;
      case "street":
        return <TableCell key={key}>{row.street ?? fallback}</TableCell>;
      case "postalCode":
        return <TableCell key={key}>{row.postalCode ?? fallback}</TableCell>;
      case "km":
        return <TableCell key={key}>{row.km ?? fallback}</TableCell>;
      case "createdAt":
        return (
          <TableCell key={key}>
            {new Date(row.createdAt).toLocaleDateString()}
          </TableCell>
        );
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
            {addressDistances.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center"
                >
                  No address distances found
                </TableCell>
              </TableRow>
            ) : (
              addressDistances.map((row) => (
                <TableRow key={row.id}>
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
