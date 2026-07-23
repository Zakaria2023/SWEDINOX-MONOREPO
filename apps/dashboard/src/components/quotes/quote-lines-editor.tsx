"use client";

import { ProductOption } from "@/app/(dashboard)/products/actions";
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
import { STOCK_UNIT_LABELS } from "@/lib/labels";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Control, useFieldArray } from "react-hook-form";

type Props = {
  control: Control<QuoteFormValues>;
  products: ProductOption[];
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

export const QuoteLinesEditor = ({ control, products }: Props) => {
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

  const productName = (uuid: string) => {
    const product = products.find((p) => p.uuid === uuid);
    return product ? `${product.productCode} — ${product.name}` : uuid;
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
    });
    setDraft(EMPTY_DRAFT);
  };

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Lines</h2>
      <p className="text-xs text-muted-foreground">
        Prices are calculated when you save, from the product price list and the
        customer&apos;s contract (agreed net price, otherwise base price less the
        contract&apos;s discounts).
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
          <FormLabel htmlFor="line-quantity">Quantity</FormLabel>
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
          <FormLabel htmlFor="line-thickness">Thick. (mm)</FormLabel>
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
            Add line
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {fields.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Length</TableHead>
                <TableHead className="text-right">Width</TableHead>
                <TableHead className="text-right">Thick.</TableHead>
                <TableHead>Options</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell className="text-right">{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {productName(field.productUuid)}
                  </TableCell>
                  <TableCell className="text-right">{field.quantity}</TableCell>
                  <TableCell>{field.unit?.toUpperCase() ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {field.lengthMm || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {field.widthMm || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {field.thicknessMm || "—"}
                  </TableCell>
                  <TableCell>{field.options || "—"}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      aria-label={`Remove line ${index + 1}`}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
};
