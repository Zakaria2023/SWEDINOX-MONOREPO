"use client";

import { useState } from "react";
import {
  Controller,
  useFormContext,
  useWatch,
  type FieldArrayWithId,
  type UseFieldArrayRemove,
} from "react-hook-form";
import { BadgeCheck, Calculator, Plus, Scissors, X } from "lucide-react";
import { PurchaseQuoteFormValues } from "@/app/(dashboard)/purchase-quotes/validation";
import {
  StockSearchChoice,
  StockSearchDialog,
} from "@/components/orders/stock-search-dialog";
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
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { purchasingUnits, stockUnits } from "@/lib/enums";
import {
  amountForWeight,
  cn,
  formatDateValue,
  formatMoney,
  formatNumber,
  netPriceAfterDiscounts,
} from "@/lib/helpers";
import { STOCK_UNIT_LABELS } from "@/lib/labels";

const NOT_BUILT = "Not built yet";

// The reference's Lines grid on a quote (900000): `Code · Product ·
// Description · Qty(p) · U · Length · Kg(p) · Gross Price · Thickness · Net
// Price · U · Line Discount · U · Group Discount · U · Amount · Delivery date ·
// Status · Bev. Nettop…`, and the overview's `Internal Text` at the end.
const QUOTE_LINE_COLUMNS = [
  "Code",
  "Product",
  "Description",
  "Qty(p)",
  "U",
  "Length",
  "Kg(p)",
  "Gross Price",
  "Thickness",
  "Net Price",
  "U",
  "Line Discount",
  "U",
  "Group Discount",
  "U",
  "Amount",
  "Delivery date",
  "Status",
  "Bev. Nettoprijs",
  "Internal text",
];

const NUMERIC_COLUMNS = new Set([
  "Code",
  "Qty(p)",
  "Length",
  "Kg(p)",
  "Gross Price",
  "Thickness",
  "Net Price",
  "Line Discount",
  "Group Discount",
  "Amount",
]);

// The quick option buttons under the reference's Lines toolbar.
const OPTION_SHORTCUTS = ["DUPK320", "NG", "K320", "BF", "F", "L", "K", "LSR"];

// The reference prints the unit's code — `ST`, `TN` — not a word.
const unitOptions: SelectOption[] = stockUnits.map((unit) => ({
  value: unit,
  label: STOCK_UNIT_LABELS[unit],
}));

const priceUnitOptions: SelectOption[] = [
  { value: "", label: "—" },
  ...purchasingUnits.map((unit) => ({ value: unit, label: unit })),
];

const cell = "h-8 w-20 px-2 text-right tabular-nums";

type Props = {
  itemFields: FieldArrayWithId<PurchaseQuoteFormValues, "items", "id">[];
  appendItem: () => void;
  removeItem: UseFieldArrayRemove;
  /** A decided quote's lines are shown, never retyped. */
  readOnly: boolean;
  isPending: boolean;
  /** Every line carries the quote's status — `Expired` on 900000's line too. */
  statusLabel: string;
};

type LineProps = {
  index: number;
  selected: boolean;
  readOnly: boolean;
  statusLabel: string;
  onSelect: () => void;
  onPick: () => void;
};

/**
 * One row of the grid. `Kg(p)`, `Net Price` and `Amount` are worked out as
 * the line is typed, the way the reference fills them live: ten plates of
 * 31,4 kg are 314 kg, and at € 1.930 per tonne that is € 606,02.
 */
const PurchaseQuoteLineRow = ({
  index,
  selected,
  readOnly,
  statusLabel,
  onSelect,
  onPick,
}: LineProps) => {
  const { control, register } = useFormContext<PurchaseQuoteFormValues>();
  const line = useWatch({ control, name: `items.${index}` });
  // A line reads the header's planned delivery date.
  const headerDeliveryDate = useWatch({ control, name: "deliveryDate" });

  const quantity = Number(line?.quantity ?? 0);
  const pieceWeightKg = Number(line?.pieceWeightKg ?? 0);
  const weightKg =
    pieceWeightKg > 0 ? pieceWeightKg * quantity : Number(line?.kg ?? 0);
  const grossPrice = Number(line?.grossPrice ?? 0);
  // A gross price with its two discounts wins over a net price typed in — the
  // same rule the server saves by.
  const netPrice =
    grossPrice > 0
      ? netPriceAfterDiscounts(
          grossPrice,
          Number(line?.groupDiscountPercent ?? 0),
          Number(line?.lineDiscountPercent ?? 0),
        )
      : Number(line?.netPrice ?? 0);
  const amount =
    netPrice > 0
      ? amountForWeight(netPrice, line?.priceUnit ?? null, weightKg, {
          quantity,
          lengthMm: Number(line?.lengthMm ?? 0) || null,
          widthMm: Number(line?.widthMm ?? 0) || null,
          thicknessMm: Number(line?.thicknessMm ?? 0) || null,
        })
      : 0;

  return (
    <TableRow
      onClick={onSelect}
      className={cn("cursor-pointer", selected && "bg-accent")}
    >
      <TableCell className="text-right tabular-nums">
        {(index + 1) * 10}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <div className="flex items-center gap-1">
          <span>{line?.productCode ?? ""}</span>
          {/* The reference's `…` opens the `Stock` window every document
              line picks its article from — on the catalogue, because a quote
              buys. */}
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
      <TableCell className="min-w-56">
        <Input
          aria-label="Description"
          disabled={readOnly}
          className="h-8 px-2"
          onClick={(event) => event.stopPropagation()}
          {...register(`items.${index}.description`)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.001"
          min="0"
          placeholder="0"
          aria-label="Qty (p)"
          disabled={readOnly}
          className={cell}
          onClick={(event) => event.stopPropagation()}
          {...register(`items.${index}.quantity`)}
        />
      </TableCell>
      <TableCell className="min-w-20">
        <Controller
          control={control}
          name={`items.${index}.unit`}
          render={({ field }) => (
            <Select
              id={`items.${index}.unit`}
              value={field.value ?? "st"}
              options={unitOptions}
              onValueChange={field.onChange}
              className="h-8"
              disabled={readOnly}
            />
          )}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          placeholder="0"
          aria-label="Length (mm)"
          disabled={readOnly}
          className={cell}
          onClick={(event) => event.stopPropagation()}
          {...register(`items.${index}.lengthMm`)}
        />
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {/* Worked out from the article; typed only for one that cannot be
            weighed, such as a piece article with no weight on record. */}
        {pieceWeightKg > 0 ? (
          formatNumber(weightKg)
        ) : (
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0"
            aria-label="Kg (p)"
            disabled={readOnly}
            className={cell}
            onClick={(event) => event.stopPropagation()}
            {...register(`items.${index}.kg`)}
          />
        )}
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.0001"
          min="0"
          placeholder="0.00"
          aria-label="Gross price"
          disabled={readOnly}
          className={cn(cell, "w-24")}
          onClick={(event) => event.stopPropagation()}
          {...register(`items.${index}.grossPrice`)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="0"
          aria-label="Thickness (mm)"
          disabled={readOnly}
          className={cell}
          onClick={(event) => event.stopPropagation()}
          {...register(`items.${index}.thicknessMm`)}
        />
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {grossPrice > 0 ? (
          formatMoney(netPrice)
        ) : (
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            aria-label="Net price"
            disabled={readOnly}
            className={cn(cell, "w-24")}
            onClick={(event) => event.stopPropagation()}
            {...register(`items.${index}.netPrice`)}
          />
        )}
      </TableCell>
      <TableCell className="min-w-20">
        <Controller
          control={control}
          name={`items.${index}.priceUnit`}
          render={({ field }) => (
            <Select
              id={`items.${index}.priceUnit`}
              value={field.value ?? ""}
              options={priceUnitOptions}
              onValueChange={field.onChange}
              className="h-8"
              disabled={readOnly}
            />
          )}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          aria-label="Line discount (%)"
          disabled={readOnly}
          className={cell}
          onClick={(event) => event.stopPropagation()}
          {...register(`items.${index}.lineDiscountPercent`)}
        />
      </TableCell>
      <TableCell>%</TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          aria-label="Group discount (%)"
          disabled={readOnly}
          className={cell}
          onClick={(event) => event.stopPropagation()}
          {...register(`items.${index}.groupDiscountPercent`)}
        />
      </TableCell>
      <TableCell>%</TableCell>
      <TableCell className="text-right whitespace-nowrap tabular-nums">
        {formatMoney(amount)}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {formatDateValue(headerDeliveryDate || null, "")}
      </TableCell>
      <TableCell>{statusLabel}</TableCell>
      {/* `Bev. Nettoprijs` — the confirmed net price. Nothing stores it yet. */}
      <TableCell
        className="text-right text-muted-foreground tabular-nums"
        title={NOT_BUILT}
      >
        —
      </TableCell>
      <TableCell className="min-w-48">
        <Input
          aria-label="Internal text"
          disabled={readOnly}
          className="h-8 px-2"
          onClick={(event) => event.stopPropagation()}
          {...register(`items.${index}.internalText`)}
        />
      </TableCell>
    </TableRow>
  );
};

/**
 * The reference's `Lines` panel on a quote: `New · Delete · Sawing
 * specifications · Calculate · Bev. Nettoprijs`, then the option shortcuts.
 *
 * `New` adds a blank line — Code 10, 20 …, Qty 0 — and greys until that line
 * has a product; the Product cell's `…` opens the stock window on the
 * catalogue.
 */
export const PurchaseQuoteLines = ({
  itemFields,
  appendItem,
  removeItem,
  readOnly,
  isPending,
  statusLabel,
}: Props) => {
  const { control, getValues, setValue } =
    useFormContext<PurchaseQuoteFormValues>();
  const items = useWatch({ control, name: "items" });
  // The line whose `…` opened the stock window, or null when it is shut.
  const [pickingLine, setPickingLine] = useState<number | null>(null);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  const lineCount = itemFields.length;
  const hasBlankLine = (items ?? []).some(
    (item) => !item.productUuid && !item.description,
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
    // still quoted by the piece.
    const articleUnit = (row.articleUnit ?? row.unit ?? "").toLowerCase();

    setValue(`items.${index}.productUuid`, row.productUuid);
    setValue(`items.${index}.productCode`, row.productCode ?? "");
    setValue(
      `items.${index}.description`,
      [row.productName, size ? `${size}mm` : null].filter(Boolean).join("  "),
    );
    setValue(
      `items.${index}.unit`,
      stockUnits.find((unit) => unit === articleUnit) ?? "st",
    );
    setValue(`items.${index}.lengthMm`, mm(row.lengthMm));
    setValue(`items.${index}.widthMm`, mm(row.widthMm));
    setValue(`items.${index}.thicknessMm`, mm(row.thicknessMm));
    setValue(
      `items.${index}.pieceWeightKg`,
      row.pieceWeightKg === null ? "" : String(row.pieceWeightKg),
    );
    setValue(`items.${index}.kg`, "");
    // Steel is bought by the tonne, and the article says so itself.
    if (row.purchasingUnit || !getValues(`items.${index}.priceUnit`)) {
      setValue(`items.${index}.priceUnit`, row.purchasingUnit ?? "TN");
    }
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
            disabled={readOnly || isPending || hasBlankLine}
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
            title={NOT_BUILT}
          >
            <Scissors className="size-3.5" /> Sawing specifications
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled
            title={NOT_BUILT}
          >
            <Calculator className="size-3.5" /> Calculate
          </Button>
          {/* `Bev. Nettoprijs` — confirm the net price. The reference shows
              it once a line exists; nothing stores a confirmed price yet. */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled
            title={NOT_BUILT}
          >
            <BadgeCheck className="size-3.5" /> Bev. Nettoprijs
          </Button>
          <span className="mx-1 h-5 border-l" />
          {OPTION_SHORTCUTS.map((option) => (
            <Button
              key={option}
              type="button"
              variant="outline"
              size="sm"
              disabled
              className="h-7 px-2 text-xs"
              title={NOT_BUILT}
            >
              {option}
            </Button>
          ))}
        </div>

        <StockSearchDialog
          open={pickingLine !== null}
          onOpenChange={(open) => {
            if (!open) {
              setPickingLine(null);
            }
          }}
          sources={["catalogue"]}
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
                {QUOTE_LINE_COLUMNS.map((column, index) => (
                  <TableHead
                    key={`${column}-${index}`}
                    className={cn(
                      "whitespace-nowrap",
                      NUMERIC_COLUMNS.has(column) && "text-right",
                    )}
                  >
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemFields.map((field, index) => (
                <PurchaseQuoteLineRow
                  key={field.id}
                  index={index}
                  selected={selectedLine === index}
                  readOnly={readOnly}
                  statusLabel={statusLabel}
                  onSelect={() => setSelectedLine(index)}
                  onPick={() => setPickingLine(index)}
                />
              ))}
              {lineCount === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={QUOTE_LINE_COLUMNS.length}
                    className="text-muted-foreground"
                  >
                    No lines. Press New to add one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </CollapsibleSection>
  );
};
