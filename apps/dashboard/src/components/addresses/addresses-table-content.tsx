"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { type AddressListItem } from "@/app/(dashboard)/addresses/actions";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";

const ALL_COLUMNS = [
  { key: "id", label: "Code", defaultVisible: true },
  { key: "companyCode", label: "Company Code", defaultVisible: true },
  { key: "companyName", label: "Company Name", defaultVisible: true },
  { key: "altName", label: "Alt Name", defaultVisible: true },
  { key: "streetAndNo", label: "Street & No", defaultVisible: true },
  { key: "postalCode", label: "Postal Code", defaultVisible: true },
  { key: "city", label: "City", defaultVisible: true },
  { key: "country", label: "Country", defaultVisible: true },
  { key: "gln", label: "GLN", defaultVisible: true },
  { key: "peopleId", label: "People ID", defaultVisible: true },
  { key: "category", label: "Category", defaultVisible: true },
  { key: "status", label: "Status", defaultVisible: true },
] as const;

type ColumnKey = (typeof ALL_COLUMNS)[number]["key"];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, column) => ({ ...acc, [column.key]: column.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type AddressesTableContentProps = {
  addresses: AddressListItem[];
};

const formatCategoryLabel = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const AddressesTableContent = ({
  addresses,
}: AddressesTableContentProps) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnsRef.current &&
        !columnsRef.current.contains(event.target as Node)
      ) {
        setColumnsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleColumns = ALL_COLUMNS.filter(
    (column) => columnVisibility[column.key],
  );

  const toggleColumn = (key: ColumnKey) => {
    setColumnVisibility((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const renderCell = (item: AddressListItem, key: ColumnKey) => {
    const addr = item.CompanyAddresses;
    const company = item.Companies;

    switch (key) {
      case "id":
        return (
          <TableCell key={key} className="font-medium">
            {addr.id}
          </TableCell>
        );
      case "companyCode":
        return <TableCell key={key}>{company?.id ?? "-"}</TableCell>;
      case "companyName":
        return <TableCell key={key}>{company?.companyName ?? "-"}</TableCell>;
      case "altName":
        return <TableCell key={key}>{addr.altName || "-"}</TableCell>;
      case "streetAndNo":
        return <TableCell key={key}>{addr.streetAndNo || "-"}</TableCell>;
      case "postalCode":
        return <TableCell key={key}>{addr.postalCode || "-"}</TableCell>;
      case "city":
        return <TableCell key={key}>{addr.city || "-"}</TableCell>;
      case "country":
        return <TableCell key={key}>{addr.country || "-"}</TableCell>;
      case "gln":
        return <TableCell key={key}>{addr.gln || "-"}</TableCell>;
      case "peopleId":
        return <TableCell key={key}>{addr.peopleId || "-"}</TableCell>;
      case "category":
        return (
          <TableCell key={key}>
            <div className="flex flex-wrap gap-1">
              {addr.category.length > 0 ? (
                addr.category.map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700"
                  >
                    {formatCategoryLabel(category)}
                  </span>
                ))
              ) : (
                <span>-</span>
              )}
            </div>
          </TableCell>
        );
      case "status":
        return (
          <TableCell key={key}>
            <span
              className={`rounded-full px-2 py-1 text-xs ${
                addr.addressComplete
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {addr.addressComplete ? "Complete" : "Incomplete"}
            </span>
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div ref={columnsRef} className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setColumnsOpen((open) => !open)}
          >
            Columns <ChevronDown className="ml-2 h-4 w-4" />
          </Button>

          {columnsOpen && (
            <div className="absolute right-0 z-10 mt-1 min-w-44 rounded-md border bg-background p-2 shadow-md">
              {ALL_COLUMNS.map((column) => (
                <label
                  key={column.key}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={columnVisibility[column.key]}
                    onChange={() => toggleColumn(column.key)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  {column.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
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
                  {visibleColumns.map((column) =>
                    renderCell(item, column.key),
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
