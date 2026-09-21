"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import {
  getWarehouseWorkOrderPicks,
  reportWarehouseWorkOrderLineCompletion,
  WorkOrderLineListItem,
  WorkOrderPickRow,
} from "@/app/(dashboard)/warehouse-work-orders/actions";
import {
  reportCompletionSchema,
  ReportCompletionFormValues,
} from "@/app/(dashboard)/warehouse-work-orders/validation";
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
import { WarehouseWorkOrderType } from "@/lib/enums";
import {
  cn,
  todayDateString,
  warehouseWorkOrderTypeMetaOf,
} from "@/lib/helpers";

type Props = {
  line: WorkOrderLineListItem | null;
  workOrderType: WarehouseWorkOrderType;
  onOpenChange: (open: boolean) => void;
};

export const ReportCompletionDialog = ({
  line,
  workOrderType,
  onOpenChange,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ReportCompletionFormValues>({
    resolver: zodResolver(reportCompletionSchema),
    defaultValues: { executedAt: todayDateString(), picks: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "picks" });

  // The dialog opens on the rows the line was prepared with. When nobody
  // prepared it, one row is offered taken from the line itself — which is the
  // ordinary case of a line drawn from a single lot.
  useEffect(() => {
    if (!line) {
      return;
    }

    // Mutated by the cleanup so a reply that arrives after the dialog has moved
    // on cannot overwrite the rows for a different line.
    const request = { cancelled: false };
    setLoading(true);
    setFormError(undefined);

    const load = async () => {
      const prepared: WorkOrderPickRow[] = await getWarehouseWorkOrderPicks(
        line.uuid,
      ).catch(() => []);

      if (request.cancelled) {
        return;
      }

      const rows = prepared.length
        ? prepared.map((pick) => ({
            uuid: pick.uuid,
            stockUuid: pick.stockUuid ?? "",
            qtyPlanned: pick.qtyPlanned ?? "0",
            qtyActual: pick.qtyActual ?? (pick.qtyPlanned ?? ""),
            kgActual: pick.kgActual ?? "",
            charge: pick.stockCharge ?? line.charge ?? "",
            internalCharge:
              pick.stockInternalCharge ?? line.internalCharge ?? "",
            internalBatch: pick.internalBatch ?? line.internalBatch ?? "",
          }))
        : [
            {
              uuid: undefined,
              stockUuid: line.stockUuid ?? "",
              qtyPlanned: line.qtyPlanned ?? "0",
              qtyActual: line.qtyPlanned ?? "",
              kgActual: line.kgPlanned ?? "",
              charge: line.charge ?? "",
              internalCharge: line.internalCharge ?? "",
              internalBatch: line.internalBatch ?? "",
            },
          ];

      reset({ executedAt: todayDateString(), picks: rows });
      setLoading(false);
    };

    void load();

    return () => {
      request.cancelled = true;
    };
  }, [line, reset]);

  const onSubmit = handleSubmit((values) => {
    if (!line) {
      return;
    }
    startTransition(async () => {
      const result = await reportWarehouseWorkOrderLineCompletion({
        lineUuid: line.uuid,
        executedAt: values.executedAt,
        picks: values.picks.map((pick) => ({
          uuid: pick.uuid,
          stockUuid: pick.stockUuid || null,
          toLocationUuid: null,
          qtyPlanned: pick.qtyPlanned,
          qtyActual: pick.qtyActual,
          kgActual: pick.kgActual || null,
          charge: pick.charge || null,
          internalCharge: pick.internalCharge || null,
          internalBatch: pick.internalBatch || null,
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

  const meta = warehouseWorkOrderTypeMetaOf(workOrderType);
  const isCount = meta?.stockEffect === "count";
  // Goods coming in, where every bundle owes a heat number.
  const isReceipt = meta?.stockEffect === "in";

  // 🔴 The rule that stops metal becoming stock without traceability.
  //
  // The reference keeps its own `OK` greyed out until every bundle carrying a
  // quantity has a `Charge` — watched on 21-9-2026 while reporting the
  // unloading of purchase order 401141, where nothing else unlocked it. The
  // server enforces this too; the button is disabled so the floor sees why
  // before it fills the dialog in rather than after.
  const watchedPicks = watch("picks");
  const bundlesMissingCharge = isReceipt
    ? (watchedPicks ?? []).filter(
        (pick) =>
          Number(String(pick?.qtyActual ?? "").replace(",", ".")) > 0 &&
          !String(pick?.charge ?? "").trim(),
      ).length
    : 0;

  return (
    <Dialog open={!!line} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Report Completion</DialogTitle>
          <DialogDescription>
            {line &&
              `Line ${line.lineNumber ?? ""} — ${line.qtyPlanned ?? 0} of ${
                line.productCode ?? "product"
              }. ${
                isCount
                  ? "The quantity you report replaces what the lot is recorded as holding."
                  : "This is the moment the stock actually moves."
              }`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <DialogBody className="space-y-4">
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

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">Qty planned</TableHead>
                    <TableHead className="text-right">
                      {isCount ? "Counted" : "Qty actual"}
                    </TableHead>
                    <TableHead className="text-right">Kg actual</TableHead>
                    <TableHead>Charge</TableHead>
                    <TableHead>Internal charge</TableHead>
                    <TableHead>Internal batch</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-16 text-center text-muted-foreground"
                      >
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : (
                    fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell className="text-right">
                          <Input
                            className="text-right"
                            readOnly
                            {...register(`picks.${index}.qtyPlanned`)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="text"
                            inputMode="decimal"
                            className="text-right"
                            {...register(`picks.${index}.qtyActual`)}
                            disabled={isPending}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="text"
                            inputMode="decimal"
                            className="text-right"
                            {...register(`picks.${index}.kgActual`)}
                            disabled={isPending}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            {...register(`picks.${index}.charge`)}
                            disabled={isPending}
                            className={cn(
                              isReceipt &&
                                Number(
                                  String(
                                    watchedPicks?.[index]?.qtyActual ?? "",
                                  ).replace(",", "."),
                                ) > 0 &&
                                !String(
                                  watchedPicks?.[index]?.charge ?? "",
                                ).trim() &&
                                "border-destructive",
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            {...register(`picks.${index}.internalCharge`)}
                            disabled={isPending}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            {...register(`picks.${index}.internalBatch`)}
                            disabled={isPending}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            disabled={isPending || fields.length === 1}
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

            {/* 28 pieces can genuinely come out of three different lots, so the
                report is a list rather than a single number. */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  uuid: undefined,
                  stockUuid: line?.stockUuid ?? "",
                  qtyPlanned: "0",
                  qtyActual: "",
                  kgActual: "",
                  charge: "",
                  internalCharge: "",
                  internalBatch: "",
                })
              }
              disabled={isPending}
            >
              <Plus className="size-4" />
              Add row
            </Button>

            {bundlesMissingCharge > 0 ? (
              <p className="text-sm text-muted-foreground">
                {bundlesMissingCharge === 1
                  ? "One bundle still has no charge."
                  : `${bundlesMissingCharge} bundles still have no charge.`}{" "}
                Every bundle needs the heat number from its certificate before
                these goods can become stock.
              </p>
            ) : null}

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
            <Button
              type="submit"
              disabled={isPending || loading || bundlesMissingCharge > 0}
            >
              {isPending ? "Reporting..." : "Report completion"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
