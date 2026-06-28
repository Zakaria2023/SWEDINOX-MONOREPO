"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductListItem } from "@/app/(dashboard)/products/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { SALES_UNIT_LABELS } from "@/lib/labels";
import { SalesUnit } from "@/lib/enums";

type ColumnKey =
  | "productCode"
  | "commodityCode"
  | "productGroup"
  | "name"
  | "stockProduct"
  | "standardProduct"
  | "length"
  | "widthDiameter"
  | "thickness"
  | "technicalStock"
  | "stockUnit"
  | "theoreticalWeight"
  | "weightUnit";

const ALL_COLUMNS: Array<{
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
}> = [
  { key: "productCode", label: "Product Code", defaultVisible: true },
  { key: "commodityCode", label: "Commodity Code", defaultVisible: true },
  { key: "productGroup", label: "Product Group", defaultVisible: true },
  { key: "name", label: "Product", defaultVisible: true },
  { key: "stockProduct", label: "Stock Product", defaultVisible: true },
  { key: "standardProduct", label: "Standard Product", defaultVisible: true },
  { key: "length", label: "Length", defaultVisible: false },
  { key: "widthDiameter", label: "Width/Diameter", defaultVisible: false },
  { key: "thickness", label: "Thickness", defaultVisible: false },
  { key: "technicalStock", label: "Technical Stock", defaultVisible: true },
  { key: "stockUnit", label: "StkU", defaultVisible: true },
  { key: "theoreticalWeight", label: "Theor. Weight (kg)", defaultVisible: true },
  { key: "weightUnit", label: "WeightU", defaultVisible: true },
];

type Props = {
  products: ProductListItem[];
};

export const ProductsTableContent = ({ products }: Props) => {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_COLUMNS.map((c) => [c.key, c.defaultVisible])),
  );

  const handleToggle = (key: string) =>
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderCell = (row: ProductListItem, key: ColumnKey) => {
    switch (key) {
      case "productCode":
        return (
          <Link
            href={`/products/${row.uuid}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {row.productCode}
          </Link>
        );
      case "commodityCode":
        return row.commodityCode ?? "—";
      case "productGroup":
        return row.productGroupName ?? "—";
      case "name":
        return row.name;
      case "stockProduct":
        return row.stockProduct ? "Yes" : "No";
      case "standardProduct":
        return row.standardProduct ? "Yes" : "No";
      case "length":
        return row.length ?? "—";
      case "widthDiameter":
        return row.widthDiameter ?? "—";
      case "thickness":
        return row.thickness ?? "—";
      case "technicalStock":
        return row.technicalStock;
      case "stockUnit":
        return row.stockUnit
          ? (SALES_UNIT_LABELS[row.stockUnit as SalesUnit] ?? row.stockUnit)
          : "—";
      case "theoreticalWeight":
        return row.theoreticalWeight;
      case "weightUnit":
        return row.weightUnit
          ? (SALES_UNIT_LABELS[row.weightUnit as SalesUnit] ?? row.weightUnit)
          : "—";
    }
  };

  const visible = ALL_COLUMNS.filter(
    (c) => visibility[c.key] ?? c.defaultVisible,
  );

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
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visible.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((row) => (
                <TableRow key={row.uuid}>
                  {visible.map((col) => (
                    <TableCell key={col.key}>
                      {renderCell(row, col.key)}
                    </TableCell>
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
