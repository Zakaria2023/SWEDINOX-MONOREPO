"use client";

import { CustomerStockDialogValues } from "@/app/(dashboard)/companies/validation";
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
import { Select } from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";
import { DialogFormFooter } from "@/components/ui/dialog-form-footer";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { customerStockReasons } from "@/lib/enums";
import { CUSTOMER_STOCK_REASON_LABELS } from "@/lib/labels";
import { Boxes } from "lucide-react";
import { FormEventHandler } from "react";
import { Controller, UseFormReturn } from "react-hook-form";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSave: FormEventHandler<HTMLFormElement>;
  form: UseFormReturn<CustomerStockDialogValues>;
  selectedProduct: ProductOption | null;
  onBrowse: () => void;
  submitLabel?: string;
};

export const CustomerStockDialog = ({
  isOpen,
  onOpenChange,
  onCancel,
  onSave,
  form,
  selectedProduct,
  onBrowse,
  submitLabel = "Book Stock",
}: Props) => {
  const { register, formState, control } = form;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Boxes className="size-4" />
            Book Customer Stock
          </DialogTitle>
          <DialogDescription>
            Book stock this customer keeps at one of our locations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSave}>
          <DialogBody className="space-y-4">
            <div>
              <FormLabel htmlFor="cs-location">Location</FormLabel>
              <Input
                id="cs-location"
                {...register("location")}
                placeholder="Location"
              />
            </div>

            <div>
              <FormLabel required>Product</FormLabel>
              <button
                type="button"
                onClick={onBrowse}
                className="mt-1.5 flex h-9 w-full items-center justify-between rounded-lg border border-input px-3 text-sm hover:border-primary"
              >
                <span className="line-clamp-1">
                  {selectedProduct
                    ? `${selectedProduct.productCode} — ${selectedProduct.name}`
                    : "Browse products…"}
                </span>
              </button>
              <FormFieldError message={formState.errors.productUuid?.message} />
            </div>

            <div>
              <FormLabel htmlFor="cs-quantity">Quantity</FormLabel>
              <Input
                id="cs-quantity"
                inputMode="decimal"
                {...register("quantity")}
              />
            </div>

            <div>
              <FormLabel htmlFor="cs-reason" required>
                Reason
              </FormLabel>
              <Controller
                name="reason"
                control={control}
                render={({ field }) => (
                  <Select
                    id="cs-reason"
                    options={[
                      { value: "", label: "Empty" },
                      ...customerStockReasons.map((reason) => ({
                        value: reason,
                        label: CUSTOMER_STOCK_REASON_LABELS[reason],
                      })),
                    ]}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder="Select"
                  />
                )}
              />
              <FormFieldError message={formState.errors.reason?.message} />
            </div>

            <div>
              <FormLabel htmlFor="cs-description">
                Stock mutation description
              </FormLabel>
              <Textarea id="cs-description" {...register("description")} />
            </div>
          </DialogBody>

          <DialogFormFooter onCancel={onCancel} submitLabel={submitLabel} />
        </form>
      </DialogContent>
    </Dialog>
  );
};
