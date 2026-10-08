"use client";

import {
  addPurchaseOrderOption,
  addPurchaseOrderSupply,
  deletePurchaseOrderOption,
  deletePurchaseOrderSupply,
  PurchaseOrderItemDetail,
  PurchaseOrderOptionRow,
  PurchaseOrderSupplyRow,
  PurchaseReceiptDocument,
} from "@/app/(dashboard)/purchase-orders/actions";
import {
  PurchaseOrderOptionFormValues,
  purchaseOrderOptionSchema,
} from "@/app/(dashboard)/purchase-orders/validation";
import { StockSearchDialog } from "@/components/orders/stock-search-dialog";
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
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { stockOptions } from "@/lib/enums";
import {
  cn,
  formatDateColumn,
  formatLengthMm,
  formatMoney,
  formatNumber,
  orDash,
  pluralize,
} from "@/lib/helpers";
import {
  PURCHASE_ORDER_SUPPLY_STATUS_LABELS,
  STOCK_OPTION_LABELS,
} from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { startTransition, useActionState, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type SuppliesPanelProps = {
  purchaseOrderUuid: string;
  supplies: PurchaseOrderSupplyRow[];
  receipts: PurchaseReceiptDocument[];
};

type OptionsPanelProps = {
  purchaseOrderUuid: string;
  options: PurchaseOrderOptionRow[];
  items: PurchaseOrderItemDetail[];
};

type ChosenLot = {
  uuid: string;
  label: string;
  available: number;
};

const PER_OPTIONS = ["TN", "KG", "M2", "M1", "ST"].map((unit) => ({
  value: unit,
  label: unit,
}));

/**
 * `Supplies` on a `Processing` order (C8): the lots handed to the processor.
 * `New` picks a lot in the stock search. The summary is the kilo balance (C9)
 * — `400066` sent 1 134 kg and took back 900 + 234 = 1 134 kg, the scrap line
 * closing it.
 */
export const PurchaseOrderSuppliesPanel = ({
  purchaseOrderUuid,
  supplies,
  receipts,
}: SuppliesPanelProps) => {
  const [searching, setSearching] = useState(false);
  const [chosen, setChosen] = useState<ChosenLot | null>(null);
  const [quantity, setQuantity] = useState("");
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [state, dispatch, isPending] = useActionState(
    addPurchaseOrderSupply,
    {},
  );

  useEffect(() => {
    if (state.success) {
      setChosen(null);
      setQuantity("");
    }
  }, [state]);

  const kgOut = supplies.reduce(
    (sum, supply) =>
      sum + Number(supply.kgActual ?? 0) || sum + Number(supply.kgPlanned ?? 0),
    0,
  );
  const kgBack = receipts.reduce(
    (sum, receipt) => sum + Number(receipt.kgActual ?? 0),
    0,
  );
  const gap = kgOut - kgBack;
  const selected =
    supplies.find((supply) => supply.uuid === selectedUuid) ?? null;

  const onDelete = async () => {
    if (!selected) {
      return;
    }
    const result = await deletePurchaseOrderSupply(
      selected.uuid,
      purchaseOrderUuid,
    );
    setDeleteError(result.error ?? null);
    if (!result.error) {
      setSelectedUuid(null);
    }
  };

  return (
    <CollapsibleSection
      title="Supplies"
      summary={`${supplies.length} ${pluralize(supplies.length, "supply", "supplies")}; ${formatNumber(kgOut)} kg out, ${formatNumber(kgBack)} kg back${
        kgBack > 0 && Math.abs(gap) >= 0.5
          ? ` — ${formatNumber(Math.abs(gap))} kg ${gap > 0 ? "not accounted for" : "more than went out"}`
          : ""
      }`}
    >
      <div className="space-y-3 p-3">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSearching(true)}
          >
            <Plus className="me-1.5 size-4" />
            New
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={!selected || selected.status !== "new"}
          >
            <Trash2 className="me-1.5 size-4" />
            Delete
          </Button>
        </div>
        <FormError>{deleteError}</FormError>

        {chosen && (
          <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-3">
            <div>
              <p className="text-xs text-muted-foreground">Lot</p>
              <p className="text-sm font-medium">{chosen.label}</p>
            </div>
            <div className="w-32">
              <FormLabel htmlFor="supply-quantity">
                Qty (of {formatNumber(chosen.available)})
              </FormLabel>
              <Input
                id="supply-quantity"
                inputMode="decimal"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={isPending || !quantity}
              onClick={() =>
                startTransition(() =>
                  dispatch({
                    purchaseOrderUuid,
                    stockUuid: chosen.uuid,
                    quantity,
                  }),
                )
              }
            >
              {isPending ? "Adding…" : "Add supply"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setChosen(null)}
            >
              Cancel
            </Button>
            <FormError>{state.error}</FormError>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Blocked</TableHead>
              <TableHead>Delivery date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Length</TableHead>
              <TableHead className="text-right">Width</TableHead>
              <TableHead className="text-right">Thickness</TableHead>
              <TableHead className="text-right">Kg (p)</TableHead>
              <TableHead>Options</TableHead>
              <TableHead className="text-right">Qty (p)</TableHead>
              <TableHead>U</TableHead>
              <TableHead className="text-right">Picked</TableHead>
              <TableHead className="text-right">Qty (a)</TableHead>
              <TableHead className="text-right">Kg (a)</TableHead>
              <TableHead>Bill of lading</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Charge</TableHead>
              <TableHead>Purchase order</TableHead>
              <TableHead>Receipt date</TableHead>
              <TableHead className="text-right">M1 (p)</TableHead>
              <TableHead className="text-right">M1 (a)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supplies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={21}
                  className="h-16 text-center text-muted-foreground"
                >
                  Nothing supplied yet. Press New to hand a lot to the
                  processor.
                </TableCell>
              </TableRow>
            ) : (
              supplies.map((supply) => (
                <TableRow
                  key={supply.uuid}
                  onClick={() => setSelectedUuid(supply.uuid)}
                  className={cn(
                    "cursor-pointer whitespace-nowrap",
                    supply.uuid === selectedUuid && "bg-accent",
                  )}
                >
                  <TableCell>{supply.blocked ? "Yes" : "No"}</TableCell>
                  <TableCell>{formatDateColumn(supply.deliveryDate)}</TableCell>
                  <TableCell>{orDash(supply.productName)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatLengthMm(supply.lengthMm)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(supply.widthMm)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(supply.thicknessMm)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(supply.kgPlanned ?? 0))}
                  </TableCell>
                  <TableCell>{orDash(supply.options)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(supply.qtyPlanned ?? 0))}
                  </TableCell>
                  <TableCell>
                    {orDash(supply.unit ? supply.unit.toUpperCase() : null)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(supply.qtyPicked ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(supply.qtyActual ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(supply.kgActual ?? 0))}
                  </TableCell>
                  <TableCell>{orDash(supply.billOfLading)}</TableCell>
                  <TableCell>
                    {supply.status
                      ? PURCHASE_ORDER_SUPPLY_STATUS_LABELS[supply.status]
                      : "—"}
                  </TableCell>
                  <TableCell>{orDash(supply.productCode)}</TableCell>
                  <TableCell>{orDash(supply.charge)}</TableCell>
                  <TableCell>
                    {supply.lotPurchaseOrderId
                      ? `IO${supply.lotPurchaseOrderId}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {formatDateColumn(supply.lotReceiptDate)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(supply.m1Planned ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(supply.m1Actual ?? 0))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <StockSearchDialog
        open={searching}
        onOpenChange={setSearching}
        onChoose={(choice) => {
          if (choice.lot) {
            setChosen({
              uuid: choice.lot.uuid,
              label: [
                choice.lot.productCode,
                choice.lot.internalBatch,
                choice.lot.locationName,
              ]
                .filter(Boolean)
                .join(" · "),
              available: choice.lot.available,
            });
            setQuantity(String(choice.lot.available));
          }
          setSearching(false);
        }}
      />
    </CollapsibleSection>
  );
};

/**
 * A purchase line's `Options` (C10): the processing step bought, priced per
 * tonne, square metre or piece on the weight that comes back.
 */
export const PurchaseOrderOptionsPanel = ({
  purchaseOrderUuid,
  options,
  items,
}: OptionsPanelProps) => {
  const [adding, setAdding] = useState(false);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [state, dispatch, isPending] = useActionState(
    addPurchaseOrderOption,
    {},
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PurchaseOrderOptionFormValues>({
    resolver: zodResolver(purchaseOrderOptionSchema),
    defaultValues: {
      purchaseOrderUuid,
      purchaseOrderItemUuid: items[0]?.uuid ?? "",
      option: "decoiling",
      quantity: "1",
      grossPrice: "",
      per: "TN",
      discountPercent: "0",
      referenceFactor: "1",
    },
  });

  useEffect(() => {
    if (state.success) {
      setAdding(false);
      reset();
    }
  }, [state, reset]);

  const lineOf = (uuid: string) => {
    const line = items.find((item) => item.uuid === uuid);
    return line?.lineNumber === null || line?.lineNumber === undefined
      ? "—"
      : String(line.lineNumber * 10);
  };
  const total = options.reduce(
    (sum, option) => sum + Number(option.amount ?? 0),
    0,
  );

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, purchaseOrderUuid });
    });
  });

  const onDelete = async () => {
    if (!selectedUuid) {
      return;
    }
    const result = await deletePurchaseOrderOption(
      selectedUuid,
      purchaseOrderUuid,
    );
    setDeleteError(result.error ?? null);
    if (!result.error) {
      setSelectedUuid(null);
    }
  };

  return (
    <CollapsibleSection
      title="Options"
      summary={`${
        options
          .map((option) => STOCK_OPTION_LABELS[option.option])
          .join(", ") || "none"
      }; ${formatMoney(total)}`}
    >
      <div className="space-y-3 p-3">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAdding(true)}
            disabled={adding || items.length === 0}
          >
            <Plus className="me-1.5 size-4" />
            New
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={!selectedUuid}
          >
            <Trash2 className="me-1.5 size-4" />
            Delete
          </Button>
        </div>
        <FormError>{deleteError}</FormError>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">Line</TableHead>
              <TableHead className="text-right">Sort</TableHead>
              <TableHead>Option</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>U</TableHead>
              <TableHead className="text-right">Gross price</TableHead>
              <TableHead>Per</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Reference factor</TableHead>
              <TableHead className="text-right">Net price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {options.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="h-16 text-center text-muted-foreground"
                >
                  No options on this order.
                </TableCell>
              </TableRow>
            ) : (
              options.map((option) => (
                <TableRow
                  key={option.uuid}
                  onClick={() => setSelectedUuid(option.uuid)}
                  className={cn(
                    "cursor-pointer",
                    option.uuid === selectedUuid && "bg-accent",
                  )}
                >
                  <TableCell className="text-right tabular-nums">
                    {lineOf(option.purchaseOrderItemUuid)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(option.sortOrder)}
                  </TableCell>
                  <TableCell>{STOCK_OPTION_LABELS[option.option]}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(option.quantity ?? 0))}
                  </TableCell>
                  <TableCell>
                    {orDash(option.unit ? option.unit.toUpperCase() : null)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(option.grossPrice ?? 0))}
                  </TableCell>
                  <TableCell>{orDash(option.per)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(option.discountPercent ?? 0))} %
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(option.amount ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(option.referenceFactor ?? 1))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(option.netPrice ?? 0))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {adding && (
          <form
            onSubmit={onSubmit}
            className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-4"
          >
            <div>
              <FormLabel htmlFor="option-line" required>
                Line
              </FormLabel>
              <Controller
                name="purchaseOrderItemUuid"
                control={control}
                render={({ field }) => (
                  <Select
                    id="option-line"
                    value={field.value}
                    options={items.map((item) => ({
                      value: item.uuid,
                      label: `${item.lineNumber === null ? "—" : item.lineNumber * 10} · ${item.productCode}`,
                    }))}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </div>
            <div>
              <FormLabel htmlFor="option-kind" required>
                Option
              </FormLabel>
              <Controller
                name="option"
                control={control}
                render={({ field }) => (
                  <Select
                    id="option-kind"
                    value={field.value}
                    options={stockOptions.map((option) => ({
                      value: option,
                      label: STOCK_OPTION_LABELS[option],
                    }))}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </div>
            <div>
              <FormLabel htmlFor="option-quantity">Qty</FormLabel>
              <Input
                id="option-quantity"
                inputMode="decimal"
                {...register("quantity")}
              />
            </div>
            <div>
              <FormLabel htmlFor="option-gross" required>
                Gross price
              </FormLabel>
              <Input
                id="option-gross"
                inputMode="decimal"
                {...register("grossPrice")}
              />
              <FormFieldError message={errors.grossPrice?.message} />
            </div>
            <div>
              <FormLabel htmlFor="option-per" required>
                Per
              </FormLabel>
              <Controller
                name="per"
                control={control}
                render={({ field }) => (
                  <Select
                    id="option-per"
                    value={field.value}
                    options={PER_OPTIONS}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </div>
            <div>
              <FormLabel htmlFor="option-discount">Discount %</FormLabel>
              <Input
                id="option-discount"
                inputMode="decimal"
                {...register("discountPercent")}
              />
            </div>
            <div>
              <FormLabel htmlFor="option-factor">Reference factor</FormLabel>
              <Input
                id="option-factor"
                inputMode="decimal"
                {...register("referenceFactor")}
              />
            </div>
            <div className="col-span-full flex gap-2">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setAdding(false);
                  reset();
                }}
              >
                Cancel
              </Button>
              <FormError>{state.error}</FormError>
            </div>
          </form>
        )}
      </div>
    </CollapsibleSection>
  );
};
