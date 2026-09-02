"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import {
  ProductionWorkOrderDetail,
  reportProductionCutCompletion,
} from "@/app/(dashboard)/production-workorders/actions";
import {
  reportCutSchema,
  ReportCutFormValues,
} from "@/app/(dashboard)/production-workorders/validation";
import { AvailableStockOption } from "@/app/(dashboard)/warehouse-work-orders/actions";
import { LocationOption } from "@/app/(dashboard)/locations/actions";
import { Button } from "@/components/shadcn/button";
import { DatePicker } from "@/components/shadcn/date-picker";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
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
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { remainderCategories } from "@/lib/enums";
import { cn, todayDateString } from "@/lib/helpers";
import { REMAINDER_CATEGORY_LABELS } from "@/lib/labels";

type Props = {
  workOrder: ProductionWorkOrderDetail | null;
  stockOptions: AvailableStockOption[];
  locations: LocationOption[];
  onOpenChange: (open: boolean) => void;
};

// The same tolerance the action strikes the balance at: weights are held to two
// decimals, so three rounded figures can miss zero by a cent of a kilo.
const TOLERANCE_KG = 0.01;

const asKg = (value: string | undefined) => {
  const parsed = Number((value ?? "").trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Reporting a cut back.
 *
 * Everything fetched has to come off the machine again as finished goods plus
 * remainders, weighed. Pieces are no guide — two plates can legitimately become
 * five — so the dialog shows the kilos running to zero and will not submit until
 * they do. That is not a nicety: a run that does not balance would invent or
 * destroy steel that physically exists.
 */
export const ReportCutDialog = ({
  workOrder,
  stockOptions,
  locations,
  onOpenChange,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | undefined>();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportCutFormValues>({
    resolver: zodResolver(reportCutSchema),
    defaultValues: {
      executedAt: todayDateString(),
      fetched: [],
      components: [],
      remainders: [],
    },
  });

  const fetched = useFieldArray({ control, name: "fetched" });
  const components = useFieldArray({ control, name: "components" });
  const remainders = useFieldArray({ control, name: "remainders" });

  const watched = useWatch({ control });

  useEffect(() => {
    if (!workOrder) {
      return;
    }
    setFormError(undefined);
    reset({
      executedAt: todayDateString(),
      // The lots already recorded against the run, or one empty row to start.
      fetched: workOrder.picks.length
        ? workOrder.picks.map((pick) => ({
            uuid: pick.uuid,
            stockUuid: pick.stockUuid ?? "",
            qtyActual: pick.qtyActual ?? pick.qtyPlanned ?? "",
            kgActual: pick.kgActual ?? pick.kgPlanned ?? "",
          }))
        : [{ uuid: undefined, stockUuid: "", qtyActual: "", kgActual: "" }],
      // Components are the run's own lines — they are what it was raised to
      // make, so they are not added or removed here.
      components: workOrder.lines.map((line) => ({
        lineUuid: line.uuid,
        qtyActual: line.qtyActual ?? line.qtyPlanned ?? "",
        kgActual: line.kgActual ?? line.kgPlanned ?? "",
      })),
      remainders: workOrder.remainders.map((row) => ({
        category: row.category,
        productUuid: row.productUuid ?? "",
        quantity: row.quantity,
        kg: row.kg,
        toLocationUuid: row.toLocationUuid ?? "",
        remark: row.remark ?? "",
      })),
    });
  }, [workOrder, reset]);

  const fetchedKg = (watched.fetched ?? []).reduce(
    (total, row) => total + asKg(row?.kgActual),
    0,
  );
  const componentKg = (watched.components ?? []).reduce(
    (total, row) => total + asKg(row?.kgActual),
    0,
  );
  const remainderKg = (watched.remainders ?? []).reduce(
    (total, row) => total + asKg(row?.kg),
    0,
  );
  const difference = fetchedKg - componentKg - remainderKg;
  const balanced = Math.abs(difference) <= TOLERANCE_KG;

  const onSubmit = handleSubmit((values) => {
    if (!workOrder) {
      return;
    }
    startTransition(async () => {
      const result = await reportProductionCutCompletion({
        workOrderUuid: workOrder.uuid,
        executedAt: values.executedAt,
        fetched: values.fetched.map((row) => ({
          uuid: row.uuid,
          stockUuid: row.stockUuid,
          qtyActual: row.qtyActual,
          kgActual: row.kgActual,
        })),
        components: values.components,
        remainders: values.remainders.map((row) => ({
          category: row.category,
          productUuid: row.productUuid || undefined,
          quantity: row.quantity,
          kg: row.kg,
          toLocationUuid: row.toLocationUuid || undefined,
          remark: row.remark || undefined,
        })),
      });

      if (result.success) {
        onOpenChange(false);
        router.refresh();
        return;
      }

      setFormError(result.error);
    });
  });

  return (
    <Dialog open={!!workOrder} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>
            Report Completion — Cut workorder{" "}
            {workOrder ? workOrder.number : ""}
          </DialogTitle>
          <DialogDescription>
            Everything taken to the machine has to come off it again as goods
            plus remainders. The kilos have to reach zero.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <DialogBody className="space-y-6">
            <div className="max-w-xs">
              <FormLabel htmlFor="executedAt" required>
                Executed on
              </FormLabel>
              <Controller
                control={control}
                name="executedAt"
                render={({ field }) => (
                  <DatePicker
                    id="executedAt"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
              <FormFieldError message={errors.executedAt?.message} />
            </div>

            {/* ---- Fetched ---- */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Fetched</h3>
                <span className="tabular-nums text-sm">
                  {fetchedKg.toFixed(2)} KG
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lot</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Kg</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fetched.fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Controller
                            control={control}
                            name={`fetched.${index}.stockUuid`}
                            render={({ field: select }) => (
                              <Select
                                value={select.value ?? ""}
                                placeholder="Choose a lot"
                                options={stockOptions.map((option) => ({
                                  value: option.uuid,
                                  label: `${option.productCode} — ${option.productName} (${option.quantity} available)`,
                                }))}
                                onValueChange={select.onChange}
                                disabled={isPending}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="text"
                            inputMode="decimal"
                            className="text-right"
                            {...register(`fetched.${index}.qtyActual`)}
                            disabled={isPending}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="text"
                            inputMode="decimal"
                            className="text-right"
                            {...register(`fetched.${index}.kgActual`)}
                            disabled={isPending}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => fetched.remove(index)}
                            disabled={isPending || fetched.fields.length === 1}
                            aria-label="Remove row"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  fetched.append({
                    uuid: undefined,
                    stockUuid: "",
                    qtyActual: "",
                    kgActual: "",
                  })
                }
                disabled={isPending}
              >
                <Plus className="size-4" />
                Add lot
              </Button>
            </section>

            {/* ---- Components ---- */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Components</h3>
                <span className="tabular-nums text-sm">
                  {componentKg.toFixed(2)} KG
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Line</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Kg</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {components.fields.map((field, index) => {
                      const line = workOrder?.lines[index];
                      return (
                        <TableRow key={field.id}>
                          <TableCell className="tabular-nums">
                            {line?.lineNumber ?? index + 1}
                          </TableCell>
                          <TableCell>{line?.productCode ?? "—"}</TableCell>
                          <TableCell>{line?.orderNumber ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="text"
                              inputMode="decimal"
                              className="text-right"
                              {...register(`components.${index}.qtyActual`)}
                              disabled={isPending}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="text"
                              inputMode="decimal"
                              className="text-right"
                              {...register(`components.${index}.kgActual`)}
                              disabled={isPending}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </section>

            {/* ---- Remainders ---- */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Remainders</h3>
                <span className="tabular-nums text-sm">
                  {remainderKg.toFixed(2)} KG
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Category</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Kg</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Remark</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {remainders.fields.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-muted-foreground text-center"
                        >
                          Nothing left over.
                        </TableCell>
                      </TableRow>
                    ) : (
                      remainders.fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <Controller
                              control={control}
                              name={`remainders.${index}.category`}
                              render={({ field: select }) => (
                                <Select
                                  value={select.value ?? ""}
                                  options={remainderCategories.map(
                                    (category) => ({
                                      value: category,
                                      label:
                                        REMAINDER_CATEGORY_LABELS[category],
                                    }),
                                  )}
                                  onValueChange={select.onChange}
                                  disabled={isPending}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="text"
                              inputMode="decimal"
                              className="text-right"
                              {...register(`remainders.${index}.quantity`)}
                              disabled={isPending}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="text"
                              inputMode="decimal"
                              className="text-right"
                              {...register(`remainders.${index}.kg`)}
                              disabled={isPending}
                            />
                          </TableCell>
                          <TableCell>
                            <Controller
                              control={control}
                              name={`remainders.${index}.toLocationUuid`}
                              render={({ field: select }) => (
                                <Select
                                  value={select.value ?? ""}
                                  placeholder="Location"
                                  options={locations.map((location) => ({
                                    value: location.uuid,
                                    label: location.name,
                                  }))}
                                  onValueChange={select.onChange}
                                  disabled={isPending}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              {...register(`remainders.${index}.remark`)}
                              disabled={isPending}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remainders.remove(index)}
                              disabled={isPending}
                              aria-label="Remove row"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  remainders.append({
                    category: "scrap",
                    productUuid: "",
                    quantity: "",
                    kg: "",
                    toLocationUuid: "",
                    remark: "",
                  })
                }
                disabled={isPending}
              >
                <Plus className="size-4" />
                Add remainder
              </Button>
            </section>

            {/* The figure the whole dialog turns on. */}
            <div
              className={cn(
                "flex items-center justify-between rounded-md border p-3 text-sm",
                balanced
                  ? "border-border"
                  : "border-destructive text-destructive",
              )}
            >
              <span className="font-medium">
                {balanced
                  ? "The run balances."
                  : "Fetched, less what came off the machine"}
              </span>
              <span className="tabular-nums font-semibold">
                {difference.toFixed(2)} KG
              </span>
            </div>

            <FormError>{formError}</FormError>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !balanced}>
              {isPending ? "Reporting..." : "Report completion"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
