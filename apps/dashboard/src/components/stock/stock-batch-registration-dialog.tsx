"use client";

import {
  registerStockBatch,
  StockLotDialogData,
  SupplierDeliveryRow,
} from "@/app/(dashboard)/stock/actions";
import {
  BatchRegistrationFormValues,
  batchRegistrationSchema,
} from "@/app/(dashboard)/stock/validation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { cn, formatDateColumn } from "@/lib/helpers";
import { STOCK_UNIT_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ellipsis } from "lucide-react";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type Props = {
  data: StockLotDialogData;
  deliveries: SupplierDeliveryRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * `Partijregistratie…` — the reference's `Voorraad partij correctie`.
 *
 * 🔑 **This is a picker, not a form**, and that is the finding. You choose the
 * supplier delivery this lot came in on, and **only two fields are yours**:
 * `Charge` and `Fabrieksnummer`. Order, line, receipt date, dimensions and
 * weight are all read off the purchase line and shown greyed.
 *
 * 🔑 **The delivery grid is per instalment, not per line.** The captured dialog
 * showed `403773/10` twice — 23 pieces at 1 610 kg and 25 at 1 754 kg, same
 * day, same heat — because each arrival was weighed separately. That is the
 * receival grain proved from a third direction.
 *
 * 🔑🔑 **`Charge` is the mill's heat number; the internal charge is ours.**
 * `112770` against `26AOSG` on the captured lot. Two identities, never
 * conflated, and ours is greyed here.
 *
 * 🔴 **There is no certificate field anywhere on this dialog**, which is what
 * `H11` was really asking about. A certificate is a stock option
 * (`2.1 Certificate`), which is why every certificate column on the batch
 * screens is empty.
 */
export const StockBatchRegistrationDialog = ({
  data,
  deliveries,
  open,
  onOpenChange,
}: Props) => {
  const { lot, ledger, weights } = data;
  const [state, dispatch, isPending] = useActionState(registerStockBatch, {});

  // The reference opens with the delivery this lot already hangs on selected
  // and `Partijkenmerken` filled (244: `403773`, `7-8-2026`), so `OK` is live
  // from the start. The receival is found by our internal charge first — it is
  // stamped per instalment — and by the purchase line after that.
  const linked =
    deliveries.find(
      (row) =>
        Boolean(lot.internalCharge) &&
        row.internalCharge === lot.internalCharge,
    ) ??
    deliveries.find(
      (row) =>
        Boolean(lot.purchaseOrderItemUuid) &&
        row.purchaseOrderItemUuid === lot.purchaseOrderItemUuid,
    ) ??
    null;

  const [picked, setPicked] = useState<SupplierDeliveryRow | null>(linked);

  const {
    register,
    reset,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<BatchRegistrationFormValues>({
    resolver: zodResolver(batchRegistrationSchema),
    defaultValues: {
      stockUuid: lot.uuid,
      purchaseLineReceivalUuid: linked?.receivalUuid ?? "",
      purchaseOrderItemUuid: linked?.purchaseOrderItemUuid ?? "",
      charge: lot.charge ?? linked?.charge ?? "",
      factoryNumber: lot.factoryNumber ?? "",
    },
  });

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  const choose = (row: SupplierDeliveryRow) => {
    setPicked(row);
    setValue("purchaseLineReceivalUuid", row.receivalUuid);
    setValue("purchaseOrderItemUuid", row.purchaseOrderItemUuid ?? "");
    // The charge comes off the delivery, because that is where it is stamped.
    // Still editable: the number is read off the certificate that came with the
    // metal, and the reception's own copy of it can be wrong.
    if (row.charge) {
      setValue("charge", row.charge);
    }
  };

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, stockUuid: lot.uuid });
    });
  });

  const unit = lot.unit ? STOCK_UNIT_LABELS[lot.unit] : "";
  // `Leverancier` above the grid — the supplier whose deliveries are listed,
  // which is the lot's own: the grid is narrowed to it.
  const supplierName = deliveries[0]?.supplierName ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Batch registration</DialogTitle>
            <DialogDescription>
              Say which supplier delivery this lot arrived on, and type the heat
              number off the certificate that came with it.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {/* ── Artikel / Voorraad — the lot being registered ───────────── */}
            {/* One row, the reference's thirteen columns (244). `Item Code` has
                no source we know of and reads blank. */}
            <div>
              <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Article / stock
              </p>
              <div className="overflow-x-auto rounded-lg border bg-muted/30">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Article</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Reserved</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">Length</TableHead>
                      <TableHead className="text-right">Width</TableHead>
                      <TableHead className="text-right">Thickness</TableHead>
                      <TableHead className="text-right">Kg</TableHead>
                      <TableHead>Charge</TableHead>
                      <TableHead>Internal charge</TableHead>
                      <TableHead>Item code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">
                        {lot.productCode ?? "—"}
                      </TableCell>
                      <TableCell>{lot.productName ?? "—"}</TableCell>
                      <TableCell>{lot.locationName ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {ledger.technical} {unit}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {ledger.reserved} {unit}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {ledger.available} {unit}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {lot.lengthMm ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {lot.widthMm ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {lot.thicknessMm ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {weights.theoreticalKg ?? "—"}
                      </TableCell>
                      <TableCell>{lot.charge ?? "—"}</TableCell>
                      <TableCell>{lot.internalCharge ?? "—"}</TableCell>
                      <TableCell>—</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* ── Inkoopleveringen — the deliveries it could have come from ── */}
            <div>
              <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Purchase deliveries
              </p>
              {/* `Leverancier` sits above the grid in the reference (244),
                  greyed with its `…` — the supplier is the lot's, not a
                  choice. */}
              <div className="mb-2 flex items-center gap-2">
                <p className="w-24 shrink-0 text-sm text-muted-foreground">
                  Supplier
                </p>
                <Input value={supplierName ?? ""} readOnly disabled />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Choose supplier"
                  disabled
                >
                  <Ellipsis className="size-4" />
                </Button>
              </div>
              {/* A row is chosen by clicking it, as in the reference — no
                  button per row. */}
              <div className="max-h-56 overflow-y-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Purchase order</TableHead>
                      <TableHead>Order line</TableHead>
                      <TableHead>Supplier code</TableHead>
                      <TableHead>Article code</TableHead>
                      <TableHead>Receipt date</TableHead>
                      <TableHead className="text-right">Length</TableHead>
                      <TableHead className="text-right">Width</TableHead>
                      <TableHead className="text-right">Qty (w)</TableHead>
                      <TableHead>Qty unit</TableHead>
                      <TableHead className="text-right">Kg (w)</TableHead>
                      <TableHead>Charge</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveries.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={11}
                          className="h-20 text-center text-muted-foreground"
                        >
                          No deliveries of this article from this lot’s
                          supplier.
                        </TableCell>
                      </TableRow>
                    ) : (
                      deliveries.map((row) => (
                        <TableRow
                          key={row.receivalUuid}
                          aria-selected={
                            picked?.receivalUuid === row.receivalUuid
                          }
                          onClick={() => choose(row)}
                          className={cn(
                            "cursor-pointer",
                            picked?.receivalUuid === row.receivalUuid &&
                              "bg-accent",
                          )}
                        >
                          <TableCell className="font-medium">
                            {row.purchaseOrderNumber ?? "—"}
                          </TableCell>
                          <TableCell>{row.lineNumber ?? "—"}</TableCell>
                          <TableCell>{row.supplierCode ?? "—"}</TableCell>
                          <TableCell>{row.productCode ?? "—"}</TableCell>
                          <TableCell>
                            {formatDateColumn(row.receiptDate)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.lengthMm ?? "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.widthMm ?? "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.qtyWeighed}
                          </TableCell>
                          <TableCell>
                            {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.kgWeighed}
                          </TableCell>
                          <TableCell>{row.charge ?? "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <FormFieldError
                message={errors.purchaseLineReceivalUuid?.message}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                One purchase line can appear several times — each arrival is
                weighed separately.
              </p>
            </div>

            {/* ── Partijkenmerken — only two fields are yours ─────────────── */}
            <div>
              <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Batch characteristics
              </p>
              <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-3">
                <div>
                  <p className="mb-1 block text-sm font-medium text-muted-foreground">
                    Purchase order
                  </p>
                  <Input
                    value={
                      picked
                        ? `${picked.purchaseOrderNumber ?? ""}${picked.lineNumber ? ` / ${picked.lineNumber}` : ""}`
                        : ""
                    }
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <p className="mb-1 block text-sm font-medium text-muted-foreground">
                    Receipt date
                  </p>
                  <Input
                    value={picked ? formatDateColumn(picked.receiptDate) : ""}
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <p className="mb-1 block text-sm font-medium text-muted-foreground">
                    Weight (kg)
                  </p>
                  <Input
                    value={picked ? String(picked.kgWeighed) : ""}
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <FormLabel htmlFor="batch-charge" required>
                    Charge (the mill’s)
                  </FormLabel>
                  <Input id="batch-charge" {...register("charge")} />
                  <FormFieldError message={errors.charge?.message} />
                </div>
                <div>
                  <FormLabel htmlFor="batch-factory-number">
                    Factory number
                  </FormLabel>
                  <Input
                    id="batch-factory-number"
                    {...register("factoryNumber")}
                  />
                  <FormFieldError message={errors.factoryNumber?.message} />
                </div>
                <div>
                  <p className="mb-1 block text-sm font-medium text-muted-foreground">
                    Internal charge (ours)
                  </p>
                  <Input value={lot.internalCharge ?? ""} readOnly disabled />
                </div>
                {/* The five greyed `Partijkenmerken` the reference also shows
                    (244). Length and width come off the delivery; inner size
                    and the two coil numbers are not stored here, so they read
                    blank. */}
                <div>
                  <p className="mb-1 block text-sm font-medium text-muted-foreground">
                    Length
                  </p>
                  <Input
                    value={
                      picked && picked.lengthMm !== null
                        ? String(picked.lengthMm)
                        : ""
                    }
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <p className="mb-1 block text-sm font-medium text-muted-foreground">
                    Width
                  </p>
                  <Input
                    value={
                      picked && picked.widthMm !== null
                        ? String(picked.widthMm)
                        : ""
                    }
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <p className="mb-1 block text-sm font-medium text-muted-foreground">
                    Inner size
                  </p>
                  <Input value="" readOnly disabled />
                </div>
                <div>
                  <p className="mb-1 block text-sm font-medium text-muted-foreground">
                    Coil number
                  </p>
                  <Input value="" readOnly disabled />
                </div>
                <div>
                  <p className="mb-1 block text-sm font-medium text-muted-foreground">
                    Coil sequence number
                  </p>
                  <Input value="" readOnly disabled />
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                There is no certificate field here. A certificate is a stock
                option — “2.1 Certificate” on the options dialog.
              </p>
            </div>

            <FormError>{state.error}</FormError>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setPicked(linked);
                onOpenChange(false);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !picked}>
              {isPending ? "Registering…" : "OK"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
