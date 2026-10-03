"use client";

import {
  Controller,
  useFormContext,
  useWatch,
  type FieldArrayWithId,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
} from "react-hook-form";
import { PurchaseOrderFormValues } from "@/app/(dashboard)/purchase-orders/validation";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { ProductSearchField } from "@/components/ui/product-search-field";
import { purchasingUnits } from "@/lib/enums";
import {
  amountForWeight,
  enumOptions,
  formatMoney,
  formatNumber,
  runningMeters,
} from "@/lib/helpers";
import { PURCHASING_UNIT_LABELS } from "@/lib/labels";
import { Plus, X } from "lucide-react";

const priceUnitOptions = enumOptions(purchasingUnits, PURCHASING_UNIT_LABELS);

const EMPTY_ITEM = {
  productUuid: "",
  quantity: "",
  netPrice: "",
  priceUnit: "",
  productLabel: "",
  qualityCode: "",
  lengthMm: "",
  widthMm: "",
  thicknessMm: "",
  pieceWeightKg: "",
};

type Props = {
  itemFields: FieldArrayWithId<PurchaseOrderFormValues, "items", "id">[];
  appendItem: UseFieldArrayAppend<PurchaseOrderFormValues, "items">;
  removeItem: UseFieldArrayRemove;
};

type LineProps = {
  index: number;
  onRemove: () => void;
};

/**
 * One line of the order, carrying the columns the reference's own line grid
 * carries: `Quality` · `Length` · `Width` · `Thickness` · `Qty(p)` · `Kg(p)` ·
 * `M1(p)` · `Net Price` · `U`.
 *
 * 🔑 `Kg(p)`, `M1(p)` and the amount are **computed here and shown as you
 * type**, never typed. That is what the reference does — its `Net Price` is a
 * result rather than something anyone enters — and it is the only way a buyer
 * can tell a € 606,02 line from a € 0,00 one before saving it.
 */
const PurchaseOrderLine = ({ index, onRemove }: LineProps) => {
  const {
    control,
    register,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<PurchaseOrderFormValues>();

  const line = useWatch({ control, name: `items.${index}` });
  const lineErrors = errors.items?.[index];

  const quantity = Number(line?.quantity ?? 0);
  const pieceWeightKg = Number(line?.pieceWeightKg ?? 0);
  const netPrice = Number(line?.netPrice ?? 0);
  const lengthMm = Number(line?.lengthMm ?? 0);

  const weightKg = pieceWeightKg > 0 ? pieceWeightKg * quantity : 0;
  // A purchase line is counted in pieces; `M1` is what those pieces measure end
  // to end. 54 pieces of 2 000 mm is 108 m, exactly as the reference prints it.
  const metres = runningMeters({
    quantity,
    unit: "st",
    lengthMm: lengthMm > 0 ? lengthMm : null,
  });
  const amount =
    quantity > 0 && netPrice > 0
      ? amountForWeight(netPrice, line?.priceUnit ?? null, weightKg, {
          quantity,
        })
      : 0;

  // An article nobody has given dimensions to cannot be weighed, and a line
  // priced per tonne against it bills nothing. Saying so here is the difference
  // between a buyer noticing and an invoice noticing.
  const unweighable = !!line?.productUuid && pieceWeightKg <= 0;

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="grid grid-cols-[1fr_120px_32px] items-start gap-3">
        <div>
          <FormLabel htmlFor={`items.${index}.productUuid`} required>
            Product
          </FormLabel>
          {/* 🔴 The stock search dialog, never a dropdown — and it searches the
              whole catalogue, because the point of raising a purchase order is
              that the metal is not on the shelf. Scoping this to the supplier's
              own products offered one article out of 5 626. */}
          <Controller
            control={control}
            name={`items.${index}.productUuid`}
            render={({ field: productField }) => (
              <ProductSearchField
                id={`items.${index}.productUuid`}
                value={productField.value || ""}
                initialLabel={getValues(`items.${index}.productLabel`)}
                sources={["catalogue", "purchase"]}
                invalid={!!lineErrors?.productUuid}
                onChange={(choice) => {
                  productField.onChange(choice.productUuid);
                  // The article's own measurements travel onto the line, so the
                  // receival behind it can check what arrives against what was
                  // ordered — and so the buyer can see them.
                  setValue(
                    `items.${index}.productLabel`,
                    [choice.productCode, choice.productName]
                      .filter(Boolean)
                      .join(" — "),
                  );
                  setValue(`items.${index}.qualityCode`, choice.quality ?? "");
                  setValue(
                    `items.${index}.lengthMm`,
                    choice.lengthMm === null ? "" : String(choice.lengthMm),
                  );
                  setValue(
                    `items.${index}.widthMm`,
                    choice.widthMm === null ? "" : String(choice.widthMm),
                  );
                  setValue(
                    `items.${index}.thicknessMm`,
                    choice.thicknessMm ?? "",
                  );
                  setValue(
                    `items.${index}.pieceWeightKg`,
                    choice.pieceWeightKg === null
                      ? ""
                      : String(choice.pieceWeightKg),
                  );
                  // Steel is bought by the tonne, and the article says so
                  // itself. Leaving `Per` empty for somebody to guess at is how
                  // a line gets priced per piece by accident.
                  if (!getValues(`items.${index}.priceUnit`)) {
                    setValue(
                      `items.${index}.priceUnit`,
                      choice.purchasingUnit ?? "TN",
                    );
                  }
                }}
              />
            )}
          />
          <FormFieldError message={lineErrors?.productUuid?.message} />
        </div>

        <div>
          <FormLabel htmlFor={`items.${index}.qualityCode`}>Quality</FormLabel>
          <Input
            id={`items.${index}.qualityCode`}
            {...register(`items.${index}.qualityCode`)}
          />
        </div>

        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove line"
          className="mt-6 flex size-8 items-center justify-center text-muted-foreground hover:text-destructive"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <div>
          <FormLabel htmlFor={`items.${index}.lengthMm`}>Length (mm)</FormLabel>
          <Input
            id={`items.${index}.lengthMm`}
            type="number"
            min="0"
            {...register(`items.${index}.lengthMm`)}
          />
        </div>
        <div>
          <FormLabel htmlFor={`items.${index}.widthMm`}>Width (mm)</FormLabel>
          <Input
            id={`items.${index}.widthMm`}
            type="number"
            min="0"
            {...register(`items.${index}.widthMm`)}
          />
        </div>
        <div>
          <FormLabel htmlFor={`items.${index}.thicknessMm`}>
            Thickness (mm)
          </FormLabel>
          <Input
            id={`items.${index}.thicknessMm`}
            type="number"
            step="0.01"
            min="0"
            {...register(`items.${index}.thicknessMm`)}
          />
        </div>

        <div>
          <FormLabel htmlFor={`items.${index}.quantity`} required>
            Qty (p)
          </FormLabel>
          <Input
            id={`items.${index}.quantity`}
            type="number"
            step="0.001"
            min="0"
            {...register(`items.${index}.quantity`)}
          />
          <FormFieldError message={lineErrors?.quantity?.message} />
        </div>

        {/* The lot received against this line is valued at this price, so it
            decides the margin of every sales order drawn from it. */}
        <div>
          <FormLabel htmlFor={`items.${index}.netPrice`} required>
            Purchase price
          </FormLabel>
          <Input
            id={`items.${index}.netPrice`}
            type="number"
            step="0.0001"
            min="0"
            {...register(`items.${index}.netPrice`)}
          />
          <FormFieldError message={lineErrors?.netPrice?.message} />
        </div>

        <div>
          <FormLabel htmlFor={`items.${index}.priceUnit`}>Per</FormLabel>
          <Controller
            control={control}
            name={`items.${index}.priceUnit`}
            render={({ field: unitField }) => (
              <Select
                id={`items.${index}.priceUnit`}
                value={unitField.value || ""}
                options={priceUnitOptions}
                onValueChange={unitField.onChange}
              />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t pt-3 text-sm">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Kg (p)
          </p>
          <p className="tabular-nums">
            {weightKg > 0 ? formatNumber(weightKg) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            M1 (p)
          </p>
          <p className="tabular-nums">
            {metres > 0 ? formatNumber(metres) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Amount
          </p>
          <p className="tabular-nums">
            {amount > 0 ? formatMoney(amount) : "—"}
          </p>
        </div>
      </div>

      {unweighable && (
        <p className="text-sm text-destructive">
          This article has no dimensions or density on its product record, so it
          cannot be weighed — a price per tonne or per kilo against it comes to
          € 0,00. Give the product its dimensions, or price this line per piece.
        </p>
      )}
    </div>
  );
};

export const PurchaseOrderItemsSection = ({
  itemFields,
  appendItem,
  removeItem,
}: Props) => {
  const {
    formState: { errors },
  } = useFormContext<PurchaseOrderFormValues>();

  return (
    <section className="space-y-4">
      <div className="border-b pb-2">
        <h2 className="text-base font-semibold">Lines</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick an article and it brings its quality and dimensions with it. Kg,
          M1 and the amount are worked out from them — a price per tonne is
          charged on the weight, never on the piece count.
        </p>
      </div>

      {errors.items?.root && (
        <FormFieldError message={errors.items.root.message} />
      )}

      <div className="space-y-3">
        {itemFields.map((field, index) => (
          <PurchaseOrderLine
            key={field.id}
            index={index}
            onRemove={() => removeItem(index)}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => appendItem(EMPTY_ITEM)}
      >
        <Plus className="mr-1 size-3.5" /> Add line
      </Button>
    </section>
  );
};
