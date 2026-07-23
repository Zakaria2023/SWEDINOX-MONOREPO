"use client";

import { ProductPriceRow } from "@/app/(dashboard)/product-prices/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatMoney, formatPercent } from "@/lib/helpers";
import { Check, Minus } from "lucide-react";

type Props = {
  rows: ProductPriceRow[];
};

type FlagProps = {
  on: boolean | null;
  label: string;
};

const COLUMN_COUNT = 17;

const Flag = ({ on, label }: FlagProps) =>
  on ? (
    <Check className="size-4 text-primary" aria-label={`${label}: yes`} />
  ) : (
    <Minus
      className="size-4 text-muted-foreground"
      aria-label={`${label}: no`}
    />
  );

export const ProductPricesTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product code</TableHead>
          <TableHead>Old product no.</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>PriceU</TableHead>
          <TableHead>Group product</TableHead>
          <TableHead>Stock product</TableHead>
          <TableHead>Standard product</TableHead>
          <TableHead>Main group</TableHead>
          <TableHead>Subgroup</TableHead>
          <TableHead>Preferred supplier</TableHead>
          <TableHead>Product no. supplier</TableHead>
          <TableHead className="text-right">Replacement price</TableHead>
          <TableHead className="text-right">Base price</TableHead>
          <TableHead className="text-right">Markup</TableHead>
          <TableHead className="text-right">APP</TableHead>
          <TableHead>Order advice code</TableHead>
          <TableHead className="text-right">FSP</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={COLUMN_COUNT}
              className="h-24 text-center text-muted-foreground"
            >
              No products found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="font-medium whitespace-nowrap">
                {row.productCode}
              </TableCell>
              <TableCell>{row.oldProductCode ?? "—"}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.priceUnit ?? "—"}</TableCell>
              <TableCell>
                <Flag on={row.groupProduct} label="Group product" />
              </TableCell>
              <TableCell>
                <Flag on={row.stockProduct} label="Stock product" />
              </TableCell>
              <TableCell>
                <Flag on={row.standardProduct} label="Standard product" />
              </TableCell>
              <TableCell>{row.mainGroup ?? "—"}</TableCell>
              <TableCell>{row.subGroup ?? "—"}</TableCell>
              <TableCell>{row.preferredSupplier ?? "—"}</TableCell>
              <TableCell>{row.supplierProductCode ?? "—"}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(Number(row.replacementPrice ?? 0))}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(Number(row.basePrice ?? 0))}
              </TableCell>
              <TableCell className="text-right">
                {formatPercent(Number(row.markup ?? 0))}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(Number(row.averagePurchasePrice ?? 0))}
              </TableCell>
              <TableCell>{row.orderAdviceCode ?? "—"}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(Number(row.fixedSalesPrice ?? 0))}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
