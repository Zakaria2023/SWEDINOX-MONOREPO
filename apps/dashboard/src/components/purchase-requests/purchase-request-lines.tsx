"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useFormContext,
  useWatch,
  type FieldArrayWithId,
  type UseFieldArrayRemove,
} from "react-hook-form";
import { FileQuestion, Plus, Scissors, ShoppingCart, X } from "lucide-react";
import { PurchaseRequestItemDetail } from "@/app/(dashboard)/purchase-requests/actions";
import { PurchaseRequestFormValues } from "@/app/(dashboard)/purchase-requests/validation";
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
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { stockUnits } from "@/lib/enums";
import { cn, formatDateValue, formatNumber, runningMeters } from "@/lib/helpers";
import { STOCK_UNIT_LABELS } from "@/lib/labels";

const SAVE_FIRST = "Save the purchase request first";
const CLOSED = "This request has been awarded or cancelled";

// The reference's Lines grid on a request (11-10-2026).
const REQUEST_LINE_COLUMNS = [
  "Code",
  "For line",
  "Delivery date",
  "Status",
  "Product",
  "Description",
  "Category",
  "Quality",
  "Qty(p)",
  "U",
  "Length",
  "Thickness",
  "Kg(p)",
  "M1(p)",
];

const NUMERIC_COLUMNS = new Set([
  "Code",
  "Qty(p)",
  "Length",
  "Thickness",
  "Kg(p)",
  "M1(p)",
]);

/** The sales line a saved request line is bought for, keyed by that line. */
export type PurchaseRequestForLines = Record<
  string,
  {
    orderUuid: NonNullable<PurchaseRequestItemDetail["forOrderUuid"]>;
    label: string;
  }
>;

type Props = {
  itemFields: FieldArrayWithId<PurchaseRequestFormValues, "items", "id">[];
  appendItem: () => void;
  removeItem: UseFieldArrayRemove;
  /** Once the request has gone out its lines are the question asked. */
  readOnly: boolean;
  isPending: boolean;
  /** `For line` of the saved lines, resolved to the sales order. */
  forLines: PurchaseRequestForLines;
  /** Opens the `Purchase order` window; null until it can be ordered. */
  onPurchaseOrder: (() => void) | null;
  /** Opens the `Purchase quote` window; null until suppliers can be asked. */
  onPurchaseQuote: (() => void) | null;
};

type LineProps = {
  index: number;
  selected: boolean;
  readOnly: boolean;
  forLines: PurchaseRequestForLines;
  onSelect: () => void;
  onPick: () => void;
};

/**
 * One row of the grid. `Kg(p)` and `M1(p)` follow the quantity as it is
 * typed: the article's piece weight times the pieces, and the pieces laid end
 * to end.
 */
const PurchaseRequestLineRow = ({
  index,
  selected,
  readOnly,
  forLines,
  onSelect,
  onPick,
}: LineProps) => {
  const { control, register } = useFormContext<PurchaseRequestFormValues>();
  const line = useWatch({ control, name: `items.${index}` });
  // A new line reads the header's planned date until it has its own.
  const headerDeliveryDate = useWatch({ control, name: "deliveryDate" });

  const quantity = Number(line?.quantity ?? 0);
  const pieceWeightKg = Number(line?.pieceWeightKg ?? 0);
  const lengthMm = Number(line?.lengthMm ?? 0);
  const thicknessMm = Number(line?.thicknessMm ?? 0);
  const weightKg =
    pieceWeightKg > 0 ? pieceWeightKg * quantity : Number(line?.kg ?? 0);
  const metres = runningMeters({
    quantity,
    unit: line?.unit ?? "st",
    lengthMm: lengthMm > 0 ? lengthMm : null,
  });
  // Why this material is being bought: a customer waiting, or nothing, which
  // means it is going to stock.
  const forLine = line?.forOrderItemUuid
    ? forLines[line.forOrderItemUuid]
    : undefined;

  return (
    <TableRow
      onClick={onSelect}
      className={cn("cursor-pointer", selected && "bg-accent")}
    >
      <TableCell className="text-right tabular-nums">{(index + 1) * 10}</TableCell>
      <TableCell className="whitespace-nowrap">
        {forLine && (
          <Link
            href={`/orders/${forLine.orderUuid}`}
            className="text-primary hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {forLine.label}
          </Link>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {formatDateValue(line?.requiredDate || headerDeliveryDate || null, "")}
      </TableCell>
      <TableCell>Provisional</TableCell>
      <TableCell className="whitespace-nowrap">
        <div className="flex items-center gap-1">
          <span>{line?.productCode ?? ""}</span>
          {/* The reference's `…` opens the `Stock` window every document
              line picks its article from. */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Choose the product"
            disabled={readOnly}
            onClick={(event) => {
              event.stopPropagation();
              onPick();
            }}
          >
            …
          </Button>
        </div>
      </TableCell>
      <TableCell className="min-w-48 whitespace-nowrap">
        {line?.description ?? ""}
      </TableCell>
      <TableCell>{line?.stockCategory || "Standaard"}</TableCell>
      <TableCell>{line?.qualityCode ?? ""}</TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          step="0.001"
          min="0"
          placeholder="0"
          aria-label="Qty (p)"
          disabled={readOnly}
          className="h-8 w-20 px-2 text-right tabular-nums"
          onClick={(event) => event.stopPropagation()}
          {...register(`items.${index}.quantity`)}
        />
      </TableCell>
      {/* A blank line has no unit or weight until it has an article. */}
      <TableCell>
        {line?.productUuid && line.unit ? STOCK_UNIT_LABELS[line.unit] : ""}
      </TableCell>
      <TableCell className="text-right whitespace-nowrap tabular-nums">
        {formatNumber(lengthMm)} mm
      </TableCell>
      <TableCell className="text-right whitespace-nowrap tabular-nums">
        {formatNumber(thicknessMm)} mm
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {line?.productUuid ? formatNumber(weightKg) : ""}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatNumber(metres)}
      </TableCell>
    </TableRow>
  );
};

/**
 * The reference's `Lines` panel on a request: `New · Delete · Sawing
 * specifications · Purchase order · Purchase quote` over the grid.
 *
 * `New` adds a blank line — Code 10, 20 …, `Provisional` — and greys until
 * that line has a product; its Product cell's `…` opens the stock window on
 * the catalogue, because a request buys. Nothing is priced here: the price is
 * the question the request asks.
 */
export const PurchaseRequestLines = ({
  itemFields,
  appendItem,
  removeItem,
  readOnly,
  isPending,
  forLines,
  onPurchaseOrder,
  onPurchaseQuote,
}: Props) => {
  const { control, setValue } = useFormContext<PurchaseRequestFormValues>();
  const items = useWatch({ control, name: "items" });
  // The line whose `…` opened the stock window, or null when it is shut.
  const [pickingLine, setPickingLine] = useState<number | null>(null);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  const lineCount = itemFields.length;
  const hasLineWithoutProduct = (items ?? []).some(
    (item) => !item.productUuid,
  );

  const addBlankLine = () => {
    appendItem();
    setSelectedLine(itemFields.length);
  };

  const deleteSelectedLine = () => {
    if (selectedLine === null) {
      return;
    }
    removeItem(selectedLine);
    setSelectedLine(null);
  };

  // The article's own measurements travel onto the line, as on a purchase
  // order: `Cold-rolled plate 304L  2000x1000x2mm` is the name with the size.
  const chooseProduct = (index: number, choice: StockSearchChoice) => {
    const row = choice.kind === "lot" ? choice.lot : choice.variant;
    const mm = (value: number | string | null) =>
      value === null || Number(value) <= 0 ? "" : String(Number(value));
    const size = [row.lengthMm, row.widthMm, row.thicknessMm]
      .map(mm)
      .filter(Boolean)
      .join("x");
    // The article's own unit, not the lot's: a plate stocked by the kilo is
    // still asked for by the piece.
    const articleUnit = (row.articleUnit ?? row.unit ?? "").toLowerCase();

    setValue(`items.${index}.productUuid`, row.productUuid);
    setValue(`items.${index}.productCode`, row.productCode ?? "");
    setValue(
      `items.${index}.description`,
      [row.productName, size ? `${size}mm` : null].filter(Boolean).join("  "),
    );
    setValue(`items.${index}.qualityCode`, row.quality ?? "");
    setValue(
      `items.${index}.unit`,
      stockUnits.find((unit) => unit === articleUnit) ?? "st",
    );
    setValue(`items.${index}.lengthMm`, mm(row.lengthMm));
    setValue(`items.${index}.thicknessMm`, mm(row.thicknessMm));
    setValue(
      `items.${index}.pieceWeightKg`,
      row.pieceWeightKg === null ? "" : String(row.pieceWeightKg),
    );
    setValue(`items.${index}.kg`, "");
  };

  return (
    <CollapsibleSection
      title="Lines"
      summary={`${lineCount} ${lineCount === 1 ? "line" : "lines"}`}
      defaultOpen
    >
      <div className="space-y-2 p-3">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/30 px-2 py-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addBlankLine}
            disabled={readOnly || isPending || hasLineWithoutProduct}
          >
            <Plus className="size-3.5 text-primary" /> New
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={deleteSelectedLine}
            disabled={readOnly || isPending || selectedLine === null}
          >
            <X className="size-3.5 text-destructive" /> Delete
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled
            title="Not built yet"
          >
            <Scissors className="size-3.5" /> Sawing specifications
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onPurchaseOrder ?? undefined}
            disabled={onPurchaseOrder === null || isPending}
            title={onPurchaseOrder ? undefined : readOnly ? CLOSED : SAVE_FIRST}
          >
            <ShoppingCart className="size-3.5" /> Purchase order
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onPurchaseQuote ?? undefined}
            disabled={onPurchaseQuote === null || isPending}
            title={onPurchaseQuote ? undefined : readOnly ? CLOSED : SAVE_FIRST}
          >
            <FileQuestion className="size-3.5" /> Purchase quote
          </Button>
        </div>

        <StockSearchDialog
          open={pickingLine !== null}
          onOpenChange={(open) => {
            if (!open) {
              setPickingLine(null);
            }
          }}
          sources={["catalogue", "purchase"]}
          productOnly
          initialProductCode={
            pickingLine === null
              ? null
              : items?.[pickingLine]?.productCode || null
          }
          onChoose={(choice) => {
            if (pickingLine !== null) {
              chooseProduct(pickingLine, choice);
            }
            setPickingLine(null);
          }}
        />

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {REQUEST_LINE_COLUMNS.map((column) => (
                  <TableHead
                    key={column}
                    className={cn(NUMERIC_COLUMNS.has(column) && "text-right")}
                  >
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemFields.map((field, index) => (
                <PurchaseRequestLineRow
                  key={field.id}
                  index={index}
                  selected={selectedLine === index}
                  readOnly={readOnly}
                  forLines={forLines}
                  onSelect={() => setSelectedLine(index)}
                  onPick={() => setPickingLine(index)}
                />
              ))}
              {lineCount === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={REQUEST_LINE_COLUMNS.length}
                    className="text-muted-foreground"
                  >
                    No lines. Press New to add one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {readOnly && (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            This request has already gone out to suppliers. Its lines are the
            question their quotes are answering, so they can no longer be
            changed here.
          </p>
        )}
      </div>
    </CollapsibleSection>
  );
};
