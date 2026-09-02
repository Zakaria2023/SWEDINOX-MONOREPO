"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addWarehouseWorkOrderLine } from "@/app/(dashboard)/warehouse-work-orders/actions";
import {
  workOrderLineSchema,
  WorkOrderLineFormValues,
} from "@/app/(dashboard)/warehouse-work-orders/validation";
import { AvailableStockOption } from "@/app/(dashboard)/warehouse-work-orders/actions";
import { LocationOption } from "@/app/(dashboard)/locations/actions";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
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
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";

type Props = {
  workOrderUuid: string | null;
  stockOptions: AvailableStockOption[];
  locations: LocationOption[];
  onOpenChange: (open: boolean) => void;
};

const DEFAULTS: WorkOrderLineFormValues = {
  stockUuid: "",
  toLocationUuid: "",
  qtyPlanned: "",
  kgPlanned: "",
  orderNumber: "",
  priority: "",
  rush: false,
};

export const AddLineDialog = ({
  workOrderUuid,
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
  } = useForm<WorkOrderLineFormValues>({
    resolver: zodResolver(workOrderLineSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (workOrderUuid) {
      reset(DEFAULTS);
      setFormError(undefined);
    }
  }, [workOrderUuid, reset]);

  const onSubmit = handleSubmit((values) => {
    if (!workOrderUuid) {
      return;
    }
    startTransition(async () => {
      const result = await addWarehouseWorkOrderLine({
        workOrderUuid,
        // The product, the charge and where the goods stand are read off the
        // lot on the server, so nothing here can disagree with the shelf.
        stockUuid: values.stockUuid,
        toLocationUuid: values.toLocationUuid || null,
        qtyPlanned: values.qtyPlanned,
        kgPlanned: values.kgPlanned || null,
        orderNumber: values.orderNumber || null,
        priority: values.priority ? Number(values.priority) : null,
        rush: values.rush,
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
    <Dialog open={!!workOrderUuid} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Line</DialogTitle>
          <DialogDescription>
            One lot&apos;s worth of the job. A quantity drawn from several lots
            is added as several lines.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <DialogBody className="space-y-4">
            <div>
              <FormLabel htmlFor="stockUuid" required>
                Stock lot
              </FormLabel>
              <Controller
                control={control}
                name="stockUuid"
                render={({ field }) => (
                  <Select
                    id="stockUuid"
                    value={field.value}
                    placeholder="Choose a lot"
                    options={stockOptions.map((option) => ({
                      value: option.uuid,
                      label: `${option.productCode} — ${option.productName} (${option.quantity} available)`,
                    }))}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />
              <FormFieldError message={errors.stockUuid?.message} />
            </div>

            <div>
              <FormLabel htmlFor="toLocationUuid">Destination</FormLabel>
              <Controller
                control={control}
                name="toLocationUuid"
                render={({ field }) => (
                  <Select
                    id="toLocationUuid"
                    value={field.value ?? ""}
                    placeholder="Leaves the company"
                    options={locations.map((location) => ({
                      value: location.uuid,
                      label: location.name,
                    }))}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />
              {/* Left empty on a pick-up: the goods are collected and gone. */}
              <p className="mt-1 text-xs text-muted-foreground">
                Leave empty when the goods leave the company.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel htmlFor="qtyPlanned" required>
                  Quantity
                </FormLabel>
                <Input
                  id="qtyPlanned"
                  type="text"
                  inputMode="decimal"
                  {...register("qtyPlanned")}
                  disabled={isPending}
                />
                <FormFieldError message={errors.qtyPlanned?.message} />
              </div>
              <div>
                <FormLabel htmlFor="kgPlanned">Kg</FormLabel>
                <Input
                  id="kgPlanned"
                  type="text"
                  inputMode="decimal"
                  {...register("kgPlanned")}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel htmlFor="orderNumber">Order</FormLabel>
                <Input
                  id="orderNumber"
                  {...register("orderNumber")}
                  disabled={isPending}
                />
              </div>
              <div>
                <FormLabel htmlFor="priority">Priority</FormLabel>
                <Input
                  id="priority"
                  type="number"
                  step="1"
                  {...register("priority")}
                  disabled={isPending}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox {...register("rush")} disabled={isPending} />
              Rush — jump the queue
            </label>

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
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add line"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
