"use client";

import { createSalesOption } from "@/app/(dashboard)/option-prices-per-product/actions";
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
import { processingEditings, salesUnitOptions } from "@/lib/enums";
import { PROCESSING_EDITING_LABELS, SALES_UNIT_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const optionSchema = z.object({
  code: z.string().min(1, "A short code is required"),
  name: z.string().min(1, "A name is required"),
  editing: z.string().optional(),
  priceUnit: z.string().optional(),
  basePrice: z.number().min(0),
  costPrice: z.number().min(0),
});

type OptionFormValues = z.infer<typeof optionSchema>;

const DEFAULT_VALUES: OptionFormValues = {
  code: "",
  name: "",
  editing: "",
  priceUnit: "",
  basePrice: 0,
  costPrice: 0,
};

const editingOptions = [
  { value: "", label: "Empty" },
  ...processingEditings.map((editing) => ({
    value: editing,
    label: PROCESSING_EDITING_LABELS[editing],
  })),
];

const priceUnitOptions = [
  { value: "", label: "Empty" },
  ...salesUnitOptions.map((unit) => ({
    value: unit,
    label: `${unit} — ${SALES_UNIT_LABELS[unit]}`,
  })),
];

export const NewOptionDialog = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  const {
    register,
    control,
    formState: { errors },
    reset,
    handleSubmit,
  } = useForm<OptionFormValues>({
    resolver: zodResolver(optionSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      reset(DEFAULT_VALUES);
      setFormError(undefined);
    }
    setDialogOpen(open);
  };

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await createSalesOption({
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        editing: values.editing
          ? (values.editing as (typeof processingEditings)[number])
          : null,
        priceUnit: values.priceUnit
          ? (values.priceUnit as (typeof salesUnitOptions)[number])
          : null,
        basePrice: values.basePrice.toFixed(2),
        costPrice: values.costPrice.toFixed(2),
        isActive: true,
      });

      if (result.success) {
        handleDialogClose(false);
        router.refresh();
        return;
      }

      setFormError(result.error);
    });
  });

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setDialogOpen(true)}
        className="gap-2"
      >
        <Plus className="size-4" />
        New option
      </Button>

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New option</DialogTitle>
            <DialogDescription>
              A processing step that can be sold alongside the material, such as
              sawing or bending.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit}>
            <DialogBody className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FormLabel htmlFor="option-code" required>
                    Code
                  </FormLabel>
                  <Input
                    id="option-code"
                    {...register("code")}
                    aria-invalid={!!errors.code}
                    placeholder="Z"
                    disabled={isPending}
                  />
                  <FormFieldError message={errors.code?.message} />
                </div>
                <div className="col-span-2">
                  <FormLabel htmlFor="option-name" required>
                    Name
                  </FormLabel>
                  <Input
                    id="option-name"
                    {...register("name")}
                    aria-invalid={!!errors.name}
                    placeholder="Sawing"
                    disabled={isPending}
                  />
                  <FormFieldError message={errors.name?.message} />
                </div>
              </div>

              <div>
                <FormLabel htmlFor="option-editing">Processing type</FormLabel>
                <Controller
                  name="editing"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="option-editing"
                      options={editingOptions}
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      placeholder="Empty"
                      disabled={isPending}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FormLabel htmlFor="option-price-unit">Price unit</FormLabel>
                  <Controller
                    name="priceUnit"
                    control={control}
                    render={({ field }) => (
                      <Select
                        id="option-price-unit"
                        options={priceUnitOptions}
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        placeholder="Empty"
                        disabled={isPending}
                      />
                    )}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="option-base-price">Base price</FormLabel>
                  <Input
                    id="option-base-price"
                    type="number"
                    step="0.01"
                    min={0}
                    {...register("basePrice", { valueAsNumber: true })}
                    disabled={isPending}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="option-cost-price">Cost price</FormLabel>
                  <Input
                    id="option-cost-price"
                    type="number"
                    step="0.01"
                    min={0}
                    {...register("costPrice", { valueAsNumber: true })}
                    disabled={isPending}
                  />
                </div>
              </div>

              <FormError>{formError}</FormError>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogClose(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Create option"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
