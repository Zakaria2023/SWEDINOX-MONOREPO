"use client";

import { ProductPricingOption } from "@/app/(dashboard)/products/actions";
import { QuoteFormValues } from "@/app/(dashboard)/quotes/validation";
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
import { FormLabel } from "@/components/ui/form-field";
import { ProductSearchField } from "@/components/ui/product-search-field";
import { stockUnits, OrderSourceType, orderSourceTypes } from "@/lib/enums";
import {
  marginFloorFor,
  formatDateColumn,
  formatMoney,
  formatNumber,
  formatPercent,
  previewQuoteLine,
  productPieceWeightKg,
} from "@/lib/helpers";
import {
  ORDER_SOURCE_TYPE_LABELS,
  PRODUCT_QUALITY_STANDARD_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";
import { AlertTriangle, Plus, X } from "lucide-react";
import { useState } from "react";
import { Control, useFieldArray, useWatch } from "react-hook-form";

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

type Props = {
  control: Control<QuoteFormValues>;
  products: ProductPricingOption[];
};

type Draft = {
  productUuid: string;
  quantity: string;
  unit: string;
  lengthMm: string;
  widthMm: string;
  thicknessMm: string;
  options: string;
  sourceType: OrderSourceType;
};

const EMPTY_DRAFT: Draft = {
  productUuid: "",
  quantity: "1",
  unit: "st",
  lengthMm: "",
  widthMm: "",
  thicknessMm: "",
  options: "",
  sourceType: "stock",
};

const sourceTypeOptions = orderSourceTypes.map((type) => ({
  value: type,
  label: ORDER_SOURCE_TYPE_LABELS[type],
}));

const unitOptions = stockUnits.map((unit) => ({
  value: unit,
  label: STOCK_UNIT_LABELS[unit],
}));

export const QuoteLinesEditor = ({ control, products }: Props) => {
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  // A line takes the header's delivery date and customer reference when it is
  // saved, so the grid shows those until then.
  const [deliveryDate, customerRef] = useWatch({
    control,
    name: ["deliveryDate", "customerRef"],
  });

  const deleteSelectedLine = () => {
    if (selectedIndex === null) {
      return;
    }
    remove(selectedIndex);
    setSelectedIndex(null);
  };

  const addLine = () => {
    if (!draft.productUuid) {
      setError("Pick a product first.");
      return;
    }
    if (!(Number(draft.quantity) > 0)) {
      setError("Quantity must be greater than 0.");
      return;
    }
    setError(null);
    append({
      productUuid: draft.productUuid,
      quantity: draft.quantity,
      unit: draft.unit as (typeof stockUnits)[number],
      lengthMm: draft.lengthMm,
      widthMm: draft.widthMm,
      thicknessMm: draft.thicknessMm,
      options: draft.options,
      sourceType: draft.sourceType,
    });
    setDraft(EMPTY_DRAFT);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between border-b pb-2">
        <h2 className="text-base font-semibold">Quote lines</h2>
        <span className="text-xs text-muted-foreground">
          {fields.length} {fields.length === 1 ? "line" : "lines"}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Prices below are calculated from the product price list. The contract&apos;s
        agreed net price and discounts are applied when you save, so the saved
        line can come out lower than shown here.
      </p>

      <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/20 p-4 lg:grid-cols-7">
        <div className="col-span-2 lg:col-span-2">
          <FormLabel htmlFor="line-product">Product</FormLabel>
          {/* A selling document searches the shelf, and may bind the line to
              a parcel — which is why lots stay on offer here. */}
          <ProductSearchField
            id="line-product"
            value={draft.productUuid}
            sources={["stock", "purchase"]}
            onChange={(choice) =>
              setDraft((d) => ({ ...d, productUuid: choice.productUuid }))
            }
          />
        </div>
        <div>
          <FormLabel htmlFor="line-quantity">Qty</FormLabel>
          <Input
            id="line-quantity"
            type="number"
            min={0}
            step="0.001"
            value={draft.quantity}
            onChange={(e) =>
              setDraft((d) => ({ ...d, quantity: e.target.value }))
            }
          />
        </div>
        {/* The reference's line `Type`. It picks the margin floor the line
            is held to — stock, cross-dock or ex works. */}
        <div>
          <FormLabel htmlFor="line-type">Type</FormLabel>
          <Select
            id="line-type"
            options={sourceTypeOptions}
            value={draft.sourceType}
            onValueChange={(value) =>
              setDraft((d) => ({ ...d, sourceType: value as OrderSourceType }))
            }
          />
        </div>
        <div>
          <FormLabel htmlFor="line-unit">Unit</FormLabel>
          <Select
            id="line-unit"
            options={unitOptions}
            value={draft.unit}
            onValueChange={(value) => setDraft((d) => ({ ...d, unit: value }))}
          />
        </div>
        <div>
          <FormLabel htmlFor="line-length">Length (mm)</FormLabel>
          <Input
            id="line-length"
            type="number"
            value={draft.lengthMm}
            onChange={(e) =>
              setDraft((d) => ({ ...d, lengthMm: e.target.value }))
            }
          />
        </div>
        <div>
          <FormLabel htmlFor="line-width">Width (mm)</FormLabel>
          <Input
            id="line-width"
            type="number"
            value={draft.widthMm}
            onChange={(e) =>
              setDraft((d) => ({ ...d, widthMm: e.target.value }))
            }
          />
        </div>
        <div>
          <FormLabel htmlFor="line-thickness">Thickness (mm)</FormLabel>
          <Input
            id="line-thickness"
            type="number"
            step="0.01"
            value={draft.thicknessMm}
            onChange={(e) =>
              setDraft((d) => ({ ...d, thicknessMm: e.target.value }))
            }
          />
        </div>
        <div className="col-span-2 lg:col-span-6">
          <FormLabel htmlFor="line-options">Options</FormLabel>
          <Input
            id="line-options"
            value={draft.options}
            onChange={(e) =>
              setDraft((d) => ({ ...d, options: e.target.value }))
            }
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* The reference's line toolbar: it acts on the selected line, never a
          button per row (#396-398). */}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={addLine}>
          <Plus className="mr-1.5 size-4" />
          New
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={deleteSelectedLine}
          disabled={selectedIndex === null}
        >
          <X className="mr-1.5 size-4 text-destructive" />
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

      {fields.length > 0 && (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Delivery date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead className="text-right">Qty(p)</TableHead>
                <TableHead>U</TableHead>
                <TableHead className="text-right">Length</TableHead>
                <TableHead className="text-right">Thickness</TableHead>
                <TableHead className="text-right">Kg(p)</TableHead>
                <TableHead className="text-right">M1(p)</TableHead>
                <TableHead className="text-right">Net Price</TableHead>
                <TableHead>U</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Purchase pr.</TableHead>
                <TableHead className="text-right">Costs</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Profit amount</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Profit too low</TableHead>
                <TableHead className="text-right">Width</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => {
                const product = products.find(
                  (p) => p.uuid === field.productUuid,
                );
                const line = previewQuoteLine({
                  quantity: Number(field.quantity),
                  lengthMm: field.lengthMm ? Number(field.lengthMm) : null,
                  basePrice: Number(product?.basePrice ?? 0),
                  replacementPrice: Number(product?.replacementPrice ?? 0),
                  purchasePrice: Number(product?.averagePurchasePrice ?? 0),
                  // The catalogue column is a density when the weight unit says
                  // M3, so it is read through the helper that checks the unit.
                  theoreticalWeight:
                    productPieceWeightKg({
                      weightTheoretical: product?.weightTheoretical,
                      theoreticalWeight: product?.theoreticalWeight,
                      weightUnit: product?.weightUnit,
                      lengthMm: Number(product?.length ?? 0),
                      widthMm: Number(product?.widthDiameter ?? 0),
                      thicknessMm: Number(product?.thickness ?? 0),
                    }) ?? 0,
                  priceUnit: product?.priceUnit,
                  widthMm: Number(product?.widthDiameter ?? 0),
                  thicknessMm: Number(product?.thickness ?? 0),
                  productLengthMm: Number(product?.length ?? 0),
                  minProfitMargin: marginFloorFor(
                    product,
                    field.sourceType ?? "stock",
                  ),
                });

                return (
                  <TableRow
                    key={field.id}
                    data-state={
                      selectedIndex === index ? "selected" : undefined
                    }
                    aria-selected={selectedIndex === index}
                    className="cursor-pointer"
                    onClick={() => setSelectedIndex(index)}
                  >
                    <TableCell className="font-medium">
                      {product?.productCode ?? "—"}
                    </TableCell>
                    <TableCell>
                      {ORDER_SOURCE_TYPE_LABELS[field.sourceType ?? "stock"]}
                    </TableCell>
                    <TableCell>
                      {formatDateColumn(deliveryDate || null)}
                    </TableCell>
                    {/* A line has no status until it is saved. */}
                    <TableCell>—</TableCell>
                    <TableCell>{product?.name ?? "—"}</TableCell>
                    <TableCell>{product?.name ?? "—"}</TableCell>
                    <TableCell>{product?.productGroupName ?? "—"}</TableCell>
                    <TableCell>
                      {product?.qualityStandard
                        ? PRODUCT_QUALITY_STANDARD_LABELS[
                            product.qualityStandard
                          ]
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(field.quantity))}
                    </TableCell>
                    <TableCell>{field.unit?.toUpperCase() ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {field.lengthMm || "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {field.thicknessMm || "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(line.weightKg)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(line.m1PerPiece)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(line.netPrice)}
                    </TableCell>
                    <TableCell>
                      {product?.priceUnit?.toUpperCase() ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(line.amount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(line.purchasePrice)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(line.costAmount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span
                        className={
                          line.profitTooLow ? "text-destructive" : undefined
                        }
                      >
                        {formatPercent(line.profitMargin)}
                      </span>
                      {line.profitTooLow && (
                        <AlertTriangle
                          className="ml-1 inline size-3.5 text-destructive"
                          aria-label="Profit too low"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(line.profit)}
                    </TableCell>
                    <TableCell>{customerRef || "—"}</TableCell>
                    <TableCell>
                      {line.profitTooLow ? (
                        <span className="inline-flex items-center gap-1 text-destructive">
                          <AlertTriangle className="size-3.5" />
                          Yes
                        </span>
                      ) : (
                        "No"
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {field.widthMm || "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
};
