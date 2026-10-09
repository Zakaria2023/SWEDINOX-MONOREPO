"use client";

import {
  addPurchaseReturnLines,
  getReturnableLotsForReturn,
  ReturnablePurchaseLine,
} from "@/app/(dashboard)/purchase-return-orders/actions";
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
import { Input } from "@/components/shadcn/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { FormError } from "@/components/ui/form-error";
import { formatDateColumn, formatNumber, orDash } from "@/lib/helpers";
import { useEffect, useState, useTransition } from "react";

type Props = {
  purchaseReturnOrderUuid: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * `Create Purchase Return order lines` — what goes back, parcel by parcel.
 *
 * 🔑 Captured on return `950034`, 7-10-2026. The picker lists **one row per
 * parcel received**, not per order line: line `220` appeared twice and `230`
 * three times, each with its own quantity and heat (`25036/122`, and a second
 * heat on line `250`). What goes back is a particular parcel of a particular
 * heat, which is what the supplier needs to credit it.
 *
 * It opens on the **latest delivery** and widens with `All receipts`, as the
 * reference's does.
 */
export const ReturnLinesPickerDialog = ({
  purchaseReturnOrderUuid,
  open,
  onOpenChange,
}: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [lots, setLots] = useState<ReturnablePurchaseLine[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [picked, setPicked] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }
    const subscription = { cancelled: false };
    void getReturnableLotsForReturn(purchaseReturnOrderUuid).then((rows) => {
      if (!subscription.cancelled) {
        setLots(rows);
        setPicked({});
        setShowAll(false);
        setError(undefined);
      }
    });
    return () => {
      subscription.cancelled = true;
    };
  }, [open, purchaseReturnOrderUuid]);

  const latest = lots.reduce<string | null>(
    (max, lot) =>
      lot.receiptDate && (!max || lot.receiptDate > max) ? lot.receiptDate : max,
    null,
  );
  const visible = showAll
    ? lots
    : lots.filter((lot) => latest === null || lot.receiptDate === latest);

  const toggle = (lot: ReturnablePurchaseLine, checked: boolean) => {
    const key = lot.stockUuid;
    if (!key) {
      return;
    }
    setPicked((current) => {
      const next = { ...current };
      if (checked) {
        next[key] = lot.availableQuantity;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const onConfirm = () => {
    startTransition(async () => {
      const result = await addPurchaseReturnLines(
        purchaseReturnOrderUuid,
        Object.entries(picked).map(([stockUuid, returnQty]) => ({
          stockUuid,
          returnQty,
        })),
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create purchase return order lines</DialogTitle>
          <DialogDescription>
            Tick the parcels going back. Each one is a lot of its own, with
            the heat it arrived under.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3">
          {lots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing received on this order is still on the shelf to send
              back.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead />
                  <TableHead className="text-right">Line</TableHead>
                  <TableHead>Receipt date</TableHead>
                  <TableHead>Bill of lading</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>U</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Length</TableHead>
                  <TableHead className="text-right">Width</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead className="text-right">Return qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((lot) => {
                  const key = lot.stockUuid ?? "";
                  const isPicked = key in picked;
                  return (
                    <TableRow key={key}>
                      <TableCell>
                        <Checkbox
                          checked={isPicked}
                          onChange={(event) => toggle(lot, event.target.checked)}
                          aria-label={`Return line ${lot.lineNumber ?? ""}`}
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {lot.lineNumber === null ? "—" : lot.lineNumber * 10}
                      </TableCell>
                      <TableCell>{formatDateColumn(lot.receiptDate)}</TableCell>
                      <TableCell>{orDash(lot.billOfLading)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(lot.availableQuantity))}
                      </TableCell>
                      <TableCell>{orDash(lot.unit ? lot.unit.toUpperCase() : null)}</TableCell>
                      <TableCell>
                        {[lot.productCode, lot.productName]
                          .filter(Boolean)
                          .join(" — ")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {orDash(lot.lengthMm)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {orDash(lot.widthMm)}
                      </TableCell>
                      <TableCell>{orDash(lot.charge)}</TableCell>
                      <TableCell className="w-28">
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          disabled={!isPicked}
                          value={picked[key] ?? ""}
                          onChange={(event) =>
                            setPicked((current) => ({
                              ...current,
                              [key]: event.target.value,
                            }))
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <FormError>{error}</FormError>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAll((value) => !value)}
            disabled={lots.length === 0}
          >
            {showAll ? "Latest receipt" : "All receipts"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPending || Object.keys(picked).length === 0}
          >
            {isPending ? "Adding…" : "OK"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
