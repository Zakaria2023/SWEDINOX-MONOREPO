"use client";

import {
  InternalChargeOption,
  PurchaseReceiptDocument,
  updateReceptionCharge,
} from "@/app/(dashboard)/purchase-orders/actions";
import {
  ReceptionChargeFormValues,
  receptionChargeSchema,
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
import { Select } from "@/components/shadcn/select";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { orDash } from "@/lib/helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

type Props = {
  reception: PurchaseReceiptDocument;
  internalCharges: InternalChargeOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * `Charge aanpassen…` — the reference's "change the heat number" dialog,
 * captured 6-10-2026 off purchase order `404150/10`.
 *
 * 🔑 **Current beside new, three rows against three.** The dialog states what
 * the reception says now and what it will say. That is the shape a correction
 * to an *identity* has to take: you are not nudging a number, you are replacing
 * a claim about which metal this is, and the person doing it has to be able to
 * see what they are overwriting.
 *
 * | Field | Reference | Editable |
 * |---|---|---|
 * | `Huidige Charge` | `110600` | read-only |
 * | `Huidig Plaatnummer` | *(empty)* | read-only |
 * | `Huidige interne Charge` | `26AQPW` | read-only |
 * | `Nieuwe Charge` | `110600`, prefilled | ✏️ |
 * | `Nieuw Plaatnummer` | *(empty)* | ✏️ |
 * | `Nieuwe interne Charge` | *(empty)* | a `Selecteer` picker |
 *
 * 🔑 **`Plaatnummer` is editable on a reception**, which is where
 * `Stock.plateNumber` was always supposed to come from — it had never been
 * populated because nothing wrote it.
 *
 * ⚠️ **This is not the lot dialog.** `Voorraad partij correctie` hangs off a
 * stock lot and pairs `Charge` with `Fabrieksnummer`; this hangs off a reception
 * and pairs it with `Plaatnummer`. The reference keeps them apart and so do we —
 * `Fabrieksnummer` and `Plaatnummer` are not the same field.
 */
export const ReceptionChargeDialog = ({
  reception,
  internalCharges,
  open,
  onOpenChange,
}: Props) => {
  const [state, dispatch, isPending] = useActionState(updateReceptionCharge, {});

  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<ReceptionChargeFormValues>({
    resolver: zodResolver(receptionChargeSchema),
    defaultValues: {
      receivalUuid: reception.uuid,
      // The reference prefills the new charge with the current one, so the
      // common case — a typo in a six-digit melt number — is an edit rather
      // than a re-key, and a blank box means "clear it" on purpose.
      charge: reception.charge ?? "",
      plateNumber: reception.plateNumber ?? "",
      internalCharge: reception.internalCharge ?? "",
    },
  });

  // Reopening on a different row must restate that row, not the last one.
  useEffect(() => {
    reset({
      receivalUuid: reception.uuid,
      charge: reception.charge ?? "",
      plateNumber: reception.plateNumber ?? "",
      internalCharge: reception.internalCharge ?? "",
    });
  }, [reception, reset]);

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, receivalUuid: reception.uuid });
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adjust charge</DialogTitle>
          <DialogDescription>
            Which metal this reception is. Replacing a charge replaces the
            certificate the goods will be traced to, so what it says now is
            shown beside what it will say.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <DialogBody className="space-y-4">
            {/* The read-only half. Greyed, as the reference greys it: it is
                context for the decision, not part of the form. */}
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                As it stands
              </p>
              <dl className="mt-2 grid gap-2 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted-foreground">Charge</dt>
                  <dd className="text-sm font-medium">
                    {orDash(reception.charge)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Plate number
                  </dt>
                  <dd className="text-sm font-medium">
                    {orDash(reception.plateNumber)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Internal charge
                  </dt>
                  <dd className="text-sm font-medium">
                    {orDash(reception.internalCharge)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <FormLabel htmlFor="reception-charge">New charge</FormLabel>
                <Input id="reception-charge" {...register("charge")} />
                <FormFieldError message={errors.charge?.message} />
              </div>
              <div>
                <FormLabel htmlFor="reception-plate-number">
                  New plate number
                </FormLabel>
                <Input
                  id="reception-plate-number"
                  {...register("plateNumber")}
                />
                <FormFieldError message={errors.plateNumber?.message} />
              </div>
              <div>
                <FormLabel htmlFor="reception-internal-charge">
                  New internal charge
                </FormLabel>
                {/* Chosen, never typed — an internal charge is issued when
                    goods are received, and a text box here would let somebody
                    mint a second identity for metal that already has one. */}
                <Controller
                  control={control}
                  name="internalCharge"
                  render={({ field }) => (
                    <Select
                      id="reception-internal-charge"
                      value={field.value ?? ""}
                      placeholder="Leave unchanged"
                      options={internalCharges.map((row) => ({
                        value: row.internalCharge,
                        label: row.internalCharge,
                      }))}
                      onValueChange={field.onChange}
                    />
                  )}
                />
                <FormFieldError message={errors.internalCharge?.message} />
              </div>
            </div>

            <FormError>{state.error}</FormError>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
