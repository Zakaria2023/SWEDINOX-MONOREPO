"use client";

import {
  Controller,
  useFormContext,
  useWatch,
  type FieldArrayWithId,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
} from "react-hook-form";
import { PurchaseInvoiceFormValues } from "@/app/(dashboard)/purchase-invoices/validation";
import { ReceivablePurchaseOrderItem } from "@/app/(dashboard)/purchase-orders/actions";
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
import { FormFieldError } from "@/components/ui/form-field";
import {
  amountForWeight,
  formatDateColumn,
  formatLengthMm,
  formatMoney,
  formatNumber,
  orDash,
} from "@/lib/helpers";
import { VAT_CODE_LABELS } from "@/lib/labels";
import { Plus, X } from "lucide-react";

type Props = {
  receivableItems: ReceivablePurchaseOrderItem[];
  itemFields: FieldArrayWithId<PurchaseInvoiceFormValues, "items", "id">[];
  appendItem: UseFieldArrayAppend<PurchaseInvoiceFormValues, "items">;
  removeItem: UseFieldArrayRemove;
  isPending: boolean;
};

type LineProps = {
  index: number;
  receivableItems: ReceivablePurchaseOrderItem[];
  onRemove: () => void;
  isPending: boolean;
};

/**
 * One row of the reference's invoice `Lines` grid.
 *
 * Columns there: `Booked` ☑ · `Item` · `Purchase order` · `Product` · `Qty` ·
 * `U` · `Kg` · `Length` · `U` · `Price` · **`Per`** · `Material` · `Options` ·
 * `Total` · `VAT rate` · `Delivery date`.
 *
 * 🔑 **`Material` = price × weight, in the unit `Per` names.** Proved to the
 * cent on the reference's own invoice: `2800 × 0,800 = 2 240,00`,
 * `4350 × 0,576 = 2 505,60`, `2800 × 1,120 = 3 136,00` — and the three summed
 * to the header's `Invoice total` of 7 881,60 exactly. `Per` is a column of its
 * own, the third independent sighting of the same idea after `Net Price / TN`
 * on the order and `Price quantity (in gross price U.)` on receivals.
 *
 * Everything but the quantity is read off the purchase line. A clerk types what
 * the supplier billed; the money is worked out, never keyed.
 */
const PurchaseInvoiceLine = ({
  index,
  receivableItems,
  onRemove,
  isPending,
}: LineProps) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<PurchaseInvoiceFormValues>();

  const line = useWatch({ control, name: `items.${index}` });
  const lineErrors = errors.items?.[index];

  const source =
    receivableItems.find(
      (item) => item.uuid === line?.purchaseOrderItemUuid,
    ) ?? null;

  const orderLineOptions = [
    { value: "", label: "— Select —" },
    ...receivableItems.map((item) => ({
      value: item.uuid,
      label: `${item.purchaseOrderId ?? "?"} / ${item.lineNumber === null ? "?" : item.lineNumber * 10} · ${[item.productCode, item.productName].filter(Boolean).join(" — ")}`,
    })),
  ];

  const quantity = Number(line?.quantity ?? 0);
  const orderedQty = Number(source?.orderedQuantity ?? 0);
  // The line's weight shared out over the quantity being billed: invoicing half
  // a line bills half its kilos.
  const kg =
    source && orderedQty > 0
      ? (Number(source.kgBilling ?? 0) * quantity) / orderedQty
      : 0;
  const price = Number(source?.netPrice ?? 0);
  const material =
    source && quantity > 0
      ? amountForWeight(price, source.priceUnit, kg, {
          quantity,
          lengthMm: source.lengthMm,
          widthMm: source.widthMm,
          thicknessMm: Number(source.thicknessMm ?? 0),
        })
      : 0;

  return (
    <TableRow>
      <TableCell className="min-w-64">
        <Controller
          control={control}
          name={`items.${index}.purchaseOrderItemUuid`}
          render={({ field: orderLineField }) => (
            <Select
              id={`items.${index}.purchaseOrderItemUuid`}
              value={orderLineField.value || ""}
              options={orderLineOptions}
              onValueChange={orderLineField.onChange}
              invalid={!!lineErrors?.purchaseOrderItemUuid}
              disabled={isPending}
            />
          )}
        />
        <FormFieldError message={lineErrors?.purchaseOrderItemUuid?.message} />
      </TableCell>

      <TableCell>{orDash(source?.productCode ?? null)}</TableCell>

      <TableCell className="w-28">
        <Input
          id={`items.${index}.quantity`}
          type="number"
          step="0.001"
          min="0"
          className="text-right"
          {...register(`items.${index}.quantity`)}
          disabled={isPending}
        />
        <FormFieldError message={lineErrors?.quantity?.message} />
      </TableCell>

      <TableCell>{orDash(source?.unit ? source.unit.toUpperCase() : null)}</TableCell>

      <TableCell className="text-right tabular-nums">
        {kg > 0 ? formatNumber(kg) : "—"}
      </TableCell>

      <TableCell className="text-right tabular-nums">
        {formatLengthMm(source?.lengthMm)}
      </TableCell>

      <TableCell className="text-right tabular-nums">
        {source ? formatMoney(price) : "—"}
      </TableCell>

      {/* The price basis, as a column of its own — the reference keeps it here
          rather than folding it into the price. */}
      <TableCell>{orDash(source?.priceUnit ?? null)}</TableCell>

      <TableCell className="text-right font-medium tabular-nums">
        {material > 0 ? formatMoney(material) : "—"}
      </TableCell>

      <TableCell>{orDash(source?.options ?? null)}</TableCell>

      <TableCell>
        {source?.vatCode ? VAT_CODE_LABELS[source.vatCode] : "—"}
      </TableCell>

      <TableCell className="whitespace-nowrap">
        {source?.receiptDate ? formatDateColumn(source.receiptDate) : "—"}
      </TableCell>

      <TableCell>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove line"
          className="flex size-8 items-center justify-center text-muted-foreground hover:text-destructive"
          disabled={isPending}
        >
          <X className="size-4" />
        </button>
      </TableCell>
    </TableRow>
  );
};

export const PurchaseInvoiceItemsSection = ({
  receivableItems,
  itemFields,
  appendItem,
  removeItem,
  isPending,
}: Props) => {
  const { control } = useFormContext<PurchaseInvoiceFormValues>();
  const items = useWatch({ control, name: "items" });

  if (receivableItems.length === 0) {
    return null;
  }

  // The header's `Materials` is this sum, which is why no clerk ever types it.
  const materials = (items ?? []).reduce((total, line) => {
    const source = receivableItems.find(
      (item) => item.uuid === line?.purchaseOrderItemUuid,
    );
    if (!source) {
      return total;
    }
    const quantity = Number(line?.quantity ?? 0);
    const orderedQty = Number(source.orderedQuantity ?? 0);
    const kg =
      orderedQty > 0
        ? (Number(source.kgBilling ?? 0) * quantity) / orderedQty
        : 0;
    return (
      total +
      (quantity > 0
        ? amountForWeight(Number(source.netPrice ?? 0), source.priceUnit, kg, {
            quantity,
            lengthMm: source.lengthMm,
            widthMm: source.widthMm,
            thicknessMm: Number(source.thicknessMm ?? 0),
          })
        : 0)
    );
  }, 0);

  return (
    <div className="space-y-4 lg:col-span-3">
      <div className="border-b pb-2">
        <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">
          Lines
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick the purchase line this invoice is billing. Everything but the
          quantity comes off that line — Material is price × weight in the unit
          Per names, never a figure anybody keys.
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Purchase order / line</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>U</TableHead>
              <TableHead className="text-right">Kg</TableHead>
              <TableHead className="text-right">Length</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Per</TableHead>
              <TableHead className="text-right">Material</TableHead>
              <TableHead>Options</TableHead>
              <TableHead>VAT rate</TableHead>
              <TableHead>Delivery date</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemFields.map((field, index) => (
              <PurchaseInvoiceLine
                key={field.id}
                index={index}
                receivableItems={receivableItems}
                onRemove={() => removeItem(index)}
                isPending={isPending}
              />
            ))}
            <TableRow>
              <TableCell colSpan={8} className="text-right font-medium">
                Materials
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatMoney(materials)}
              </TableCell>
              <TableCell colSpan={4} />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => appendItem({ purchaseOrderItemUuid: "", quantity: "" })}
        disabled={isPending}
      >
        <Plus className="mr-1 size-3.5" /> Add line
      </Button>
    </div>
  );
};
