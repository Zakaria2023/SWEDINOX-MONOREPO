"use client";

import Link from "next/link";
import {
  LocationTreeRow,
  SawOrderRow,
  StockDetail,
  StockLotDialogData,
  SupplierDeliveryRow,
} from "@/app/(dashboard)/stock/actions";
import { StockLotToolbar } from "@/components/stock/stock-lot-toolbar";
import {
  StockLotLedger,
  StockLotWeights,
} from "@/components/stock/stock-lot-ledger";
import { STOCK_UNIT_LABELS } from "@/lib/labels";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { StockMovementType } from "@/lib/enums";
import {
  STOCK_CORRECTABLE_ATTRIBUTE_LABELS,
  STOCK_CORRECTION_REASON_LABELS,
  STOCK_MOVEMENT_REASON_LABELS,
  STOCK_MOVEMENT_TYPE_LABELS,
  STOCK_STATUS_LABELS,
} from "@/lib/labels";

const MOVEMENT_TYPE_BADGE: Record<StockMovementType, string> = {
  in: "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700",
  out: "rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700",
  // An adjustment moved nothing, so it is neither green nor red.
  adjust:
    "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700",
};

type Props = {
  stock: StockDetail;
  /** Everything the `Voorraad` toolbar's dialogs open with. */
  dialog: StockLotDialogData;
  locations: LocationTreeRow[];
  deliveries: SupplierDeliveryRow[];
  sawOrders: SawOrderRow[];
};

export const StockDetailView = ({
  stock,
  dialog,
  locations,
  deliveries,
  sawOrders,
}: Props) => (
  <div className="space-y-6">
    {/* Actions in a toolbar above the grid, acting on this lot. */}
    <StockLotToolbar
      data={dialog}
      locations={locations}
      deliveries={deliveries}
      sawOrders={sawOrders}
    />

    {/* 🔴 The ledger and the four weights, which we did not show at all. They
        are the two facts that decide whether any of the actions above are
        safe to run — the reference states both before you touch anything. */}
    <div className="grid gap-4 lg:grid-cols-2">
      <StockLotLedger
        ledger={dialog.ledger}
        unit={stock.unit ? STOCK_UNIT_LABELS[stock.unit] : ""}
        totalLabel="Total movable"
      />
      <StockLotWeights weights={dialog.weights} />
    </div>

    <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Status
        </p>
        <p className="text-sm">{STOCK_STATUS_LABELS[stock.status]}</p>
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Original / Remaining
        </p>
        <p className="text-sm">
          {stock.originalQuantity ?? stock.quantity} / {stock.quantity}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Charge (mill) / Internal
        </p>
        <p className="text-sm">
          {stock.charge ?? "—"} / {stock.internalCharge ?? "—"}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Bundle
        </p>
        <p className="text-sm">{stock.internalBatch ?? "—"}</p>
      </div>
      <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Company
          </p>
          <p className="text-sm">{stock.companyName ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Purchase Order
          </p>
          <p className="text-sm">
            {stock.purchaseOrderId ? (
              <Link
                href={`/purchase-orders/${stock.purchaseOrderUuid}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                #{stock.purchaseOrderId}
              </Link>
            ) : (
              "—"
            )}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Received
          </p>
          <p className="text-sm">
            {new Date(stock.createdAt).toLocaleDateString("en-GB")}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">
          Movement History
        </h2>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.movements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No movements recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                stock.movements.map((movement) => (
                  <TableRow key={movement.uuid}>
                    <TableCell>
                      <span className={MOVEMENT_TYPE_BADGE[movement.type]}>
                        {STOCK_MOVEMENT_TYPE_LABELS[movement.type]}
                      </span>
                    </TableCell>
                    <TableCell>
                      {movement.correctionReason
                        ? STOCK_CORRECTION_REASON_LABELS[
                            movement.correctionReason
                          ]
                        : STOCK_MOVEMENT_REASON_LABELS[movement.reason]}
                    </TableCell>
                    <TableCell className="text-right">
                      {movement.type === "adjust" ? "—" : movement.quantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {/*
                        🔴 What the reference does not record at all: a lot was
                        downgraded `Standaard` → `2nd choice` there and its
                        mutation ledger showed nothing.
                      */}
                      {movement.attribute ? (
                        <span>
                          <span className="font-medium text-foreground">
                            {
                              STOCK_CORRECTABLE_ATTRIBUTE_LABELS[
                                movement.attribute
                              ]
                            }
                          </span>
                          : {movement.valueBefore || "—"} →{" "}
                          {movement.valueAfter || "—"}
                          {movement.note ? ` · ${movement.note}` : ""}
                        </span>
                      ) : (
                        (movement.note ?? "—")
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(movement.createdAt).toLocaleString("en-GB")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
);
