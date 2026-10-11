"use client";

import Link from "next/link";
import { KeyboardEvent, useState, useTransition } from "react";
import {
  addReturnOrderLines,
  deleteReturnOrderLine,
  ReturnOrderActionResult,
  ReturnOrderDetail,
  ReturnOrderLineDetail,
  updateReturnOrderLineQuantity,
} from "@/app/(dashboard)/return-orders/actions";
import { useReturnLinePicker } from "@/app/(dashboard)/return-orders/use-return-line-picker";
import { PendingReturnLine } from "@/app/(dashboard)/return-orders/use-return-order-submit";
import {
  StockSearchChoice,
  StockSearchDialog,
} from "@/components/orders/stock-search-dialog";
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
import { FormError } from "@/components/ui/form-error";
import {
  cn,
  formatDateColumn,
  formatMoney,
  formatNumber,
  isReturnOrderEditable,
  orDash,
} from "@/lib/helpers";
import { DISCOUNT_UNIT_LABELS, ORDER_LINE_STATUS_LABELS } from "@/lib/labels";
import { PendingReturnLineRow } from "./pending-return-line-row";

// The return's `Order lines` grid, column for column — the sales order's line
// grid with `Qty(a)` and `Kg(a)` for what actually came back.
export const RETURN_ORDER_LINE_COLUMNS = [
  "Code",
  "Order line",
  "Status",
  "Delivery date",
  "Product",
  "Description",
  "Qty(p)",
  "Qty(a)",
  "U",
  "Length",
  "Width",
  "Kg(p)",
  "Kg(a)",
  "Gross price",
  "U",
  "Line discount",
  "U",
  "Group discount",
  "U",
  "Amount",
];

// The row `New` adds, selected like any saved line.
const NEW_LINE = "new";

type Props = {
  returnOrder: ReturnOrderDetail;
  /** The header's return date as typed — a new line's delivery date. */
  returnDate: string;
};

/**
 * The `Order lines` panel of a saved return. `New` adds a blank line whose `…`
 * opens the Stock window; once it names something this customer was invoiced
 * and has a Qty(p), it is saved. Qty(p) stays typeable on every line until the
 * goods are back; `Delete` takes the selected line off.
 */
export const ReturnOrderLines = ({ returnOrder, returnDate }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState<PendingReturnLine | null>(null);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  // Qty(p) as typed on a saved line, until it is saved.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const pickLine = useReturnLinePicker({
    companyUuid: returnOrder.companyUuid,
    orderUuid: returnOrder.orderUuid,
  });

  const isEditable = isReturnOrderEditable(returnOrder.status);
  // What has actually come back: the planned quantities, once received.
  const hasArrived =
    returnOrder.status === "received" || returnOrder.status === "credited";

  const run = (
    action: () => Promise<ReturnOrderActionResult>,
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

  // The new line is saved once it names an invoiced line and a quantity.
  const savePendingLine = (next: PendingReturnLine | null) => {
    if (!next?.line || !(Number(next.returnQty) > 0) || isPending) {
      return;
    }
    const orderItemUuid = next.line.orderItemUuid;
    run(
      () =>
        addReturnOrderLines(returnOrder.uuid, [
          {
            orderItemUuid,
            returnQty: next.returnQty,
            returnReason: returnOrder.returnReason,
          },
        ]),
      () => {
        setPending(null);
        setSelected(null);
      },
    );
  };

  const chooseProduct = (choice: StockSearchChoice) => {
    setError(undefined);
    const excluded = returnOrder.items.flatMap((item) =>
      item.originalOrderItemUuid ? [item.originalOrderItemUuid] : [],
    );
    void pickLine(choice, excluded).then((picked) => {
      if (!picked.line) {
        setError(picked.error);
        return;
      }
      const next = {
        line: picked.line,
        returnQty: pending?.returnQty ?? "0",
      };
      setPending(next);
      // A quantity typed before the product was chosen saves the line now.
      savePendingLine(next);
    });
  };

  const addBlankLine = () => {
    setError(undefined);
    setPending({ line: null, returnQty: "0" });
    setSelected(NEW_LINE);
  };

  const clearDraft = (itemUuid: string) =>
    setDrafts((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([uuid]) => uuid !== itemUuid),
      ),
    );

  const saveQuantity = (item: ReturnOrderLineDetail) => {
    const draft = drafts[item.uuid];
    if (draft === undefined || isPending) {
      return;
    }
    if (Number(draft) === Number(item.returnQty ?? 0)) {
      clearDraft(item.uuid);
      return;
    }
    run(
      () => updateReturnOrderLineQuantity(returnOrder.uuid, item.uuid, draft),
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
    run(() => deleteReturnOrderLine(returnOrder.uuid, lineUuid));
  };

  const nextCode =
    (returnOrder.items.reduce(
      (last, item) => Math.max(last, item.lineNumber ?? 0),
      0,
    ) +
      1) *
    10;

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
        {/* Greyed on a return in the reference, where it is live on a sales
            order (return 290247, 29-9-2026). */}
        <Button type="button" variant="outline" size="sm" disabled>
          Reservations…
        </Button>
      </div>
      <StockSearchDialog
        open={isStockOpen}
        onOpenChange={setIsStockOpen}
        onChoose={(choice) => {
          chooseProduct(choice);
          setIsStockOpen(false);
        }}
      />
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {RETURN_ORDER_LINE_COLUMNS.map((column, index) => (
                <TableHead key={`${column}-${index}`}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {returnOrder.items.length === 0 && !pending && (
              <TableRow>
                <TableCell
                  colSpan={RETURN_ORDER_LINE_COLUMNS.length}
                  className="text-muted-foreground"
                >
                  No lines.
                </TableCell>
              </TableRow>
            )}
            {returnOrder.items.map((item, index) => {
              const code = (item.lineNumber ?? index + 1) * 10;
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
                    {code}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.originalOrderLine === null
                      ? "0"
                      : [item.reference, item.originalOrderLine]
                          .filter((part) => part !== null && part !== "")
                          .join("/")}
                  </TableCell>
                  <TableCell>
                    {item.lineStatus
                      ? ORDER_LINE_STATUS_LABELS[item.lineStatus]
                      : "Provisional"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateColumn(item.deliveryDate ?? (returnDate || null))}
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
                        aria-label={`Qty(p) of line ${code}`}
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
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(hasArrived ? Number(item.returnQty ?? 0) : 0)}
                  </TableCell>
                  <TableCell>
                    {orDash(item.unit ? item.unit.toUpperCase() : null)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {`${item.lengthMm ?? 0} mm`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {`${item.widthMm ?? 0} mm`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(item.weightKg ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(hasArrived ? Number(item.weightKg ?? 0) : 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(
                      Number(item.salesGrossPrice ?? item.netPrice ?? 0),
                    )}
                  </TableCell>
                  <TableCell>{orDash(item.priceUnit)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Number(item.salesLineDiscount ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {item.salesLineDiscountUnit
                      ? DISCOUNT_UNIT_LABELS[item.salesLineDiscountUnit]
                      : ""}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Number(item.salesGroupDiscount ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {item.salesGroupDiscountUnit
                      ? DISCOUNT_UNIT_LABELS[item.salesGroupDiscountUnit]
                      : ""}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(item.amount ?? 0))}
                  </TableCell>
                </TableRow>
              );
            })}
            {pending && (
              <PendingReturnLineRow
                code={nextCode}
                pending={pending}
                isSelected={selected === NEW_LINE}
                returnDate={returnDate}
                disabled={isPending}
                onSelect={() => setSelected(NEW_LINE)}
                onChooseProduct={() => setIsStockOpen(true)}
                onQuantityChange={(returnQty) =>
                  setPending((current) =>
                    current ? { ...current, returnQty } : current,
                  )
                }
                onQuantityCommit={() => savePendingLine(pending)}
              />
            )}
          </TableBody>
        </Table>
      </div>
      <FormError>{error}</FormError>
    </div>
  );
};
