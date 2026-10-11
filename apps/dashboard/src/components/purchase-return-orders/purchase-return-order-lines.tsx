"use client";

import Link from "next/link";
import { KeyboardEvent, useState, useTransition } from "react";
import {
  addPurchaseReturnLines,
  deletePurchaseReturnLine,
  getReturnableLotsForReturn,
  PurchaseReturnOrderActionResult,
  PurchaseReturnOrderDetail,
  PurchaseReturnOrderLineDetail,
  updatePurchaseReturnLineQuantity,
} from "@/app/(dashboard)/purchase-return-orders/actions";
import { PickedReturnLine } from "@/app/(dashboard)/purchase-return-orders/use-purchase-return-order-submit";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  StockSearchChoice,
  StockSearchDialog,
} from "@/components/orders/stock-search-dialog";
import { ReturnLinesPickerDialog } from "@/components/purchase-return-orders/return-lines-picker-dialog";
import { FormError } from "@/components/ui/form-error";
import {
  cn,
  formatDateColumn,
  formatMoney,
  formatNumber,
  isPurchaseReturnOrderEditable,
  onWorkingDay,
  orDash,
} from "@/lib/helpers";
import { PURCHASE_RETURN_LINE_STATUS_LABELS } from "@/lib/labels";

// The return's `Lines` grid, column for column (blank return, 11-10-2026).
export const RETURN_LINE_COLUMNS = [
  "Code",
  "Order line",
  "Product",
  "Description",
  "Qty(p)",
  "Qty(a)",
  "U",
  "Length",
  "Width",
  "Delivery date",
  "Kg(p)",
  "Kg(a)",
  "Gross Price",
  "U",
  "Line Discount",
  "U",
  "Group Discount",
  "U",
  "Amount",
  "Status",
];

// The row `New` adds, selected like any saved line.
const NEW_LINE = "new";

type Props = {
  returnOrder: PurchaseReturnOrderDetail;
  /** The header's return date as typed — a new line's delivery date. */
  returnDate: string;
};

/**
 * The `Lines` panel of a saved return. `New` adds a blank line whose `…`
 * opens the Stock window; once it has a lot and a Qty(p) it is saved, at
 * € 0,00 as the reference leaves it. Qty(p) stays typeable on every line
 * until the goods have gone; `Delete` takes the selected line off.
 */
export const PurchaseReturnOrderLines = ({ returnOrder, returnDate }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState<PickedReturnLine | null>(null);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  // Qty(p) as typed on a saved line, until it is saved.
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const isEditable = isPurchaseReturnOrderEditable(returnOrder.status);
  // What has actually gone: the planned quantities, once the goods have left.
  const hasLeft =
    returnOrder.status === "delivered" || returnOrder.status === "invoiced";

  const run = (
    action: () => Promise<PurchaseReturnOrderActionResult>,
    onSuccess?: () => void,
  ) => {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      onSuccess?.();
    });
  };

  // The new line is saved once it names a lot and a quantity.
  const savePendingLine = (
    stockUuid: string | null | undefined,
    returnQty: string,
  ) => {
    if (!stockUuid || !(Number(returnQty) > 0) || isPending) {
      return;
    }
    run(
      () =>
        addPurchaseReturnLines(
          returnOrder.uuid,
          [{ stockUuid, returnQty }],
          { unpriced: true },
        ),
      () => {
        setPending(null);
        setSelected(null);
      },
    );
  };

  // The lot chosen in the Stock window has to be one this supplier delivered
  // (on this return's order, when it has one), or there is nothing to send
  // back to it.
  const chooseLot = (choice: StockSearchChoice) => {
    const lot = choice.lot;
    setError(undefined);
    if (!lot) {
      setError("Pick a lot, not just an article: a return sends a parcel back.");
      return;
    }
    void getReturnableLotsForReturn(returnOrder.uuid).then((returnable) => {
      const match = returnable.find((line) => line.stockUuid === lot.uuid);
      if (!match) {
        setError(
          `Lot ${lot.internalCharge ?? lot.charge ?? ""} did not come from this supplier${returnOrder.purchaseOrderUuid ? " on this purchase order" : ""}, or is no longer on the shelf.`,
        );
        return;
      }
      setPending((current) => (current ? { ...current, lot: match } : current));
      // A quantity typed before the lot was chosen saves the line now.
      savePendingLine(match.stockUuid, pending?.returnQty ?? "");
    });
  };

  const addBlankLine = () => {
    setError(undefined);
    setPending({ lot: null, returnQty: "0" });
    setSelected(NEW_LINE);
  };

  const clearDraft = (itemUuid: string) =>
    setDrafts((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([uuid]) => uuid !== itemUuid),
      ),
    );

  const saveQuantity = (item: PurchaseReturnOrderLineDetail) => {
    const draft = drafts[item.uuid];
    if (draft === undefined || isPending) {
      return;
    }
    if (Number(draft) === Number(item.returnQty ?? 0)) {
      clearDraft(item.uuid);
      return;
    }
    run(
      () =>
        updatePurchaseReturnLineQuantity(returnOrder.uuid, item.uuid, draft),
      () => clearDraft(item.uuid),
    );
  };

  // Enter leaves the cell rather than submitting the header around it.
  const leaveOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  const deleteSelectedLine = () => {
    if (selected === NEW_LINE) {
      setPending(null);
      setSelected(null);
      return;
    }
    if (!selected) {
      return;
    }
    const lineUuid = selected;
    setSelected(null);
    run(() => deletePurchaseReturnLine(returnOrder.uuid, lineUuid));
  };

  const pendingLot = pending?.lot ?? null;
  const pendingQty = Number(pending?.returnQty || 0);
  const pendingPlanned = Number(
    pendingLot?.plannedQuantity ?? pendingLot?.receivedQuantity ?? 0,
  );
  const pendingKg =
    pendingPlanned > 0
      ? (Number(pendingLot?.kgPurchased ?? 0) * pendingQty) / pendingPlanned
      : 0;

  return (
    <div className="space-y-2 p-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addBlankLine}
          disabled={!isEditable || isPending || pending !== null}
        >
          New
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={deleteSelectedLine}
          disabled={!isEditable || isPending || selected === null}
        >
          Delete
        </Button>
        {/* `Create Purchase Return order lines`: the parcels received, ticked
            and saved at the price they were bought at. */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsPickerOpen(true)}
          disabled={!isEditable || isPending}
        >
          Received parcels…
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          title="Not built yet"
        >
          Sawing specifications
        </Button>
      </div>
      <ReturnLinesPickerDialog
        purchaseReturnOrderUuid={returnOrder.uuid}
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
      />
      <StockSearchDialog
        open={isStockOpen}
        onOpenChange={setIsStockOpen}
        onChoose={(choice) => {
          chooseLot(choice);
          setIsStockOpen(false);
        }}
      />
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {RETURN_LINE_COLUMNS.map((column, index) => (
                <TableHead key={`${column}-${index}`}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {returnOrder.items.length === 0 && !pending && (
              <TableRow>
                <TableCell
                  colSpan={RETURN_LINE_COLUMNS.length}
                  className="text-muted-foreground"
                >
                  No lines.
                </TableCell>
              </TableRow>
            )}
            {returnOrder.items.map((item, index) => {
              // A line picked in the Stock window carries no price until
              // somebody strikes one; a parcel picked under `Par. return`
              // carries what it was bought at.
              const isPriced = Number(item.netPrice ?? 0) > 0;
              const length = item.lengthMm ?? item.lotLengthMm;
              const width = item.widthMm ?? item.lotWidthMm;
              return (
                <TableRow
                  key={item.uuid}
                  onClick={() => setSelected(item.uuid)}
                  aria-selected={item.uuid === selected}
                  className={cn(
                    "cursor-pointer",
                    item.uuid === selected && "bg-accent",
                  )}
                >
                  <TableCell className="text-right tabular-nums">
                    {(item.lineNumber ?? index + 1) * 10}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.originalPurchaseOrderLine === null
                      ? "0"
                      : [item.reference, item.originalPurchaseOrderLine]
                          .filter((part) => part !== null && part !== "")
                          .join("/")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {item.productUuid ? (
                      <Link
                        href={`/products/${item.productUuid}`}
                        className="text-primary hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {item.productCode ?? item.productUuid}
                      </Link>
                    ) : (
                      ""
                    )}
                  </TableCell>
                  <TableCell>{orDash(item.productName)}</TableCell>
                  <TableCell className="text-right">
                    {isEditable ? (
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="w-20 text-right"
                        aria-label={`Qty(p) of line ${(item.lineNumber ?? index + 1) * 10}`}
                        value={
                          drafts[item.uuid] ??
                          String(Number(item.returnQty ?? 0))
                        }
                        disabled={isPending}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          const value = event.target.value;
                          setDrafts((current) => ({
                            ...current,
                            [item.uuid]: value,
                          }));
                        }}
                        onKeyDown={leaveOnEnter}
                        onBlur={() => saveQuantity(item)}
                      />
                    ) : (
                      <span className="tabular-nums">
                        {formatNumber(Number(item.returnQty ?? 0))}
                      </span>
                    )}
                  </TableCell>
                  {/* What the picking reported as gone; a return sent back
                      from its own screen reads its planned quantity. */}
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(
                      item.qtyActual !== null
                        ? Number(item.qtyActual)
                        : hasLeft
                          ? Number(item.returnQty ?? 0)
                          : 0,
                    )}
                  </TableCell>
                  <TableCell>{orDash(item.unit ? item.unit.toUpperCase() : null)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {`${length ?? 0} mm`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {`${width ?? 0} mm`}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateColumn(
                      item.returnDate ? onWorkingDay(item.returnDate) : null,
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(item.weightKg ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(
                      item.kgActual !== null
                        ? Number(item.kgActual)
                        : hasLeft
                          ? Number(item.weightKg ?? 0)
                          : 0,
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(
                      isPriced
                        ? Number(item.grossPrice ?? item.netPrice ?? 0)
                        : 0,
                    )}
                  </TableCell>
                  <TableCell>{orDash(item.priceUnit)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {(isPriced
                      ? Number(item.lineDiscountPercent ?? 0)
                      : 0
                    ).toFixed(2)}
                  </TableCell>
                  <TableCell>{isPriced ? "%" : ""}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {(isPriced
                      ? Number(item.groupDiscountPercent ?? 0)
                      : 0
                    ).toFixed(2)}
                  </TableCell>
                  <TableCell>{isPriced ? "%" : ""}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(item.amount ?? 0))}
                  </TableCell>
                  <TableCell>
                    {item.lineStatus
                      ? PURCHASE_RETURN_LINE_STATUS_LABELS[item.lineStatus]
                      : "Provisional"}
                  </TableCell>
                </TableRow>
              );
            })}
            {pending && (
              <TableRow
                onClick={() => setSelected(NEW_LINE)}
                aria-selected={selected === NEW_LINE}
                className={cn(
                  "cursor-pointer",
                  selected === NEW_LINE && "bg-accent",
                )}
              >
                <TableCell className="text-right tabular-nums">
                  {(returnOrder.items.reduce(
                    (last, item) => Math.max(last, item.lineNumber ?? 0),
                    0,
                  ) +
                    1) *
                    10}
                </TableCell>
                {/* `0`: a line picked from stock is not one of the order's
                    lines. */}
                <TableCell className="text-right tabular-nums">0</TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <span>{pendingLot?.productCode ?? ""}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label="Choose the product from stock"
                      onClick={(event) => {
                        event.stopPropagation();
                        setIsStockOpen(true);
                      }}
                      disabled={isPending}
                    >
                      …
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{pendingLot?.productName ?? ""}</TableCell>
                <TableCell className="text-right">
                  <Input
                    type="text"
                    inputMode="decimal"
                    className="w-20 text-right"
                    aria-label="Qty(p) of the new line"
                    value={pending.returnQty}
                    disabled={isPending}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => {
                      const returnQty = event.target.value;
                      setPending((current) =>
                        current ? { ...current, returnQty } : current,
                      );
                    }}
                    onKeyDown={leaveOnEnter}
                    onBlur={() =>
                      savePendingLine(
                        pending.lot?.stockUuid,
                        pending.returnQty,
                      )
                    }
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">0</TableCell>
                <TableCell>
                  {orDash(pendingLot?.unit ? pendingLot.unit.toUpperCase() : null)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {`${pendingLot?.lengthMm ?? 0} mm`}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {`${pendingLot?.widthMm ?? 0} mm`}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateColumn(
                    returnDate ? onWorkingDay(returnDate) : null,
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(pendingKg)}
                </TableCell>
                <TableCell className="text-right tabular-nums">0</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(0)}
                </TableCell>
                <TableCell>{orDash(pendingLot?.priceUnit ?? null)}</TableCell>
                <TableCell className="text-right tabular-nums">0.00</TableCell>
                <TableCell />
                <TableCell className="text-right tabular-nums">0.00</TableCell>
                <TableCell />
                <TableCell className="text-right tabular-nums">
                  {formatMoney(0)}
                </TableCell>
                <TableCell>Provisional</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <FormError>{error}</FormError>
    </div>
  );
};
