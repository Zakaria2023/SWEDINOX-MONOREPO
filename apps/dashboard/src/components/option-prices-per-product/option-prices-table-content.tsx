"use client";

import { Paged } from "@/lib/table-query";

import Link from "next/link";
import { TablePagination } from "@/components/ui/table-pagination";
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
import { TableExportButton } from "@/components/ui/table-export-button";
import { GenerateOptionPricesButton } from "@/components/option-prices-per-product/generate-option-prices-button";
import { NewOptionDialog } from "@/components/option-prices-per-product/new-option-dialog";

type Props = {
  page: Paged<OptionPriceRow>;
};

const COLUMN_COUNT = 17;

export const OptionPricesTable = ({ page }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <TableExportButton
          tableId="option-prices-per-product-table"
          fileName="option-prices-per-product"
          sheetName="Option prices per product"
        />
        <NewOptionDialog />
        <GenerateOptionPricesButton />
      </div>
      <Table id="option-prices-per-product-table">
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
          {page.rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COLUMN_COUNT}
                className="h-24 text-center text-muted-foreground"
              >
                No option prices found.
              </TableCell>
            </TableRow>
          ) : (
            page.rows.map((row) => (
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
    <TablePagination page={page} singular="price" plural="prices" />
  </div>
);
