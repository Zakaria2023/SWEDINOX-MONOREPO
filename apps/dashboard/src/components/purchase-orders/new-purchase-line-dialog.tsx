"use client";

import { startTransition, useActionState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addPurchaseOrderLine } from "@/app/(dashboard)/purchase-orders/actions";
import {
  PurchaseOrderLineFormValues,
  purchaseOrderLineSchema,
} from "@/app/(dashboard)/purchase-orders/validation";
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
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { ProductSearchField } from "@/components/ui/product-search-field";
import { positiveMmString } from "@/lib/helpers";

type Props = {
  purchaseOrderUuid: string;
  /** A `Processing` line is € 0,00 per TN; its price sits on its options. */
  isProcessing: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * `New` on a saved, still provisional order's line grid: the article is
 * chosen in the Stock window — searching the catalogue, as every buying line
 * does — and the line takes its size, quality and unit from it.
 */
export const NewPurchaseLineDialog = ({
  purchaseOrderUuid,
  isProcessing,
  open,
  onOpenChange,
}: Props) => {
  const [state, dispatch, isPending] = useActionState(addPurchaseOrderLine, {});

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<PurchaseOrderLineFormValues>({
    resolver: zodResolver(purchaseOrderLineSchema),
    defaultValues: {
      purchaseOrderUuid,
      productUuid: "",
      quantity: "",
      netPrice: "0",
      priceUnit: "",
    },
  });

  useEffect(() => {
    if (state.success) {
      reset({
        purchaseOrderUuid,
        productUuid: "",
        quantity: "",
        netPrice: "0",
        priceUnit: "",
      });
      onOpenChange(false);
    }
  }, [state, reset, purchaseOrderUuid, onOpenChange]);

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, purchaseOrderUuid });
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>New line</DialogTitle>
            <DialogDescription>
              Choose the article in the Stock window, then say how many.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <FormLabel htmlFor="newLineProduct" required>
                Product
              </FormLabel>
              <Controller
                control={control}
                name="productUuid"
                render={({ field }) => (
                  <ProductSearchField
                    id="newLineProduct"
                    value={field.value || ""}
                    sources={["catalogue", "purchase"]}
                    invalid={!!errors.productUuid}
                    onChange={(choice) => {
                      field.onChange(choice.productUuid);
                      setValue("productLabel", choice.productCode ?? "");
                      setValue("unit", choice.unit ?? "");
                      setValue("qualityCode", choice.quality ?? "");
                      setValue("lengthMm", positiveMmString(choice.lengthMm));
                      setValue("widthMm", positiveMmString(choice.widthMm));
                      setValue(
                        "thicknessMm",
                        positiveMmString(choice.thicknessMm),
                      );
                      if (!getValues("priceUnit")) {
                        setValue("priceUnit", choice.purchasingUnit ?? "TN");
                      }
                    }}
                  />
                )}
              />
              <FormFieldError message={errors.productUuid?.message} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <FormLabel htmlFor="newLineQuantity" required>
                  Qty(p)
                </FormLabel>
                <Input
                  id="newLineQuantity"
                  inputMode="decimal"
                  {...register("quantity")}
                />
                <FormFieldError message={errors.quantity?.message} />
              </div>
              <div>
                <FormLabel htmlFor="newLineNetPrice">Net Price</FormLabel>
                <Input
                  id="newLineNetPrice"
                  inputMode="decimal"
                  disabled={isProcessing}
                  {...register("netPrice")}
                />
                <FormFieldError message={errors.netPrice?.message} />
              </div>
              <div>
                <FormLabel htmlFor="newLinePriceUnit">U</FormLabel>
                <Input
                  id="newLinePriceUnit"
                  disabled={isProcessing}
                  {...register("priceUnit")}
                />
              </div>
            </div>
            <FormError>{state.error}</FormError>
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
              {isPending ? "Saving…" : "OK"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
