"use client";

import { MachineProductDialogValues } from "@/app/(dashboard)/machines/validation";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { DialogFormFooter } from "@/components/ui/dialog-form-footer";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { Package } from "lucide-react";
import { FormEventHandler } from "react";
import { UseFormReturn } from "react-hook-form";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSave: FormEventHandler<HTMLFormElement>;
  form: UseFormReturn<MachineProductDialogValues>;
  selectedProduct: ProductOption | null;
  onBrowse: () => void;
};

export const MachineProductDialog = ({
  isOpen,
  onOpenChange,
  onCancel,
  onSave,
  form,
  selectedProduct,
  onBrowse,
}: Props) => {
  const { register, formState } = form;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="size-4" />
            Add Product
          </DialogTitle>
          <DialogDescription>
            Pick a product (group) and set its production terms for this
            machine.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSave}>
          <DialogBody className="space-y-4">
            <div>
              <FormLabel required>Product (group)</FormLabel>
              <button
                type="button"
                onClick={onBrowse}
                className="mt-1.5 flex h-9 w-full items-center justify-between rounded-lg border border-input px-3 text-sm hover:border-primary"
              >
                <span className="truncate">
                  {selectedProduct
                    ? `${selectedProduct.productCode} — ${selectedProduct.name}`
                    : "Browse products…"}
                </span>
              </button>
              <FormFieldError message={formState.errors.productUuid?.message} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel htmlFor="mp-preference">Preference</FormLabel>
                <Input
                  id="mp-preference"
                  type="number"
                  {...register("preference")}
                />
              </div>
              <div>
                <FormLabel htmlFor="mp-production-per-hour">
                  Production (per hour)
                </FormLabel>
                <Input
                  id="mp-production-per-hour"
                  type="number"
                  {...register("productionPerHour")}
                />
              </div>
            </div>

            <div>
              <FormLabel htmlFor="mp-prod-unit">Prod. U.</FormLabel>
              <Input id="mp-prod-unit" {...register("prodUnit")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel htmlFor="mp-min-corner">Min. Corner</FormLabel>
                <Input
                  id="mp-min-corner"
                  inputMode="decimal"
                  {...register("minCorner")}
                />
              </div>
              <div>
                <FormLabel htmlFor="mp-max-corner">Max. Corner</FormLabel>
                <Input
                  id="mp-max-corner"
                  inputMode="decimal"
                  {...register("maxCorner")}
                />
              </div>
            </div>

            <div>
              <FormLabel htmlFor="mp-days-in-system">Days in system</FormLabel>
              <Input
                id="mp-days-in-system"
                type="number"
                {...register("daysInSystem")}
              />
            </div>
          </DialogBody>

          <DialogFormFooter onCancel={onCancel} submitLabel="Add Product" />
        </form>
      </DialogContent>
    </Dialog>
  );
};
