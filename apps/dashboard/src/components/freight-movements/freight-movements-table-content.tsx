"use client";

import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { FreightMovementListItem } from "@/app/(dashboard)/freight-movements/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { STOCK_MOVEMENT_REASON_LABELS, STOCK_UNIT_LABELS } from "@/lib/labels";
import { formatDateValue } from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  freightMovements: FreightMovementListItem[];
};

type BooleanCellProps = {
  value: boolean | null;
};

const BooleanCell = ({ value }: BooleanCellProps) =>
  value ? (
    <Check className="size-4 text-green-600" />
  ) : (
    <Minus className="size-4 text-muted-foreground" />
  );

export const FreightMovementsTable = ({ freightMovements }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="freight-movements-table"
          fileName="freight-movements"
          sheetName="Freight Movement"
        />
      </div>
      <Table id="freight-movements-table">
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Mutation date / time</TableHead>
            <TableHead>Operator</TableHead>
            <TableHead>Product code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Length (mm)</TableHead>
            <TableHead className="text-right">Width (mm)</TableHead>
            <TableHead className="text-right">MutationQty</TableHead>
            <TableHead>StkU</TableHead>
            <TableHead>Mutation reason</TableHead>
            <TableHead>Workorder #</TableHead>
            <TableHead>Start date</TableHead>
            <TableHead className="text-right">Starting stock</TableHead>
            <TableHead className="text-right">Starting value</TableHead>
            <TableHead>End date</TableHead>
            <TableHead className="text-right">Closing stock</TableHead>
            <TableHead className="text-right">Closing value</TableHead>
            <TableHead>General ledger</TableHead>
            <TableHead>Revenue group</TableHead>
            <TableHead className="text-center">Std</TableHead>
            <TableHead className="text-center">Stock</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Text</TableHead>
            <TableHead>Charge</TableHead>
            <TableHead>Purchase order</TableHead>
            <TableHead>Receipt date</TableHead>
            <TableHead>Supplier</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {freightMovements.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={28}
                className="h-24 text-center text-muted-foreground"
              >
                No freight movements found.
              </TableCell>
            </TableRow>
          ) : (
            freightMovements.map((row) => (
              <TableRow key={row.uuid}>
                <TableCell className="font-medium">
                  <Link
                    href={`/freight-movements/${row.uuid}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {row.id}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {new Date(row.mutationDate).toLocaleString("en-GB")}
                </TableCell>
                <TableCell>{row.mutationOperator ?? "—"}</TableCell>
                <TableCell className="font-medium">
                  {row.productCode ?? "—"}
                </TableCell>
                <TableCell>{row.productName ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {row.length ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.widthDiameter ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.mutationQuantity}
                </TableCell>
                <TableCell>
                  {row.stockUnit ? STOCK_UNIT_LABELS[row.stockUnit] : "—"}
                </TableCell>
                <TableCell>
                  {STOCK_MOVEMENT_REASON_LABELS[row.reason]}
                </TableCell>
                <TableCell>{row.workOrderNumber ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateValue(row.startDate)}
                </TableCell>
                <TableCell className="text-right">
                  {row.startingStockQty ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.startingStockValue ?? "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateValue(row.endDate)}
                </TableCell>
                <TableCell className="text-right">
                  {row.closingStockQty ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.closingStockValue ?? "—"}
                </TableCell>
                <TableCell>{row.generalLedger ?? "—"}</TableCell>
                <TableCell>{row.revenueGroupName ?? "—"}</TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex justify-center">
                    <BooleanCell value={row.standardProduct} />
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex justify-center">
                    <BooleanCell value={row.stockProduct} />
                  </span>
                </TableCell>
                <TableCell>
                  {row.companyName ? (
                    <span>
                      {row.companyId ? (
                        <span className="text-muted-foreground">
                          {row.companyId} —{" "}
                        </span>
                      ) : null}
                      {row.companyName}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {row.orderId ? (
                    <Link
                      href={`/orders/${row.orderUuid}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      #{row.orderId}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{row.text ?? "—"}</TableCell>
                <TableCell>{row.chargeCode ?? "—"}</TableCell>
                <TableCell>
                  {row.purchaseOrderId ? (
                    <Link
                      href={`/purchase-orders/${row.purchaseOrderUuid}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      #{row.purchaseOrderId}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateValue(row.receiptDate)}
                </TableCell>
                <TableCell>{row.supplierName ?? "—"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
