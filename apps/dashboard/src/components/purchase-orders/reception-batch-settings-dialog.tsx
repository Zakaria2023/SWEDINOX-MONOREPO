"use client";

import {
  PurchaseReceiptDocument,
  updateReceptionBatchSettings,
} from "@/app/(dashboard)/purchase-orders/actions";
import {
  ReceptionBatchSettingsFormValues,
  receptionBatchSettingsSchema,
} from "@/app/(dashboard)/purchase-orders/validation";
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
import { FormError } from "@/components/ui/form-error";
import { formatDateColumn, formatNumber, orDash } from "@/lib/helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { TriangleAlert } from "lucide-react";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";

type Props = {
  orderCode: string;
  reception: PurchaseReceiptDocument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * `Partijregistratie instellingen` — batch registration *settings*.
 *
 * 🔴 **Pressing `Batch registration` on a reception does not open the
 * registration form.** That was the assumption, and the 6-10-2026 capture
 * disproved it. Every field on this dialog is read-only — order, article,
 * dimensions and weight, receipt date, internal charge, charge — and the only
 * control on it is a single checkbox under the heading
 * `Document verplichtingen negeren`:
 *
 * > ☐ `Document verplichtigingen negeren op bovenstaande ontvangst.`
 * > *"Indien dit aangezet wordt zal het voor deze ontvangst niet meer verplicht
 * > zijn om een document te koppelen. Hierdoor verdwijnt de regel mogelijk uit
 * > het zicht."*
 *
 * 🔑 **There are two `Partijregistratie` dialogs on two different objects.** The
 * one on a stock lot (`Voorraad partij correctie`) picks which supplier delivery
 * the lot came from and takes `Charge` + `Fabrieksnummer`. This one, on a
 * purchase reception, waives the certificate requirement. What we built on
 * 6-10-2026 was the first; this is the second.
 *
 * 🔑 **This is what writes `documentObligationWaived`**, a column that has
 * existed since the receipt chain was built and that nothing had ever set. It is
 * the mechanism behind the `documents` block reason, and the reference's own
 * warning says what it then does: the reception drops off the worklists that
 * chase missing paperwork — `Certificates to be linked` and `Deliveries from
 * missing batch`. That warning is restated here rather than paraphrased away,
 * because it is the entire reason this is a dialog and not a tickbox in a grid.
 */
export const ReceptionBatchSettingsDialog = ({
  orderCode,
  reception,
  open,
  onOpenChange,
}: Props) => {
  const [state, dispatch, isPending] = useActionState(
    updateReceptionBatchSettings,
    {},
  );

  const { register, reset, handleSubmit } =
    useForm<ReceptionBatchSettingsFormValues>({
      resolver: zodResolver(receptionBatchSettingsSchema),
      defaultValues: {
        receivalUuid: reception.uuid,
        documentObligationWaived: reception.documentObligationWaived ?? false,
      },
    });

  useEffect(() => {
    reset({
      receivalUuid: reception.uuid,
      documentObligationWaived: reception.documentObligationWaived ?? false,
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

  // `Afmetingen / gewicht` on the reference reads `19x0,8 / 158 KG(w)` — the
  // line's width by its thickness, then the weight actually received.
  const dimensions = [reception.widthMm, reception.thicknessMm]
    .filter((value) => value !== null && value !== undefined)
    .map((value) => formatNumber(Number(value)))
    .join(" × ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Batch registration settings</DialogTitle>
          <DialogDescription>
            Whether this reception may be used before its paperwork arrives.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <DialogBody className="space-y-4">
            {/* Which reception is being settled. All read-only, as the
                reference has it: the dialog identifies the parcel so that the
                one decision below is made against the right metal. */}
            <dl className="grid gap-3 rounded-lg border bg-muted/40 p-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Order</dt>
                <dd className="text-sm font-medium">{orderCode}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Article</dt>
                <dd className="text-sm font-medium">
                  {[reception.productCode, reception.productName]
                    .filter(Boolean)
                    .join(" — ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  Dimensions / weight
                </dt>
                <dd className="text-sm font-medium">
                  {[
                    dimensions || null,
                    `${formatNumber(Number(reception.kgActual ?? 0))} kg`,
                  ]
                    .filter(Boolean)
                    .join(" / ")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Receipt date</dt>
                <dd className="text-sm font-medium">
                  {formatDateColumn(reception.receiptDate)}
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
              <div>
                <dt className="text-xs text-muted-foreground">Charge</dt>
                <dd className="text-sm font-medium">
                  {orDash(reception.charge)}
                </dd>
              </div>
            </dl>

            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium">Ignore document obligations</p>
              <label className="mt-2 flex items-start gap-2 text-sm">
                <Checkbox
                  className="mt-0.5"
                  {...register("documentObligationWaived")}
                />
                <span>
                  Ignore document obligations on the reception above.
                </span>
              </label>
              {/* The reference's own warning, kept rather than summarised. It
                  is the reason this setting is a dialog: switching it on hides
                  the reception from the screens whose whole job is to chase
                  the paperwork it is now missing. */}
              <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                <span>
                  Switching this on means no document need be linked to this
                  reception — and it will drop off the screens that chase
                  missing paperwork, so it may disappear from view.
                </span>
              </p>
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
