"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import {
  getProductionWorkOrderPicks,
  ProductionPickRow,
  ProductionWorkOrderLineItem,
  reportProductionTreatmentCompletion,
} from "@/app/(dashboard)/production-workorders/actions";
import {
  reportTreatmentSchema,
  ReportTreatmentFormValues,
} from "@/app/(dashboard)/production-workorders/validation";
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
import { todayDateString } from "@/lib/helpers";

type Props = {
  line: ProductionWorkOrderLineItem | null;
  onOpenChange: (open: boolean) => void;
};

/**
 * Reporting a treatment back.
 *
 * Grinding two plates gives two ground plates, so there is nothing to
 * reconcile: the floor says what it actually handled and the goods move on to
 * where the finished work belongs. A cut is a different dialog entirely.
 */
export const ReportTreatmentDialog = ({ line, onOpenChange }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportTreatmentFormValues>({
    resolver: zodResolver(reportTreatmentSchema),
    defaultValues: { executedAt: todayDateString(), picks: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "picks" });

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
      const prepared: ProductionPickRow[] = await getProductionWorkOrderPicks(
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
            qtyActual: pick.qtyActual ?? pick.qtyPlanned ?? "",
            kgActual: pick.kgActual ?? "",
            charge: pick.stockCharge ?? line.charge ?? "",
            internalCharge: pick.stockInternalCharge ?? "",
            internalBatch: pick.internalBatch ?? "",
          }))
        : [
            {
              uuid: undefined,
              stockUuid: "",
              qtyPlanned: line.qtyPlanned ?? "0",
              qtyActual: line.qtyPlanned ?? "",
              kgActual: line.kgPlanned ?? "",
              charge: line.charge ?? "",
              internalCharge: "",
              internalBatch: "",
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
      const result = await reportProductionTreatmentCompletion({
        lineUuid: line.uuid,
        executedAt: values.executedAt,
        picks: values.picks.map((pick) => ({
          uuid: pick.uuid,
          stockUuid: pick.stockUuid || undefined,
          qtyPlanned: pick.qtyPlanned,
          qtyActual: pick.qtyActual,
          kgActual: pick.kgActual || undefined,
          charge: pick.charge || undefined,
          internalCharge: pick.internalCharge || undefined,
          internalBatch: pick.internalBatch || undefined,
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
    <Dialog open={!!line} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Report Completion</DialogTitle>
          <DialogDescription>
            {line &&
              `Line ${line.lineNumber ?? ""} — ${line.qtyPlanned ?? 0} of ${
                line.productCode ?? "product"
              }. This is the moment the goods move on.`}
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
                    <TableHead className="text-right">Qty actual</TableHead>
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
                        className="text-muted-foreground h-16 text-center"
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

            {/* The work can genuinely come out of more than one lot, so the
                report is a list rather than a single number. */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  uuid: undefined,
                  stockUuid: "",
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
            <Button type="submit" disabled={isPending || loading}>
              {isPending ? "Reporting..." : "Report completion"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
