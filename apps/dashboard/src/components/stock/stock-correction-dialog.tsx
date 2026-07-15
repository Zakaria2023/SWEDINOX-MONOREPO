"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createStockCorrection } from "@/app/(dashboard)/stock/actions";
import { Button } from "@/components/shadcn/button";
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
import { stockCorrectionReasons, stockMovementTypes } from "@/lib/enums";
import { COMMON_TEXT, STOCK_MOVEMENT_REASON_LABELS } from "@/lib/labels";

const correctionSchema = z.object({
  direction: z.enum(stockMovementTypes),
  quantity: z.string().min(1, "Quantity is required"),
  reason: z.enum(stockCorrectionReasons),
  note: z.string().optional(),
});

type CorrectionFormValues = z.infer<typeof correctionSchema>;

const DEFAULT_VALUES: CorrectionFormValues = {
  direction: "in",
  quantity: "",
  reason: "manual_correction",
  note: "",
};

type StockCorrectionTarget = {
  uuid: string;
  quantity: string;
  productCode: string | null;
  productName: string | null;
};

type Props = {
  stock: StockCorrectionTarget | null;
  onOpenChange: (open: boolean) => void;
};

const directionOptions = stockMovementTypes.map((type) => ({
  value: type,
  label: type === "in" ? "Add to stock" : "Remove from stock",
}));

const reasonOptions = stockCorrectionReasons.map((reason) => ({
  value: reason,
  label: STOCK_MOVEMENT_REASON_LABELS[reason],
}));

export const StockCorrectionDialog = ({ stock, onOpenChange }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | undefined>();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CorrectionFormValues>({
    resolver: zodResolver(correctionSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (stock) {
      reset(DEFAULT_VALUES);
      setFormError(undefined);
    }
  }, [stock, reset]);

  const handleClose = (open: boolean) => {
    if (!open) {
      onOpenChange(false);
    }
  };

  const onSubmit = handleSubmit((values) => {
    if (!stock) {
      return;
    }
    startTransition(async () => {
      const result = await createStockCorrection({
        stockUuid: stock.uuid,
        direction: values.direction,
        quantity: values.quantity,
        reason: values.reason,
        note: values.note || undefined,
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
    <Dialog open={!!stock} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Correct Stock</DialogTitle>
          <DialogDescription>
            {stock &&
              `${[stock.productCode, stock.productName].filter(Boolean).join(" — ")} — currently ${stock.quantity}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <DialogBody className="space-y-4">
            <div>
              <FormLabel htmlFor="direction" required>
                Direction
              </FormLabel>
              <Controller
                control={control}
                name="direction"
                render={({ field }) => (
                  <Select
                    id="direction"
                    value={field.value}
                    options={directionOptions}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />
            </div>

            <div>
              <FormLabel htmlFor="quantity" required>
                Quantity
              </FormLabel>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                min="0"
                {...register("quantity")}
                disabled={isPending}
              />
              <FormFieldError message={errors.quantity?.message} />
            </div>

            <div>
              <FormLabel htmlFor="reason" required>
                Reason
              </FormLabel>
              <Controller
                control={control}
                name="reason"
                render={({ field }) => (
                  <Select
                    id="reason"
                    value={field.value}
                    options={reasonOptions}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />
            </div>

            <div>
              <FormLabel htmlFor="note">Note</FormLabel>
              <Input
                id="note"
                placeholder="Optional — e.g. found during Q1 count"
                {...register("note")}
                disabled={isPending}
              />
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
              {COMMON_TEXT.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? COMMON_TEXT.saving : "Apply Correction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
