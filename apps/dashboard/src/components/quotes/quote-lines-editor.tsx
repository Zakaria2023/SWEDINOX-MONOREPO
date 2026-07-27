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
import { stockUnits } from "@/lib/enums";
import {
  formatMoney,
  formatNumber,
  formatPercent,
  previewQuoteLine,
} from "@/lib/helpers";
import { PRODUCT_QUALITY_STANDARD_LABELS, STOCK_UNIT_LABELS } from "@/lib/labels";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Control, useFieldArray } from "react-hook-form";

type Props = {
  control: Control<QuoteFormValues>;
  products: ProductPricingOption[];
  /** Ex-works quotes are held to the ex-works margin floor. */
  isPickup: boolean;
};

type Draft = {
  productUuid: string;
  quantity: string;
  unit: string;
  lengthMm: string;
  widthMm: string;
  thicknessMm: string;
  options: string;
};

const EMPTY_DRAFT: Draft = {
  productUuid: "",
  quantity: "1",
  unit: "st",
  lengthMm: "",
  widthMm: "",
  thicknessMm: "",
  options: "",
};

const unitOptions = stockUnits.map((unit) => ({
  value: unit,
  label: STOCK_UNIT_LABELS[unit],
}));

export const QuoteLinesEditor = ({ control, products, isPickup }: Props) => {
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);

  const productOptions = [
    { value: "", label: "Select a product" },
    ...products.map((product) => ({
      value: product.uuid,
      label: `${product.productCode} — ${product.name}`,
    })),
  ];

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
          <Select
            id="line-product"
            options={productOptions}
            value={draft.productUuid}
            onValueChange={(value) =>
              setDraft((d) => ({ ...d, productUuid: value }))
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
        <div className="flex items-end">
          <Button type="button" onClick={addLine} className="w-full">
            <Plus className="mr-1.5 size-4" />
            New
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {fields.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead className="text-right">Qty(p)</TableHead>
                <TableHead>U</TableHead>
                <TableHead className="text-right">Length</TableHead>
                <TableHead className="text-right">Thickness</TableHead>
                <TableHead className="text-right">Kg(p)</TableHead>
                <TableHead className="text-right">M1(p)</TableHead>
                <TableHead className="text-right">Net Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Purchase pr.</TableHead>
                <TableHead className="text-right">Costs</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Profit amount</TableHead>
                <TableHead />
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
                  theoreticalWeight: Number(product?.theoreticalWeight ?? 0),
                  productLengthMm: Number(product?.length ?? 0),
                  minProfitMargin: Number(
                    (isPickup
                      ? product?.minProfitMarginExWorks
                      : product?.minProfitMarginStock) ?? 0,
                  ),
                });

                return (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">
                      {product?.productCode ?? "—"}
                    </TableCell>
                    <TableCell>Material</TableCell>
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
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        aria-label={`Delete line ${index + 1}`}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
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
