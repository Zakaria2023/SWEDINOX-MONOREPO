"use client";

import { CustomerProductDialogValues } from "@/app/(dashboard)/companies/validation";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
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
  form: UseFormReturn<CustomerProductDialogValues>;
  selectedProduct: ProductOption | null;
  onBrowse: () => void;
};

export const CustomerProductDialog = ({
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
            Add Customer-Specific Product
          </DialogTitle>
          <DialogDescription>
            Pick a product to make available for this customer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSave}>
          <DialogBody className="space-y-4">
            <div>
              <FormLabel required>Product</FormLabel>
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cust-prod-show-on-website"
                {...register("showOnWebsite")}
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="cust-prod-show-on-website" className="text-sm">
                Show on website
              </label>
            </div>
          </DialogBody>

          <DialogFormFooter onCancel={onCancel} submitLabel="Add Product" />
        </form>
      </DialogContent>
    </Dialog>
  );
};
