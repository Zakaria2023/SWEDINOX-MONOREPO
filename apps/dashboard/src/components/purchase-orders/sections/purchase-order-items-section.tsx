"use client";

import { useState } from "react";
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
import { Select, SelectOption } from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { FormFieldError } from "@/components/ui/form-field";
import { ProductSearchField } from "@/components/ui/product-search-field";
import {
  featuresQualities,
  purchaseSourceTypes,
  purchasingUnits,
} from "@/lib/enums";
import {
  amountForWeight,
  cn,
  enumOptions,
  formatDateValue,
  formatMoney,
  formatNumber,
  runningMeters,
} from "@/lib/helpers";
import {
  FEATURES_QUALITY_LABELS,
  ORDER_SOURCE_TYPE_LABELS,
} from "@/lib/labels";
import { BellRing, Calculator, Plus, Scissors, X } from "lucide-react";

// The reference's `U` column prints the code — `TN`, `ST` — not a word.
const priceUnitOptions: SelectOption[] = [
  { value: "", label: "—" },
  ...purchasingUnits.map((unit) => ({ value: unit, label: unit })),
];
// Blank is a real choice: "whatever the header's CD tick implies".
const sourceTypeOptions = enumOptions(
  purchaseSourceTypes,
  ORDER_SOURCE_TYPE_LABELS,
  "From the order",
);
// The reference's Quality dropdown: the code with its EN designation beside
// it — `304L | EN 1.4307`.
const qualityOptions: SelectOption[] = [
  { value: "", label: "—", description: "" },
  ...featuresQualities.map((quality) => ({
    value: quality,
    label: quality,
    description: FEATURES_QUALITY_LABELS[quality],
  })),
];

// The reference's Lines toolbar: `New · Delete · Sawing specifications ·
// Calculate · Pre-notify`, then the option shortcuts `DUPK320 · NG · K320 ·
// BF · F · L · K · LSR`. Only New and Delete do anything before the order
// exists.
const OPTION_SHORTCUTS = ["DUPK320", "NG", "K320", "BF", "F", "L", "K", "LSR"];

const EMPTY_ITEM: PurchaseOrderFormValues["items"][number] = {
  productUuid: "",
  quantity: "",
  netPrice: "",
  priceUnit: "",
  sourceType: "",
  productLabel: "",
  description: "",
  unit: "",
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
  /** On the Edit screen the lines are shown as saved, not retyped here. */
  readOnly?: boolean;
};

type LineProps = {
  index: number;
  selected: boolean;
  readOnly: boolean;
  onSelect: () => void;
};

const cell = "h-8 w-20 px-2 text-right tabular-nums";

/**
 * One row of the reference's Lines grid: `Code · For line · Delivery date ·
 * Status · Product · Description · Category · Quality · Length · Width ·
 * Thick. · Qty(p) · U · Kg(p) · M1(p) · Net Price · U · Amount · Kg(a)`, and
 * our `Type` (`Stk` · `CD` · `EXW`) at the end.
 *
 * 🔑 `Kg(p)`, `M1(p)` and the amount are **computed here and shown as you
 * type**, never typed. That is what the reference does — its `Net Price` is a
 * result rather than something anyone enters — and it is the only way a buyer
 * can tell a € 606,02 line from a € 0,00 one before saving it.
 */
const PurchaseOrderLineRow = ({
  index,
  selected,
  readOnly,
  onSelect,
}: LineProps) => {
  const {
    control,
    register,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<PurchaseOrderFormValues>();

  const line = useWatch({ control, name: `items.${index}` });
  // The reference's new row reads `10 · 12-10-2026 · Provisional · Standaard`
  // before a product is chosen: the code counts in tens, the date is the
  // header's, and a line starts provisional in the standard category.
  const headerDeliveryDate = useWatch({ control, name: "deliveryDate" });
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

  const problems = [
    lineErrors?.productUuid?.message,
    lineErrors?.quantity?.message,
    lineErrors?.netPrice?.message,
  ].filter(Boolean);

  return (
    <>
      <TableRow
        onClick={onSelect}
        className={cn("cursor-pointer", selected && "bg-muted")}
      >
        <TableCell className="text-right tabular-nums">
          {(index + 1) * 10}
        </TableCell>
        <TableCell />
        <TableCell className="whitespace-nowrap">
          {formatDateValue(headerDeliveryDate || null)}
        </TableCell>
        <TableCell>Provisional</TableCell>
        <TableCell className="min-w-56">
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
                disabled={readOnly}
                onChange={(choice) => {
                  productField.onChange(choice.productUuid);
                  // The article's own measurements travel onto the line, so the
                  // receival behind it can check what arrives against what was
                  // ordered — and so the buyer can see them.
                  const mm = (value: number | string | null) =>
                    value === null || Number(value) <= 0
                      ? ""
                      : String(Number(value));
                  const size = [choice.lengthMm, choice.widthMm, choice.thicknessMm]
                    .map(mm)
                    .filter(Boolean)
                    .join("x");
                  setValue(`items.${index}.productLabel`, choice.productCode ?? "");
                  // `Cold-rolled plate 304L  2000x1000x2mm`: the reference's
                  // Description is the name with the size appended.
                  setValue(
                    `items.${index}.description`,
                    [choice.productName, size ? `${size}mm` : null]
                      .filter(Boolean)
                      .join("  "),
                  );
                  setValue(`items.${index}.unit`, choice.unit ?? "");
                  setValue(`items.${index}.qualityCode`, choice.quality ?? "");
                  setValue(`items.${index}.lengthMm`, mm(choice.lengthMm));
                  setValue(`items.${index}.widthMm`, mm(choice.widthMm));
                  setValue(`items.${index}.thicknessMm`, mm(choice.thicknessMm));
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
        </TableCell>
        <TableCell className="min-w-48 whitespace-nowrap">
          {line?.description || ""}
        </TableCell>
        <TableCell>Standaard</TableCell>
        <TableCell className="min-w-36">
          <Controller
            control={control}
            name={`items.${index}.qualityCode`}
            render={({ field }) => (
              <Select
                id={`items.${index}.qualityCode`}
                value={field.value || ""}
                options={qualityOptions}
                columnHeaders={{ left: "Code", right: "EN" }}
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
            aria-label="Length (mm)"
            disabled={readOnly}
            className={cell}
            {...register(`items.${index}.lengthMm`)}
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            min="0"
            aria-label="Width (mm)"
            disabled={readOnly}
            className={cell}
            {...register(`items.${index}.widthMm`)}
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            step="0.01"
            min="0"
            aria-label="Thickness (mm)"
            disabled={readOnly}
            className={cell}
            {...register(`items.${index}.thicknessMm`)}
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
            aria-invalid={!!lineErrors?.quantity}
            className={cell}
            {...register(`items.${index}.quantity`)}
          />
        </TableCell>
        <TableCell>{(line?.unit ?? "").toUpperCase()}</TableCell>
        <TableCell className="text-right tabular-nums">
          {weightKg > 0 ? formatNumber(weightKg) : ""}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {formatNumber(metres)}
        </TableCell>
        <TableCell>
          {/* The lot received against this line is valued at this price, so it
              decides the margin of every sales order drawn from it. */}
          <Input
            type="number"
            step="0.0001"
            min="0"
            placeholder="0,00"
            aria-label="Net price"
            disabled={readOnly}
            aria-invalid={!!lineErrors?.netPrice}
            className={cn(cell, "w-24")}
            {...register(`items.${index}.netPrice`)}
          />
        </TableCell>
        <TableCell className="min-w-20">
          <Controller
            control={control}
            name={`items.${index}.priceUnit`}
            render={({ field: unitField }) => (
              <Select
                id={`items.${index}.priceUnit`}
                value={unitField.value || ""}
                options={priceUnitOptions}
                onValueChange={unitField.onChange}
                className="h-8"
                disabled={readOnly}
              />
            )}
          />
        </TableCell>
        <TableCell className="text-right tabular-nums whitespace-nowrap">
          {formatMoney(amount)}
        </TableCell>
        <TableCell />
        {/* The reference's `Line type` — `Stk` · `CD` · `EXW`. Grouping its
            purchase-lines grid showed all three, and only the first two can
            be read off the header, so the third has to be said here. */}
        <TableCell className="min-w-36">
          <Controller
            control={control}
            name={`items.${index}.sourceType`}
            render={({ field: typeField }) => (
              <Select
                id={`items.${index}.sourceType`}
                value={typeField.value || ""}
                options={sourceTypeOptions}
                onValueChange={typeField.onChange}
                className="h-8"
                disabled={readOnly}
              />
            )}
          />
        </TableCell>
      </TableRow>
      {(problems.length > 0 || unweighable) && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={20} className="py-1 text-destructive">
            {problems.map((problem) => (
              <FormFieldError key={problem} message={problem} />
            ))}
            {unweighable && (
              <p className="text-sm">
                This article has no dimensions or density on its product
                record, so it cannot be weighed — a price per tonne or per kilo
                against it comes to € 0,00. Give the product its dimensions, or
                price this line per piece.
              </p>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export const PurchaseOrderItemsSection = ({
  itemFields,
  appendItem,
  removeItem,
  readOnly = false,
}: Props) => {
  const {
    formState: { errors },
  } = useFormContext<PurchaseOrderFormValues>();
  const [selected, setSelected] = useState<number | null>(null);

  const addLine = () => {
    appendItem(EMPTY_ITEM);
    setSelected(itemFields.length);
  };

  const deleteLine = () => {
    if (selected === null) {
      return;
    }
    removeItem(selected);
    setSelected(null);
  };

  return (
    <section className="space-y-3">
      <div className="border-b pb-2">
        <h2 className="text-base font-semibold">
          Lines{" "}
          <span className="text-sm font-normal text-muted-foreground">
            {itemFields.length} {itemFields.length === 1 ? "line" : "lines"}
          </span>
        </h2>
      </div>

      {errors.items?.root && (
        <FormFieldError message={errors.items.root.message} />
      )}

      {/* The reference's toolbar strip above the grid. */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/30 px-2 py-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addLine}
          disabled={readOnly}
        >
          <Plus className="size-3.5 text-primary" /> New
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={readOnly || selected === null}
          onClick={deleteLine}
        >
          <X className="size-3.5 text-destructive" /> Delete
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled
          title="Save the order first"
        >
          <Scissors className="size-3.5" /> Sawing specifications
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled
          title="Save the order first"
        >
          <Calculator className="size-3.5" /> Calculate
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled
          title="Save the order first"
        >
          <BellRing className="size-3.5" /> Pre-notify
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
            title="Options are added to a saved order's lines"
          >
            {option}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">Code</TableHead>
              <TableHead>For line</TableHead>
              <TableHead>Delivery date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Quality</TableHead>
              <TableHead className="text-right">Length</TableHead>
              <TableHead className="text-right">Width</TableHead>
              <TableHead className="text-right">Thick.</TableHead>
              <TableHead className="text-right">Qty (p)</TableHead>
              <TableHead>U</TableHead>
              <TableHead className="text-right">Kg (p)</TableHead>
              <TableHead className="text-right">M1 (p)</TableHead>
              <TableHead className="text-right">Net price</TableHead>
              <TableHead>U</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Kg (a)</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemFields.map((field, index) => (
              <PurchaseOrderLineRow
                key={field.id}
                index={index}
                selected={selected === index}
                readOnly={readOnly}
                onSelect={() => setSelected(index)}
              />
            ))}
            {itemFields.length === 0 && (
              <TableRow>
                <TableCell colSpan={20} className="text-muted-foreground">
                  No lines. Press New to add one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};
