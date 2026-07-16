"use client";

import { StockOnLocationItem } from "@/app/(dashboard)/stock-on-location/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { STOCK_UNIT_LABELS } from "@/lib/labels";

type Props = {
  stock: StockOnLocationItem[];
};

export const StockOnLocationTable = ({ stock }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Location</TableHead>
          <TableHead className="text-center">Blocked</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Quality</TableHead>
          <TableHead>Stock category</TableHead>
          <TableHead>Options</TableHead>
          <TableHead className="text-right">Length</TableHead>
          <TableHead className="text-right">Width</TableHead>
          <TableHead className="text-right">Thickness</TableHead>
          <TableHead className="text-right">Stock (StkU)</TableHead>
          <TableHead className="text-right">Reserved</TableHead>
          <TableHead className="text-right">Available</TableHead>
          <TableHead>StkU</TableHead>
          <TableHead className="text-right">Stock (Kg)</TableHead>
          <TableHead>Charge</TableHead>
          <TableHead>Bundle</TableHead>
          <TableHead>Internal charge</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Receipt date</TableHead>
          <TableHead className="text-right">Stock (€)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stock.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={20}
              className="h-24 text-center text-muted-foreground"
            >
              No stock on location found.
            </TableCell>
          </TableRow>
        ) : (
          stock.map((row) => {
            const available = (
              Number(row.quantity) - Number(row.reservedQuantity)
            ).toFixed(3);

            return (
              <TableRow key={row.uuid}>
                <TableCell>{row.locationName ?? "—"}</TableCell>
                <TableCell className="text-center">
                  {row.blocked ? "Yes" : ""}
                </TableCell>
                <TableCell className="font-medium">
                  {row.productCode ?? "—"}
                </TableCell>
                <TableCell>{row.quality ?? "—"}</TableCell>
                <TableCell>{row.stockCategory ?? "—"}</TableCell>
                <TableCell>{row.options ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {row.lengthMm ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.widthMm ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.thicknessMm ?? "—"}
                </TableCell>
                <TableCell className="text-right">{row.quantity}</TableCell>
                <TableCell className="text-right">
                  {row.reservedQuantity}
                </TableCell>
                <TableCell className="text-right">{available}</TableCell>
                <TableCell>
                  {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
                </TableCell>
                <TableCell className="text-right">{row.quantityKg}</TableCell>
                <TableCell>{row.charge ?? "—"}</TableCell>
                <TableCell>{row.bundle ?? "—"}</TableCell>
                <TableCell>{row.internalCharge ?? "—"}</TableCell>
                <TableCell>{row.supplierName ?? "—"}</TableCell>
                <TableCell>{row.receiptDate ?? "—"}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  € {row.valuationEuro}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  </div>
);
