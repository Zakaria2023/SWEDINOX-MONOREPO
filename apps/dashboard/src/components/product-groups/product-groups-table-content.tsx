"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductGroupListItem } from "@/app/(dashboard)/product-groups/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import {
  ARTICLE_GROUP_LABELS,
  PRODUCT_SHAPE_LABELS,
  REVENUE_GROUP_LABELS,
} from "@/lib/labels";
import { ArticleGroup, ProductShape, RevenueGroup } from "@/lib/enums";

type ColumnKey =
  | "id"
  | "name"
  | "productShape"
  | "articleGroup"
  | "supplier"
  | "revenueGroup"
  | "scrap"
  | "packaging"
  | "materialGroup"
  | "commodity";

const ALL_COLUMNS: Array<{ key: ColumnKey; label: string; defaultVisible: boolean }> = [
  { key: "id", label: "Code", defaultVisible: true },
  { key: "name", label: "Name", defaultVisible: true },
  { key: "productShape", label: "Product Shape", defaultVisible: true },
  { key: "articleGroup", label: "Article Group", defaultVisible: true },
  { key: "supplier", label: "Supplier", defaultVisible: true },
  { key: "revenueGroup", label: "Revenue Group", defaultVisible: true },
  { key: "scrap", label: "Scrap", defaultVisible: false },
  { key: "packaging", label: "Packaging", defaultVisible: false },
  { key: "materialGroup", label: "Material Group", defaultVisible: false },
  { key: "commodity", label: "Commodity", defaultVisible: false },
];

type Props = {
  productGroups: ProductGroupListItem[];
};

export const ProductGroupsTable = ({ productGroups }: Props) => {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_COLUMNS.map((c) => [c.key, c.defaultVisible])),
  );

  const handleToggle = (key: string) =>
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderCell = (row: ProductGroupListItem, key: ColumnKey) => {
    switch (key) {
      case "id":
        return (
          <Link
            href={`/product-groups/${row.uuid}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {row.id}
          </Link>
        );
      case "name":
        return row.name;
      case "productShape":
        return row.productShape
          ? (PRODUCT_SHAPE_LABELS[row.productShape as ProductShape] ?? row.productShape)
          : "—";
      case "articleGroup":
        return row.articleGroup
          ? (ARTICLE_GROUP_LABELS[row.articleGroup as ArticleGroup] ?? row.articleGroup)
          : "—";
      case "supplier":
        return row.supplierName ?? "—";
      case "revenueGroup":
        return row.revenueGroup
          ? (REVENUE_GROUP_LABELS[row.revenueGroup as RevenueGroup] ?? row.revenueGroup)
          : "—";
      case "scrap":
        return row.scrap ? "Yes" : "No";
      case "packaging":
        return row.packaging ? "Yes" : "No";
      case "materialGroup":
        return row.materialGroup ?? "—";
      case "commodity":
        return row.commodity ?? "—";
    }
  };

  const visible = ALL_COLUMNS.filter((c) => visibility[c.key] ?? c.defaultVisible);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ColumnSelector
          columns={ALL_COLUMNS}
          visibility={visibility}
          onToggle={handleToggle}
        />
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {visible.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {productGroups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visible.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No product groups found.
                </TableCell>
              </TableRow>
            ) : (
              productGroups.map((row) => (
                <TableRow key={row.uuid}>
                  {visible.map((col) => (
                    <TableCell key={col.key}>{renderCell(row, col.key)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
