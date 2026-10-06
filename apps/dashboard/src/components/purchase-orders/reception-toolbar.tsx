"use client";

import {
  deleteReception,
  getInternalChargeOptions,
  InternalChargeOption,
  PurchaseReceiptDocument,
} from "@/app/(dashboard)/purchase-orders/actions";
import { Button } from "@/components/shadcn/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import { receptionActions } from "@/lib/helpers";
import { FileText, Scissors, Tag, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { ReceptionBatchSettingsDialog } from "./reception-batch-settings-dialog";
import { ReceptionChargeDialog } from "./reception-charge-dialog";

type Props = {
  orderId: number;
  selected: PurchaseReceiptDocument | null;
};

/**
 * The reference's reception toolbar, above the grid and acting on the selected
 * row — `New · Delete · Split · Batch registration · Charge aanpassen…`.
 *
 * 🔑 **The enablement rule was captured by driving it, not guessed.** Both
 * receptions on order `404150/10` were selected in turn on 6-10-2026 and the
 * toolbar photographed each time. Four buttons flip, which is what proves the
 * toolbar reads the selection at all, and the rule they flip on is a single
 * question — *are the goods here?* — not the one that had been predicted. It
 * lives in `receptionActions`, beside the status table it is derived from, so
 * this component states no policy of its own.
 *
 * ⚠️ `New` is not offered. It was greyed on both rows, so what wakes it is
 * unknown, and a button whose rule we cannot state is worse than no button.
 *
 * ⚠️ `Split` is shown but permanently disabled, with the reason beneath it. It
 * was greyed on **both** rows while the others flipped, so it is gated on the
 * *order* rather than the reception — H13, still open. Showing it disabled with
 * an explanation is the honest rendering of a known unknown; hiding it would
 * quietly lose the finding.
 */
export const ReceptionToolbar = ({ orderId, selected }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [isChargeOpen, setIsChargeOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [internalCharges, setInternalCharges] = useState<
    InternalChargeOption[]
  >([]);

  // Fetched when the dialog is first wanted rather than with the page: the
  // registry is read by one dialog on one row, and every purchase order would
  // otherwise pay for it.
  useEffect(() => {
    if (!isChargeOpen) {
      return;
    }
    const subscription = { cancelled: false };
    void getInternalChargeOptions().then((rows) => {
      if (!subscription.cancelled) {
        setInternalCharges(rows);
      }
    });
    return () => {
      subscription.cancelled = true;
    };
  }, [isChargeOpen]);

  const permitted = receptionActions(selected?.receiptStatus ?? null);
  const hasSelection = selected !== null;

  const onDelete = () => {
    if (!selected) {
      return;
    }
    startTransition(async () => {
      const result = await deleteReception(selected.uuid);
      setError(result.error);
      setIsDeleteOpen(false);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!hasSelection || !permitted.canRegisterBatch}
          onClick={() => setIsBatchOpen(true)}
        >
          <FileText size={16} />
          Batch registration
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!hasSelection || !permitted.canAdjustCharge}
          onClick={() => setIsChargeOpen(true)}
        >
          <Tag size={16} />
          Adjust charge
        </Button>
        <Button type="button" variant="outline" disabled>
          <Scissors size={16} />
          Split
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={!hasSelection || !permitted.canDelete || isPending}
          onClick={() => setIsDeleteOpen(true)}
        >
          <Trash2 size={16} />
          Delete
        </Button>
      </div>

      {/* Why a button is asleep, in a sentence. The reference says nothing at
          all here, and the cost of that was two separate hunts for a rule that
          a single line of text would have stated. */}
      <div className="space-y-1 text-xs text-muted-foreground">
        {!hasSelection && <p>Select a reception to act on it.</p>}
        {hasSelection && permitted.stampReason && (
          <p>{permitted.stampReason}</p>
        )}
        {hasSelection && permitted.deleteReason && (
          <p>{permitted.deleteReason}</p>
        )}
        <p>{permitted.splitReason}</p>
      </div>

      <FormError>{error}</FormError>

      {selected && (
        <ReceptionChargeDialog
          reception={selected}
          internalCharges={internalCharges}
          open={isChargeOpen}
          onOpenChange={setIsChargeOpen}
        />
      )}
      {selected && (
        <ReceptionBatchSettingsDialog
          /* The reference titles this `404150/10` — the order, then the
             line the reception hangs off. */
          orderCode={`${orderId}/${selected.lineNumber ?? "—"}`}
          reception={selected}
          open={isBatchOpen}
          onOpenChange={setIsBatchOpen}
        />
      )}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete this reception?"
        description="Nothing has arrived against it, so deleting it removes the promise of the goods. The order line stays as it is."
        confirmLabel="Delete"
        isPending={isPending}
        onConfirm={onDelete}
      />
    </div>
  );
};
