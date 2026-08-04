"use client";

import Link from "next/link";
import { OptionPriceRow } from "@/app/(dashboard)/option-prices-per-product/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { BooleanFlag } from "@/components/ui/boolean-flag";
import { formatDateValue, formatMoney } from "@/lib/helpers";

type Props = {
  rows: OptionPriceRow[];
};

const COLUMN_COUNT = 17;

export const OptionPricesTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product code</TableHead>
          <TableHead>Product no. (old)</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Group product</TableHead>
          <TableHead>Stock product</TableHead>
          <TableHead>Standard product</TableHead>
          <TableHead>Main group</TableHead>
          <TableHead>Subgroup</TableHead>
          <TableHead>Preferred supplier</TableHead>
          <TableHead>Suppliers product no.</TableHead>
          <TableHead>Option code</TableHead>
          <TableHead>Option</TableHead>
          <TableHead>PriceU</TableHead>
          <TableHead>Valid from</TableHead>
          <TableHead>Valid until</TableHead>
          <TableHead className="text-right">Base price</TableHead>
          <TableHead className="text-right">Cost price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={COLUMN_COUNT}
              className="h-24 text-center text-muted-foreground"
            >
              No option prices found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="font-medium whitespace-nowrap">
                <Link
                  href={`/option-prices-per-product/${row.uuid}`}
                  className="text-primary hover:underline"
                >
                  {row.productCode ?? `Option price #${row.id}`}
                </Link>
              </TableCell>
              <TableCell>{row.oldProductCode ?? "—"}</TableCell>
              <TableCell>{row.productName ?? "—"}</TableCell>
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
              <TableCell className="font-medium">
                {row.optionCode ?? "—"}
              </TableCell>
              <TableCell>{row.optionName ?? "—"}</TableCell>
              <TableCell>{row.priceUnit ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.validFrom)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.validUntil)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(Number(row.basePrice ?? 0))}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(Number(row.costPrice ?? 0))}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
