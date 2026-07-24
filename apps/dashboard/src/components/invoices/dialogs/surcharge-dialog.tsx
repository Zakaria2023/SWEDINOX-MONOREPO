"use client";

import { SurchargeFormValues } from "@/app/(dashboard)/invoices/validation";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { invoiceSurchargeDescriptions } from "@/lib/enums";
import { INVOICE_SURCHARGE_DESCRIPTION_LABELS } from "@/lib/labels";
import { Controller, UseFormReturn } from "react-hook-form";

type SurchargeDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  surchargeForm: UseFormReturn<SurchargeFormValues>;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
  editingIndex: number | null;
};

export const SurchargeDialog = ({
  isOpen,
  onOpenChange,
  surchargeForm,
  onSave,
  editingIndex,
}: SurchargeDialogProps) => {
  const surchargeDescriptionOptions = [
    { value: "", label: "Select an option" },
    ...invoiceSurchargeDescriptions.map((d) => ({
      value: d,
      label: INVOICE_SURCHARGE_DESCRIPTION_LABELS[d],
    })),
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingIndex !== null ? "Edit Surcharge" : "Add Surcharge"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSave}>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel htmlFor="surchargeOrder">Order</FormLabel>
                <Input
                  id="surchargeOrder"
                  type="number"
                  min={0}
                  {...surchargeForm.register("order", {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div>
                <FormLabel required>Description</FormLabel>
                <Controller
                  name="description"
                  control={surchargeForm.control}
                  render={({ field }) => (
                    <Select
                      options={surchargeDescriptionOptions}
                      value={field.value ?? ""}
                      onValueChange={(v) => field.onChange(v || undefined)}
                    />
                  )}
                />
                <FormFieldError
                  message={
                    surchargeForm.formState.errors.description?.message
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel htmlFor="surchargeAmount">Surcharge</FormLabel>
                <Input
                  id="surchargeAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...surchargeForm.register("surcharge")}
                />
              </div>
              <div>
                <FormLabel htmlFor="surchargeUnit">Unit</FormLabel>
                <Input
                  id="surchargeUnit"
                  placeholder="Euro"
                  {...surchargeForm.register("unit")}
                />
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingIndex !== null ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
