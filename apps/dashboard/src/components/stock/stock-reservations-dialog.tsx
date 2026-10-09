"use client";

import {
  deleteLotReservation,
  StockLotDialogData,
} from "@/app/(dashboard)/stock/actions";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { FormError } from "@/components/ui/form-error";
import { cn, formatDateColumn } from "@/lib/helpers";
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_TYPE_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";
import { ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";

type Props = {
  data: StockLotDialogData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * `Reserveringen…` on a lot — and the whole of H2's answer.
 *
 * 🔴 **The reference has no `New` button here.** The toolbar is `Order` ·
 * `Verwijder` and nothing else. H2 asked whether a reservation can be created
 * by hand and the system's answer is no: a reservation is *made by a sales
 * order*, and the only manual act available is destroying one.
 *
 * So the create-a-reservation form we had built does not correspond to anything
 * and is gone. What replaces it is these two:
 *
 * - **Order** — follow the reservation to the order that caused it
 * - **Release** — destroy the claim and give the metal back
 *
 * 🔑 `Order/R…` in the reference is order number *and* line in one cell
 * (`O107163/20`). Here they arrive separately and are joined for display, so
 * the cell can still link through.
 *
 * Both act on the selected row from a toolbar above the grid (245), `Verwijder`
 * greyed until a row is picked — never a column of buttons per row. The
 * columns are the reference's eight, `Gewijzigd` last.
 */
export const StockReservationsDialog = ({ data, open, onOpenChange }: Props) => {
  const { lot, reservations } = data;
  const [state, release, isReleasing] = useActionState(
    deleteLotReservation,
    {},
  );
  const [confirming, setConfirming] = useState<string | null>(null);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const selected =
    reservations.find((row) => row.uuid === selectedUuid) ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Reservations — {lot.locationName ?? "no location"}{" "}
            {lot.productName ?? ""}
          </DialogTitle>
          <DialogDescription>
            Who has claimed this lot. Reservations are made by sales orders, so
            there is nothing to add here — only an order to follow, or a claim to
            release.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {selected?.orderUuid ? (
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/orders/${selected.orderUuid}`} />}
              >
                <ExternalLink className="size-4" />
                Order
              </Button>
            ) : (
              <Button type="button" variant="outline" size="sm" disabled>
                <ExternalLink className="size-4" />
                Order
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!selected || isReleasing}
              onClick={() => setConfirming(selected ? selected.uuid : null)}
            >
              <Trash2 className="size-4" />
              Release
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Order / line</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Modified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-20 text-center text-muted-foreground"
                  >
                    Nothing has claimed this lot.
                  </TableCell>
                </TableRow>
              ) : (
                reservations.map((row) => (
                  <TableRow
                    key={row.uuid}
                    aria-selected={row.uuid === selectedUuid}
                    onClick={() => setSelectedUuid(row.uuid)}
                    className={cn(
                      "cursor-pointer",
                      row.uuid === selectedUuid && "bg-accent",
                    )}
                  >
                    <TableCell>{RESERVATION_TYPE_LABELS[row.type]}</TableCell>
                    <TableCell>
                      {RESERVATION_STATUS_LABELS[row.status]}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.quantity}
                    </TableCell>
                    <TableCell>{STOCK_UNIT_LABELS[row.unit]}</TableCell>
                    <TableCell className="font-medium">
                      {row.orderNumber
                        ? `O${row.orderNumber}${row.lineNumber ? `/${row.lineNumber}` : ""}`
                        : "—"}
                    </TableCell>
                    <TableCell>{row.companyName ?? "—"}</TableCell>
                    <TableCell>{formatDateColumn(row.reservedFor)}</TableCell>
                    {/* `Gewijzigd` — when the claim last changed. */}
                    <TableCell>
                      {formatDateColumn(row.changedAt ?? row.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {confirming ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <p className="text-sm">
                Releasing a reservation gives the metal back to the shelf. The
                order that was holding it keeps its line, but nothing is set
                aside for it any more.
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirming(null)}
                >
                  Keep it
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isReleasing}
                  onClick={() =>
                    startTransition(() => {
                      release({ reservationUuid: confirming });
                      setConfirming(null);
                      setSelectedUuid(null);
                    })
                  }
                >
                  {isReleasing ? "Releasing…" : "Release"}
                </Button>
              </div>
            </div>
          ) : null}

          <FormError>{state.error}</FormError>
        </DialogBody>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
