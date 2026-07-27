"use client";

import { CustomerStockItem } from "@/app/(dashboard)/customer-stock/actions";
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
  stock: CustomerStockItem[];
};

export const CustomerStockTable = ({ stock }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Owner</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Quality</TableHead>
          <TableHead>Stock category</TableHead>
          <TableHead className="text-right">Length</TableHead>
          <TableHead className="text-right">Width</TableHead>
          <TableHead className="text-right">Thickness</TableHead>
          <TableHead className="text-right">Stock (StkU)</TableHead>
          <TableHead className="text-right">Available</TableHead>
          <TableHead>StkU</TableHead>
          <TableHead className="text-right">Stock (Kg)</TableHead>
          <TableHead>Charge</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead className="text-right">Valuation price</TableHead>
          <TableHead className="text-right">Stock (€)</TableHead>
          <TableHead>Remark</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stock.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={17}
              className="h-24 text-center text-muted-foreground"
            >
              No customer stock found.
            </TableCell>
          </TableRow>
        ) : (
          stock.map((row) => {
            const available = (
              Number(row.quantity) - Number(row.reservedQuantity)
            ).toFixed(3);

            return (
              <TableRow key={row.uuid}>
                <TableCell className="font-medium">
                  {row.ownerName ?? "—"}
                </TableCell>
                <TableCell>{row.locationName ?? "—"}</TableCell>
                <TableCell>{row.productCode ?? "—"}</TableCell>
                <TableCell>{row.quality ?? "—"}</TableCell>
                <TableCell>{row.stockCategory ?? "—"}</TableCell>
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
                <TableCell className="text-right">{available}</TableCell>
                <TableCell>
                  {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
                </TableCell>
                <TableCell className="text-right">{row.quantityKg}</TableCell>
                <TableCell>{row.charge ?? "—"}</TableCell>
                <TableCell>{row.supplierName ?? "—"}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  € {row.valuationPrice}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  € {row.valuationEuro}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.remark ?? "—"}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  </div>
);
