"use client";

import { TextCategoryListItem } from "@/app/(dashboard)/text-categories/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { COMMON_TEXT } from "@/lib/labels";
import { useState } from "react";

type ColumnKey =
  | "id"
  | "name"
  | "parentName"
  | "sequenceNumber"
  | "isActive"
  | "createdAt"
  | "updatedAt";

const ALL_COLUMNS: Array<{
  defaultVisible: boolean;
  key: ColumnKey;
  label: string;
}> = [
  { key: "id", label: "ID", defaultVisible: true },
  { key: "name", label: "Name", defaultVisible: true },
  { key: "parentName", label: "Parent Category", defaultVisible: true },
  { key: "sequenceNumber", label: "Sequence Number", defaultVisible: true },
  { key: "isActive", label: "Active", defaultVisible: true },
  { key: "createdAt", label: "Created At", defaultVisible: false },
  { key: "updatedAt", label: "Updated At", defaultVisible: false },
];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, column) => ({ ...acc, [column.key]: column.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type TextCategoriesTableContentProps = {
  categories: TextCategoryListItem[];
};

export const TextCategoriesTable = ({
  categories,
}: TextCategoriesTableContentProps) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter(
    (column) => columnVisibility[column.key],
  );

  const renderCell = (category: TextCategoryListItem, key: ColumnKey) => {
    switch (key) {
      case "id":
        return (
          <TableCell key={key} className="font-medium">
            {category.id}
          </TableCell>
        );
      case "name":
        return (
          <TableCell key={key} className="font-medium">
            {category.name}
          </TableCell>
        );
      case "parentName":
        return (
          <TableCell key={key}>
            {category.parentName ?? COMMON_TEXT.none}
          </TableCell>
        );
      case "sequenceNumber":
        return <TableCell key={key}>{category.sequenceNumber}</TableCell>;
      case "isActive":
        return (
          <TableCell key={key}>
            {category.isActive ? (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                {COMMON_TEXT.yes}
              </span>
            ) : (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {COMMON_TEXT.no}
              </span>
            )}
          </TableCell>
        );
      case "createdAt":
        return (
          <TableCell key={key}>
            {new Date(category.createdAt).toLocaleDateString()}
          </TableCell>
        );
      case "updatedAt":
        return (
          <TableCell key={key}>
            {new Date(category.updatedAt).toLocaleDateString()}
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
            {categories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center"
                >
                  No text categories found
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.uuid}>
                  {visibleColumns.map((column) =>
                    renderCell(category, column.key),
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
