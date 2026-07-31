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
import { BooleanFlag } from "@/components/ui/boolean-flag";
import { formatMoney, formatPercent } from "@/lib/helpers";

type Props = {
  rows: ProductPriceRow[];
};

const COLUMN_COUNT = 17;

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
          <TableHead className="text-right">Last invoiced price</TableHead>
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
                <BooleanFlag on={row.groupProduct} label="Group product" />
              </TableCell>
              <TableCell>
                <BooleanFlag on={row.stockProduct} label="Stock product" />
              </TableCell>
              <TableCell>
                <BooleanFlag
                  on={row.standardProduct}
                  label="Standard product"
                />
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
