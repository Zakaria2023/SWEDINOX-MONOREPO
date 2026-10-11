"use client";

import { useState } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { ProductPricingOption } from "@/app/(dashboard)/products/actions";
import { QuoteLineDetail } from "@/app/(dashboard)/quotes/actions";
import { QuoteLineFigures } from "@/app/(dashboard)/quotes/use-quote-submit";
import { QuoteFormValues } from "@/app/(dashboard)/quotes/validation";
import {
  StockSearchChoice,
  StockSearchDialog,
} from "@/components/orders/stock-search-dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { FormError } from "@/components/ui/form-error";
import { orderSourceTypes, stockUnits } from "@/lib/enums";
import {
  cn,
  formatDateColumn,
  formatMoney,
  formatNumber,
  formatPercent,
} from "@/lib/helpers";
import {
  ORDER_LINE_STATUS_LABELS,
  ORDER_SOURCE_TYPE_LABELS,
  PRODUCT_QUALITY_STANDARD_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

// The rest of the reference's line toolbar (#396-398). None of these exist in
// this app yet, so they are shown greyed rather than left out.
const UNBUILT_LINE_ACTIONS = [
  "Cutting specification",
  "Price calculation",
  "Order",
  "New product...",
  "Purchase request",
  "Show order",
  "Counter order",
  "Relocate",
];

// The reference's `Order lines` grid, column for column (order 100742).
const LINE_COLUMNS = [
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

const SOURCE_TYPE_OPTIONS = orderSourceTypes.map((type) => ({
  value: type,
  label: ORDER_SOURCE_TYPE_LABELS[type],
}));

const UNIT_OPTIONS = stockUnits.map((unit) => ({
  value: unit,
  label: STOCK_UNIT_LABELS[unit],
}));

type Props = {
  products: ProductPricingOption[];
  /** What each line reports, saved or previewed — see `useQuoteSubmit`. */
  lineFigures: QuoteLineFigures[];
  /** The saved quote's lines, for their status and product details. */
  savedItems: QuoteLineDetail[];
  selectedLine: number | null;
  onSelectLine: (index: number | null) => void;
  readOnly: boolean;
};

/** A picked article as the grid names it, before the line is saved. */
type PickedProduct = {
  code: string | null;
  name: string | null;
  category: string | null;
  quality: string | null;
};

/**
 * The quote's lines, as the reference types them: `New` adds a blank line —
 * the next code in tens, `Qty(p)` 0 — and its Product `…` opens the `Stock`
 * window, where a selling document searches what is on the shelf. Nothing is
 * priced here: the server prices every line against the price list and the
 * customer's contract on Save, and the grid previews it at list price.
 */
export const QuoteLines = ({
  products,
  lineFigures,
  savedItems,
  selectedLine,
  onSelectLine,
  readOnly,
}: Props) => {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<QuoteFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const [items, deliveryDate, customerRef] = useWatch({
    control,
    name: ["items", "deliveryDate", "customerRef"],
  });
  // The line whose `…` opened the stock window, or null when it is shut.
  const [pickingLine, setPickingLine] = useState<number | null>(null);
  // Articles picked in the stock window, by product, so a line names them even
  // when they are outside the priced product list.
  const [picked, setPicked] = useState<Record<string, PickedProduct>>(() =>
    Object.fromEntries(
      savedItems
        .filter((item) => item.productUuid)
        .map((item) => [
          item.productUuid ?? "",
          {
            code: item.productCode,
            name: item.productName,
            category: item.productGroupName,
            quality: item.qualityStandard
              ? PRODUCT_QUALITY_STANDARD_LABELS[item.qualityStandard]
              : null,
          },
        ]),
    ),
  );

  const describe = (productUuid: string): PickedProduct => {
    const product = products.find((p) => p.uuid === productUuid);
    const known = picked[productUuid];
    return {
      code: product?.productCode ?? known?.code ?? null,
      name: product?.name ?? known?.name ?? null,
      category: product?.productGroupName ?? known?.category ?? null,
      quality: product?.qualityStandard
        ? PRODUCT_QUALITY_STANDARD_LABELS[product.qualityStandard]
        : (known?.quality ?? null),
    };
  };

  const addBlankLine = () => {
    append({
      productUuid: "",
      quantity: "0",
      unit: "st",
      lengthMm: "",
      widthMm: "",
      thicknessMm: "",
      options: "",
      sourceType: "stock",
    });
    onSelectLine(fields.length);
  };

  const deleteSelectedLine = () => {
    if (selectedLine === null) {
      return;
    }
    remove(selectedLine);
    onSelectLine(null);
  };

  // The stock window hands back a lot, or an article and its fullest lot. A
  // quote reserves nothing, so the line takes the article and the lot's
  // dimensions; stock is allocated when the quote becomes an order.
  const chooseProduct = (index: number, choice: StockSearchChoice) => {
    const article =
      choice.kind === "lot" ? choice.lot : (choice.lot ?? choice.variant);
    const unit = stockUnits.find(
      (candidate) =>
        candidate === (article.articleUnit ?? article.unit ?? "").toLowerCase(),
    );
    setPicked((current) => ({
      ...current,
      [article.productUuid]: {
        code: article.productCode,
        name: article.productName,
        category: null,
        quality: article.quality,
      },
    }));
    setValue(`items.${index}.productUuid`, article.productUuid, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(
      `items.${index}.lengthMm`,
      article.lengthMm ? String(article.lengthMm) : "",
      { shouldDirty: true },
    );
    setValue(
      `items.${index}.widthMm`,
      article.widthMm ? String(article.widthMm) : "",
      { shouldDirty: true },
    );
    setValue(`items.${index}.thicknessMm`, article.thicknessMm ?? "", {
      shouldDirty: true,
    });
    if (unit) {
      setValue(`items.${index}.unit`, unit, { shouldDirty: true });
    }
  };

  const lineErrors = fields.flatMap((_, index) =>
    [
      errors.items?.[index]?.productUuid?.message,
      errors.items?.[index]?.quantity?.message,
    ]
      .filter(Boolean)
      .map((message) => `Line ${(index + 1) * 10}: ${message}`),
  );

  return (
    <div className="space-y-2 p-3">
      {/* The reference's line toolbar: it acts on the selected line, never a
          button per row. `New` greys until the blank line has a product. */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addBlankLine}
          disabled={
            readOnly || (items ?? []).some((item) => !item.productUuid)
          }
        >
          <Plus className="me-1.5 size-4" />
          New
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={deleteSelectedLine}
          disabled={readOnly || selectedLine === null}
        >
          <X className="me-1.5 size-4" />
          Delete
        </Button>
        {UNBUILT_LINE_ACTIONS.map((label) => (
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
        open={pickingLine !== null}
        sources={["stock"]}
        onOpenChange={(open) => {
          if (!open) {
            setPickingLine(null);
          }
        }}
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
              {LINE_COLUMNS.map((column, index) => (
                <TableHead
                  key={`${column}-${index}`}
                  className="whitespace-nowrap"
                >
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={LINE_COLUMNS.length}
                  className="text-muted-foreground"
                >
                  No lines.
                </TableCell>
              </TableRow>
            ) : (
              fields.map((field, index) => {
                const line = items?.[index] ?? field;
                const figures = lineFigures[index];
                const product = describe(line.productUuid);
                const saved = figures?.saved ? savedItems[index] : undefined;

                return (
                  <TableRow
                    key={field.id}
                    onClick={() => onSelectLine(index)}
                    aria-selected={index === selectedLine}
                    className={cn(
                      "cursor-pointer",
                      index === selectedLine && "bg-accent",
                    )}
                  >
                    <TableCell className="text-right tabular-nums">
                      {(index + 1) * 10}
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <Controller
                        control={control}
                        name={`items.${index}.sourceType`}
                        render={({ field: typeField }) => (
                          <Select
                            className="w-28"
                            options={SOURCE_TYPE_OPTIONS}
                            value={typeField.value ?? "stock"}
                            onValueChange={typeField.onChange}
                            disabled={readOnly}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateColumn(
                        saved?.deliveryDate ?? (deliveryDate || null),
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {saved?.status
                        ? ORDER_LINE_STATUS_LABELS[saved.status]
                        : "Provisional"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span>{product.code ?? ""}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          aria-label="Choose the product from stock"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectLine(index);
                            setPickingLine(index);
                          }}
                          disabled={readOnly}
                        >
                          …
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-48">
                      {saved?.description ?? product.name ?? ""}
                    </TableCell>
                    <TableCell>{product.category ?? ""}</TableCell>
                    <TableCell>{product.quality ?? ""}</TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="w-20 text-right"
                        disabled={readOnly}
                        {...register(`items.${index}.quantity`)}
                      />
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <Controller
                        control={control}
                        name={`items.${index}.unit`}
                        render={({ field: unitField }) => (
                          <Select
                            className="w-20"
                            options={UNIT_OPTIONS}
                            value={unitField.value ?? "st"}
                            onValueChange={unitField.onChange}
                            disabled={readOnly}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <Input
                        type="text"
                        inputMode="numeric"
                        className="w-20 text-right"
                        disabled={readOnly}
                        {...register(`items.${index}.lengthMm`)}
                      />
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <Input
                        type="text"
                        inputMode="numeric"
                        className="w-20 text-right"
                        disabled={readOnly}
                        {...register(`items.${index}.widthMm`)}
                      />
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="w-20 text-right"
                        disabled={readOnly}
                        {...register(`items.${index}.thicknessMm`)}
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(figures?.weightKg ?? 0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(figures?.m1PerPiece ?? 0)}
                    </TableCell>
                    {/* No column counts a quote line's bundles yet. */}
                    <TableCell className="text-right text-muted-foreground">
                      —
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(figures?.netPrice ?? 0)}
                    </TableCell>
                    <TableCell>
                      {figures?.priceUnit?.toUpperCase() ?? ""}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(figures?.amount ?? 0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(figures?.purchasePrice ?? 0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(figures?.costAmount ?? 0)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums",
                        figures?.profitTooLow && "text-destructive",
                      )}
                    >
                      {formatPercent(figures?.profitMargin ?? 0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(figures?.profit ?? 0)}
                    </TableCell>
                    <TableCell>{saved?.reference ?? customerRef ?? ""}</TableCell>
                    <TableCell>
                      {figures?.profitTooLow ? (
                        <span className="inline-flex items-center gap-1 text-destructive">
                          <AlertTriangle className="size-3.5" />
                          Yes
                        </span>
                      ) : (
                        <input
                          type="checkbox"
                          checked={false}
                          disabled
                          readOnly
                          aria-label="Profit too low"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {lineFigures.some((figures) => !figures.saved) && (
        <p className="text-xs text-muted-foreground">
          Lines typed or changed since the last save show list prices. The
          customer&apos;s contract prices and discounts are applied when the
          quote is saved, so a saved line can come out lower than shown.
        </p>
      )}
      <FormError>
        {lineErrors.length > 0 ? lineErrors.join(" · ") : undefined}
      </FormError>
    </div>
  );
};
