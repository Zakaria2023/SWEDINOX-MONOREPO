"use client";

import Link from "next/link";
import { KeyboardEvent, useState, useTransition } from "react";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { arrangeCrossDockPurchasing } from "@/app/(dashboard)/orders/[uuid]/actions";
import {
  addOrderLines,
  deleteOrderLine,
  OrderActionResult,
  OrderDetail,
  OrderItemDetail,
  updateOrderLineQuantity,
} from "@/app/(dashboard)/orders/actions";
import {
  OrderLinePick,
  stockChoiceToLinePick,
} from "@/app/(dashboard)/orders/mappers";
import {
  CrossDockPurchasingChoice,
  CrossDockPurchasingDialog,
  CrossDockPurchasingOutcome,
} from "@/components/orders/cross-dock-purchasing-dialog";
import { StockSearchDialog } from "@/components/orders/stock-search-dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Select, SelectOption } from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { FormError } from "@/components/ui/form-error";
import { OrderSourceType, orderSourceTypes } from "@/lib/enums";
import {
  cn,
  formatDateColumn,
  formatMoney,
  formatNumber,
  formatPercent,
  lineSpecificationLabel,
  orDash,
  runningMeters,
} from "@/lib/helpers";
import {
  ORDER_LINE_STATUS_LABELS,
  ORDER_SOURCE_TYPE_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

// The reference's `Order lines` grid, column for column (100742, 10-9-2026).
export const ORDER_LINE_COLUMNS = [
  "Code",
  "Type",
  "Delivery date",
  "Status",
  "Product",
  "Description",
  "Category",
  "Quality",
  "Qty(p)",
  "U",
  "Length",
  "Width",
  "Thickness",
  "Kg(p)",
  "M1(p)",
  "#Bundles",
  "Net Price",
  "U",
  "Amount",
  "Purchase p.",
  "Costs",
  "Profit",
  "Profit amount",
  "Reference",
  "Profit too low",
];

// The line toolbar's buttons that are not built, greyed in its order — after
// the specification button, whose caption follows the selected line's type.
export const ORDER_LINE_TOOLBAR_NOT_BUILT = [
  "PAC",
  "New…",
  "Price correction",
  "End call-off",
];

export const SOURCE_TYPE_OPTIONS = orderSourceTypes.map((type) => ({
  value: type,
  label: ORDER_SOURCE_TYPE_LABELS[type],
}));

// The blank row `New` adds, selected like any saved line.
const NEW_LINE = "new";

type PendingLine = {
  pick: OrderLinePick | null;
  quantity: string;
  sourceType: OrderSourceType;
};

type Props = {
  order: OrderDetail;
  /** The line the panels below follow — `?line=` on the order's page. */
  selectedLineUuid: string | null;
  /** Where `Enter the desired supplier` picks from. */
  companies: CompanyOption[];
  /** The order was just saved with `CD` lines: ask about each one. */
  askPurchasingOnOpen: boolean;
};

/**
 * The `Order lines` panel of a saved order. `New` adds a blank line — the
 * next code, Qty(p) 0, `Provisional` — whose `…` opens the `Stock` window;
 * once it names a lot (or, as a `CD` line, an article) and a quantity it is
 * written, reserved and priced. Qty(p) stays typeable and `Delete` takes the
 * selected line off while the order is provisional. Clicking a line selects
 * it, and the panels below follow it.
 */
export const OrderLines = ({
  order,
  selectedLineUuid,
  companies,
  askPurchasingOnOpen,
}: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState<PendingLine | null>(null);
  const [isPendingSelected, setIsPendingSelected] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  // Qty(p) as typed on a saved line, until it is saved.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  // The `CD` lines still to be asked `Purchasing for Cross-docking order
  // line` about, first one on screen. An order saved with them asks at once.
  const [purchasingQueue, setPurchasingQueue] = useState<string[]>(() =>
    askPurchasingOnOpen
      ? order.items
          .filter(
            (item) =>
              item.sourceType === "cross_dock" &&
              !item.purchaseOrderItemUuid &&
              item.status !== "cancelled",
          )
          .map((item) => item.uuid)
      : [],
  );
  // `Don't ask this question again`: the same action for every later `CD`
  // line of this order, for as long as it is open.
  const [rememberedChoice, setRememberedChoice] =
    useState<CrossDockPurchasingChoice | null>(null);
  const [notices, setNotices] = useState<string[]>([]);

  const supplierOptions: SelectOption[] = companies
    .filter((company) => company.roles?.includes("supplier"))
    .map((company) => ({
      value: company.uuid,
      label: [company.searchCode1, company.companyName]
        .filter(Boolean)
        .join(" "),
      description: company.companyName ?? "",
    }));
  const purchasingLine =
    order.items.find((item) => item.uuid === purchasingQueue[0]) ?? null;

  const isEditable = order.status === "provisional";
  const selected = isPendingSelected ? NEW_LINE : selectedLineUuid;
  const nextCode =
    (order.items.reduce(
      (last, item) => Math.max(last, item.lineNumber ?? 0),
      0,
    ) +
      1) *
    10;

  const run = (
    action: () => Promise<OrderActionResult>,
    onSuccess?: (result: OrderActionResult) => void,
  ) => {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      onSuccess?.(result);
    });
  };

  // The remembered action, applied to each line without asking.
  const purchaseWithChoice = (
    lineUuids: string[],
    choice: CrossDockPurchasingChoice,
  ) => {
    if (lineUuids.length === 0) {
      return;
    }
    setError(undefined);
    startTransition(async () => {
      for (const lineUuid of lineUuids) {
        const result = await arrangeCrossDockPurchasing(
          {},
          { ...choice, orderItemUuid: lineUuid, dontAskAgain: true },
        );
        if (result.error) {
          setError(result.error);
          return;
        }
        const message = result.message;
        if (message) {
          setNotices((current) => [...current, message]);
        }
      }
    });
  };

  const askPurchasing = (lineUuids: string[]) => {
    if (rememberedChoice) {
      purchaseWithChoice(lineUuids, rememberedChoice);
      return;
    }
    setPurchasingQueue(lineUuids);
  };

  const finishPurchasing = (outcome: CrossDockPurchasingOutcome) => {
    const rest = purchasingQueue.slice(1);
    const message = outcome.message;
    if (message) {
      setNotices((current) => [...current, message]);
    }
    if (outcome.remember) {
      setRememberedChoice(outcome.remember);
      setPurchasingQueue([]);
      purchaseWithChoice(rest, outcome.remember);
      return;
    }
    setPurchasingQueue(rest);
  };

  // `Cancel` leaves the line without a purchase.
  const skipPurchasing = () =>
    setPurchasingQueue((current) => current.slice(1));

  // The blank line is written once it names what it sells and how many.
  const savePendingLine = (line: PendingLine) => {
    const quantity = line.quantity.trim().replace(",", ".");
    if (!line.pick || !(Number(quantity) > 0) || isPending) {
      return;
    }
    const pick = line.pick;
    run(
      () =>
        addOrderLines(order.uuid, [
          {
            stockUuid: pick.stockUuid,
            productUuid: pick.stockUuid ? null : pick.productUuid,
            quantity,
            sourceType: line.sourceType,
          },
        ]),
      (result) => {
        setPending(null);
        setIsPendingSelected(false);
        if (line.sourceType === "cross_dock") {
          askPurchasing(result.lineUuids ?? []);
        }
      },
    );
  };

  const addBlankLine = () => {
    setError(undefined);
    setPending({ pick: null, quantity: "0", sourceType: "stock" });
    setIsPendingSelected(true);
  };

  const deleteSelectedLine = () => {
    if (selected === NEW_LINE) {
      setPending(null);
      setIsPendingSelected(false);
      return;
    }
    if (!selected) {
      return;
    }
    const lineUuid = selected;
    run(() => deleteOrderLine(order.uuid, lineUuid));
  };

  const clearDraft = (itemUuid: string) =>
    setDrafts((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([uuid]) => uuid !== itemUuid),
      ),
    );

  const saveQuantity = (item: OrderItemDetail) => {
    const draft = drafts[item.uuid];
    if (draft === undefined || isPending) {
      return;
    }
    const quantity = draft.trim().replace(",", ".");
    if (Number(quantity) === Number(item.quantity)) {
      clearDraft(item.uuid);
      return;
    }
    run(
      () => updateOrderLineQuantity(order.uuid, item.uuid, quantity),
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

  const pendingPick = pending?.pick ?? null;
  const pendingKg =
    Number(pending?.quantity.replace(",", ".") || 0) *
    (pendingPick?.pieceWeightKg ?? 0);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addBlankLine}
          disabled={!isEditable || isPending || pending !== null}
          title={
            isEditable
              ? undefined
              : "Lines change while the order is provisional"
          }
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
        {[
          lineSpecificationLabel(
            selected === NEW_LINE
              ? pending?.sourceType
              : order.items.find((item) => item.uuid === selected)?.sourceType,
          ),
          ...ORDER_LINE_TOOLBAR_NOT_BUILT,
        ].map((label) => (
          <Button
            key={label}
            type="button"
            variant="outline"
            size="sm"
            disabled
            title="Not built yet"
          >
            {label}
          </Button>
        ))}
      </div>
      <StockSearchDialog
        open={isStockOpen}
        onOpenChange={setIsStockOpen}
        // A `CD` line buys its metal, so it takes the article rather than a
        // lot, the way a buying document does.
        productOnly={pending?.sourceType === "cross_dock"}
        sources={pending?.sourceType === "cross_dock" ? ["catalogue"] : ["stock"]}
        onChoose={(choice) => {
          setIsStockOpen(false);
          if (!pending) {
            return;
          }
          const pick = stockChoiceToLinePick(
            choice,
            pending.sourceType === "cross_dock",
          );
          if (!pick) {
            setError(
              "That article has no lot on the shelf to sell from — pick a lot, or make the line a CD line.",
            );
            return;
          }
          const next = { ...pending, pick };
          setPending(next);
          // A quantity typed before the product was chosen saves the line now.
          savePendingLine(next);
        }}
      />
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="whitespace-nowrap">
              {ORDER_LINE_COLUMNS.map((column, index) => (
                <TableHead key={`${column}-${index}`}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.length === 0 && !pending && (
              <TableRow>
                <TableCell
                  colSpan={ORDER_LINE_COLUMNS.length}
                  className="text-muted-foreground"
                >
                  No lines.
                </TableCell>
              </TableRow>
            )}
            {order.items.map((item) => {
              const code = (item.lineNumber ?? 0) * 10;
              const isLineEditable = isEditable && item.status === "reserved";
              const lengthMm = item.lengthMm ?? item.lotLengthMm;
              const meters = runningMeters({
                quantity: Number(item.quantity),
                unit: item.unit,
                lengthMm,
              });
              return (
                <TableRow
                  key={item.uuid}
                  aria-selected={item.uuid === selected}
                  className={cn(
                    "relative whitespace-nowrap",
                    item.uuid === selected && "bg-accent",
                  )}
                >
                  <TableCell className="text-right tabular-nums">
                    {/* Stretched over the row: clicking anywhere on a line
                        selects it, and the panels below follow. */}
                    <Link
                      href={`/orders/${order.uuid}?line=${item.uuid}`}
                      scroll={false}
                      aria-label={`Select line ${code}`}
                      aria-current={item.uuid === selected ? "true" : undefined}
                      className="font-medium after:absolute after:inset-0"
                      onClick={() => setIsPendingSelected(false)}
                    >
                      {code}
                    </Link>
                  </TableCell>
                  <TableCell>{ORDER_SOURCE_TYPE_LABELS[item.sourceType]}</TableCell>
                  <TableCell>
                    {formatDateColumn(item.deliveryDate ?? order.deliveryDate)}
                  </TableCell>
                  <TableCell>
                    {item.lineStatus
                      ? ORDER_LINE_STATUS_LABELS[item.lineStatus]
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/products/${item.productUuid}`}
                      className="relative z-10 text-primary hover:underline"
                    >
                      {item.productCode ?? item.productUuid}
                    </Link>
                  </TableCell>
                  <TableCell>{orDash(item.productName)}</TableCell>
                  <TableCell>{orDash(item.stockCategory)}</TableCell>
                  <TableCell>{orDash(item.quality)}</TableCell>
                  <TableCell className="text-right">
                    {isLineEditable ? (
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="relative z-10 w-20 text-right"
                        aria-label={`Qty(p) of line ${code}`}
                        value={
                          drafts[item.uuid] ??
                          String(Number(item.quantity ?? 0))
                        }
                        disabled={isPending}
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
                        {formatNumber(Number(item.quantity))}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.unit ? STOCK_UNIT_LABELS[item.unit] : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(lengthMm)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(item.widthMm ?? item.lotWidthMm)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(item.thicknessMm ?? item.lotThicknessMm)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(item.kgPlanned ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {meters ? formatNumber(meters) : "—"}
                  </TableCell>
                  {/* `#Bundles`: no column holds it on a line yet. */}
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(item.netPrice ?? 0))}
                  </TableCell>
                  <TableCell>
                    {orDash(item.priceUnit ? item.priceUnit.toUpperCase() : null)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(item.amount ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(item.costPrice ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(item.costAmount ?? 0))}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      item.profitTooLow && "text-destructive",
                    )}
                  >
                    {formatPercent(Number(item.profitMargin ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(item.profit ?? 0))}
                  </TableCell>
                  {/* `Reference`: no column holds a line's own reference. */}
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={item.profitTooLow ?? false}
                      readOnly
                      disabled
                      aria-label={`Profit too low on line ${code}`}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {pending && (
              <TableRow
                aria-selected={selected === NEW_LINE}
                onClick={() => setIsPendingSelected(true)}
                className={cn(
                  "cursor-pointer whitespace-nowrap",
                  selected === NEW_LINE && "bg-accent",
                )}
              >
                <TableCell className="text-right tabular-nums">
                  {nextCode}
                </TableCell>
                <TableCell>
                  <Select
                    className="w-24"
                    value={pending.sourceType}
                    options={SOURCE_TYPE_OPTIONS}
                    disabled={isPending}
                    onValueChange={(next) => {
                      // Switching between a lot and an article starts the
                      // line's product over.
                      const sourceType = orderSourceTypes.find(
                        (type) => type === next,
                      );
                      if (sourceType) {
                        setPending({ ...pending, pick: null, sourceType });
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  {formatDateColumn(order.deliveryDate)}
                </TableCell>
                <TableCell>Provisional</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span>{pendingPick?.productCode ?? ""}</span>
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
                <TableCell>{pendingPick?.productName ?? ""}</TableCell>
                <TableCell>{orDash(pendingPick?.stockCategory ?? null)}</TableCell>
                <TableCell>{orDash(pendingPick?.quality ?? null)}</TableCell>
                <TableCell className="text-right">
                  <Input
                    type="text"
                    inputMode="decimal"
                    className="w-20 text-right"
                    aria-label="Qty(p) of the new line"
                    value={pending.quantity}
                    disabled={isPending}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) =>
                      setPending({ ...pending, quantity: event.target.value })
                    }
                    onKeyDown={leaveOnEnter}
                    onBlur={() => savePendingLine(pending)}
                  />
                </TableCell>
                <TableCell>
                  {orDash(pendingPick?.unit ? pendingPick.unit.toUpperCase() : null)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {orDash(pendingPick?.lengthMm ?? null)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {orDash(pendingPick?.widthMm ?? null)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {orDash(pendingPick?.thicknessMm ?? null)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(pendingKg)}
                </TableCell>
                <TableCell className="text-right tabular-nums">—</TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                {/* Priced on the server when the line is written. */}
                <TableCell className="text-right tabular-nums">
                  {formatMoney(0)}
                </TableCell>
                <TableCell />
                <TableCell className="text-right tabular-nums">
                  {formatMoney(0)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(0)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(0)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPercent(0)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(0)}
                </TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell>
                  <input type="checkbox" checked={false} readOnly disabled />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {notices.map((notice, index) => (
        <p
          key={`${notice}-${index}`}
          className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm"
        >
          {notice}
        </p>
      ))}
      <FormError>{error}</FormError>
      {purchasingLine && (
        <CrossDockPurchasingDialog
          key={purchasingLine.uuid}
          line={purchasingLine}
          orderDeliveryDate={order.deliveryDate}
          suppliers={supplierOptions}
          onDone={finishPurchasing}
          onCancel={skipPurchasing}
        />
      )}
    </div>
  );
};
