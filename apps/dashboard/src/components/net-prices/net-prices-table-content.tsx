"use client";

import Link from "next/link";
import { NetPriceRow } from "@/app/(dashboard)/net-prices/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { BooleanFlag } from "@/components/ui/boolean-flag";
import {
  formatDateValue,
  formatMoney,
  formatNumber,
  formatPercent,
} from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: NetPriceRow[];
};

const COLUMN_COUNT = 21;

export const NetPricesTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="net-prices-table"
          fileName="net-prices"
          sheetName="Net prices"
        />
      </div>
      <Table id="net-prices-table">
        <TableHeader>
          <TableRow>
            <TableHead>Contract code</TableHead>
            <TableHead>Contract</TableHead>
            <TableHead className="text-right">Company code</TableHead>
            <TableHead>Company</TableHead>
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
            <TableHead className="text-right">Base price</TableHead>
            <TableHead className="text-right">Discount</TableHead>
            <TableHead className="text-right">Net price</TableHead>
            <TableHead>Net priceU</TableHead>
            <TableHead>Valid from</TableHead>
            <TableHead>Valid until</TableHead>
            <TableHead className="text-right">FromQty</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COLUMN_COUNT}
                className="h-24 text-center text-muted-foreground"
              >
                No net prices found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.uuid}>
                <TableCell className="font-medium whitespace-nowrap">
                  <Link
                    href={`/net-prices/${row.uuid}`}
                    className="text-primary hover:underline"
                  >
                    {row.contractCode ?? `Net price #${row.id}`}
                  </Link>
                </TableCell>
                <TableCell>{row.contractDescription ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {row.companyCode ?? "—"}
                </TableCell>
                <TableCell>{row.companyName ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {row.productCode ?? "—"}
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
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(Number(row.basePrice ?? 0))}
                </TableCell>
                <TableCell className="text-right">
                  {formatPercent(Number(row.discountPercent ?? 0))}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(Number(row.netPrice ?? 0))}
                </TableCell>
                <TableCell>{row.netPriceUnit ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateValue(row.validFrom)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateValue(row.validUntil)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatNumber(Number(row.fromQty ?? 0))}{" "}
                  {row.fromQtyUnit ?? ""}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
