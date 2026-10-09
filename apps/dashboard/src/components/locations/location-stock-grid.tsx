"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatDateColumn, formatNumber, orDash, yesNo } from "@/lib/helpers";
import { STOCK_UNIT_LABELS, WAREHOUSE_LOCATION_TYPE_LABELS } from "@/lib/labels";
import type { StockLotOverviewRow } from "@/lib/server/stock-lot-overview";

// The `Voorraad` grid on the reference's location screen (246), in its order.
// `Klantvoorraad` prints the same columns with the owner in front.
const HEADERS = [
  "Location",
  "Blocked",
  "Product code",
  "Product",
  "Type",
  "Dimensions",
  "Length",
  "Width",
  "StkU",
  "Technical",
  "Reserved",
  "Available",
  "Kg (t)",
  "Kg (r)",
  "Kg (a)",
  "Charge",
  "Factory no.",
  "Purchase order",
  "Supplier",
  "Receipt date",
  "Plate no.",
  "Internal charge",
  "Options",
  "Remark",
  "M1",
  "Bundle",
];

type Props = {
  rows: StockLotOverviewRow[];
  /** `Klantvoorraad` — the owner leads each row. */
  showOwner?: boolean;
  emptyText: string;
};

/**
 * What stands on one location, read-only.
 *
 * The reference's location screen (246) opens `Voorraad` and `Klantvoorraad`
 * under the location's own settings. The product code opens the lot, where the
 * lot toolbar lives.
 */
export const LocationStockGrid = ({ rows, showOwner, emptyText }: Props) => {
  const headers = showOwner ? ["Owner", ...HEADERS] : HEADERS;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header} className="whitespace-nowrap">
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={headers.length}
                className="h-20 text-center text-muted-foreground"
              >
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const quantity = Number(row.quantity ?? 0);
              const technicalKg = Number(row.quantityKg ?? 0);

              return (
                <TableRow key={row.uuid}>
                  {showOwner ? (
                    <TableCell>{orDash(row.ownerName)}</TableCell>
                  ) : null}
                  <TableCell>{orDash(row.locationName)}</TableCell>
                  <TableCell>{yesNo(row.blocked)}</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
                    <Link
                      href={`/stock/${row.uuid}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {row.productCode ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>{orDash(row.productName)}</TableCell>
                  <TableCell>
                    {row.locationType
                      ? WAREHOUSE_LOCATION_TYPE_LABELS[row.locationType]
                      : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {[row.lengthMm, row.widthMm, row.thicknessMm]
                      .filter((value) => value !== null)
                      .join("x") || "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.lengthMm)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.widthMm)}
                  </TableCell>
                  <TableCell>
                    {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(quantity)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(row.reservedQuantity ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(row.available)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(technicalKg)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Math.max(technicalKg - row.availableKg, 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(row.availableKg)}
                  </TableCell>
                  <TableCell>{orDash(row.charge)}</TableCell>
                  <TableCell>{orDash(row.factoryNumber)}</TableCell>
                  <TableCell>{orDash(row.purchaseOrderId)}</TableCell>
                  <TableCell>{orDash(row.supplierName)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateColumn(row.receiptDate)}
                  </TableCell>
                  <TableCell>{orDash(row.plateNumber)}</TableCell>
                  <TableCell>{orDash(row.internalCharge)}</TableCell>
                  <TableCell>{orDash(row.options)}</TableCell>
                  <TableCell>{orDash(row.remark)}</TableCell>
                  {/* Running metres: quantity × length. */}
                  <TableCell className="text-right tabular-nums">
                    {row.lengthMm
                      ? formatNumber((quantity * row.lengthMm) / 1000)
                      : "—"}
                  </TableCell>
                  <TableCell>{orDash(row.internalBatch)}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
