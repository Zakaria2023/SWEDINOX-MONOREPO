"use client";

import { useState } from "react";
import type { TextListItem } from "@/app/(dashboard)/texts/actions";
import { formatTextUsageCategoryLabel } from "@/components/texts/text-usage-category-label";
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

type ColumnKey =
  | "id"
  | "title"
  | "textCategoryName"
  | "usageCategoriesJson"
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
  { key: "title", label: "Title", defaultVisible: true },
  { key: "textCategoryName", label: "Text Category", defaultVisible: true },
  {
    key: "usageCategoriesJson",
    label: "Usage Categories",
    defaultVisible: true,
  },
  { key: "sequenceNumber", label: "Sequence Number", defaultVisible: false },
  { key: "isActive", label: "Active", defaultVisible: true },
  { key: "createdAt", label: "Created At", defaultVisible: false },
  { key: "updatedAt", label: "Updated At", defaultVisible: false },
];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, column) => ({ ...acc, [column.key]: column.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type TextsTableContentProps = {
  texts: TextListItem[];
};

export const TextsTableContent = ({ texts }: TextsTableContentProps) => {
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

  const renderCell = (text: TextListItem, key: ColumnKey) => {
    switch (key) {
      case "id":
        return (
          <TableCell key={key} className="font-medium">
            {text.id}
          </TableCell>
        );
      case "title":
        return (
          <TableCell key={key} className="font-medium">
            {text.title}
          </TableCell>
        );
      case "textCategoryName":
        return (
          <TableCell key={key}>
            {text.textCategoryName ?? COMMON_TEXT.none}
          </TableCell>
        );
      case "usageCategoriesJson":
        return (
          <TableCell key={key}>
            <div className="flex flex-wrap gap-1">
              {text.usageCategoriesJson.length > 0 ? (
                text.usageCategoriesJson.map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                  >
                    {formatTextUsageCategoryLabel(category)}
                  </span>
                ))
              ) : (
                <span>{COMMON_TEXT.none}</span>
              )}
            </div>
          </TableCell>
        );
      case "sequenceNumber":
        return <TableCell key={key}>{text.sequenceNumber}</TableCell>;
      case "isActive":
        return (
          <TableCell key={key}>
            {text.isActive ? (
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
            {new Date(text.createdAt).toLocaleDateString()}
          </TableCell>
        );
      case "updatedAt":
        return (
          <TableCell key={key}>
            {new Date(text.updatedAt).toLocaleDateString()}
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
            {texts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center"
                >
                  No texts found
                </TableCell>
              </TableRow>
            ) : (
              texts.map((text) => (
                <TableRow key={text.uuid}>
                  {visibleColumns.map((column) => renderCell(text, column.key))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
