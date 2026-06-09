"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Pencil } from "lucide-react";
import { type AddressListItem } from "@/app/(dashboard)/addresses/actions";
import { DeleteAddressButton } from "@/components/addresses/delete-address-button";
import { Button, buttonVariants } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { cn } from "@/lib/helpers";

const ALL_COLUMNS = [
  { key: "id", label: "Code", defaultVisible: true },
  { key: "companyCode", label: "Company Code", defaultVisible: true },
  { key: "companyName", label: "Company Name", defaultVisible: true },
  { key: "altName", label: "Alt Name", defaultVisible: true },
  { key: "streetAndNo", label: "Street & No", defaultVisible: true },
  { key: "postalCode", label: "Postal Code", defaultVisible: true },
  { key: "city", label: "City", defaultVisible: true },
  { key: "country", label: "Country", defaultVisible: true },
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

const formatAddressLabel = (address: AddressListItem) =>
  address.altName || address.streetAndNo || `${address.id}`;

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

  const visibleColumns = ALL_COLUMNS.filter((column) => columnVisibility[column.key]);

  const toggleColumn = (key: ColumnKey) => {
    setColumnVisibility((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const renderCell = (address: AddressListItem, key: ColumnKey) => {
    switch (key) {
      case "id":
        return (
          <TableCell key={key} className="font-medium">
            {address.id}
          </TableCell>
        );
      case "companyCode":
        return <TableCell key={key}>{address.companyCode ?? "-"}</TableCell>;
      case "companyName":
        return <TableCell key={key}>{address.companyName ?? "-"}</TableCell>;
      case "altName":
        return <TableCell key={key}>{address.altName || "-"}</TableCell>;
      case "streetAndNo":
        return <TableCell key={key}>{address.streetAndNo || "-"}</TableCell>;
      case "postalCode":
        return <TableCell key={key}>{address.postalCode || "-"}</TableCell>;
      case "city":
        return <TableCell key={key}>{address.city || "-"}</TableCell>;
      case "country":
        return <TableCell key={key}>{address.country || "-"}</TableCell>;
      case "category":
        return (
          <TableCell key={key}>
            <div className="flex flex-wrap gap-1">
              {address.category.length > 0 ? (
                address.category.map((category) => (
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
                address.addressComplete
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {address.addressComplete ? "Complete" : "Incomplete"}
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
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {addresses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + 1}
                  className="h-24 text-center"
                >
                  No addresses found
                </TableCell>
              </TableRow>
            ) : (
              addresses.map((address) => (
                <TableRow key={address.id}>
                  {visibleColumns.map((column) => renderCell(address, column.key))}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/addresses/${address.id}/edit`}
                        className={cn(
                          buttonVariants({
                            size: "icon-sm",
                            variant: "ghost",
                          }),
                        )}
                      >
                        <Pencil />
                        <span className="sr-only">Edit address</span>
                      </Link>
                      <DeleteAddressButton
                        addressId={address.id}
                        label={formatAddressLabel(address)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
