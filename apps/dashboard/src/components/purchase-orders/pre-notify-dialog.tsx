"use client";

import { preNotifyPurchaseOrder } from "@/app/(dashboard)/purchase-orders/actions";
import {
  PreNotifyFormValues,
  preNotifySchema,
} from "@/app/(dashboard)/purchase-orders/validation";
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
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { todayDateString } from "@/lib/helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

type Props = {
  purchaseOrderUuid: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * `Pre-notifiy` (sic) on the reference's purchase order toolbar: the supplier
 * has advised when the goods are coming. The date lands on every reception of
 * the order that has not arrived yet, as `Pre-announced delivery`.
 */
export const PreNotifyDialog = ({
  purchaseOrderUuid,
  open,
  onOpenChange,
}: Props) => {
  const [state, dispatch, isPending] = useActionState(
    preNotifyPurchaseOrder,
    {},
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PreNotifyFormValues>({
    resolver: zodResolver(preNotifySchema),
    defaultValues: { purchaseOrderUuid, advisedDate: todayDateString() },
  });

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, purchaseOrderUuid });
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pre-notify</DialogTitle>
          <DialogDescription>
            The delivery date the supplier has advised. Receptions that have
            already arrived keep their own dates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <DialogBody className="space-y-4">
            {state.error && <FormError>{state.error}</FormError>}
            <div className="space-y-1.5">
              <FormLabel htmlFor="advisedDate">Pre-announced delivery</FormLabel>
              <Controller
                name="advisedDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    id="advisedDate"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
              <FormFieldError message={errors.advisedDate?.message} />
            </div>
          </DialogBody>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Pre-notify"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
