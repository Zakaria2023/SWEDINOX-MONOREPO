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
import { formatDateColumn } from "@/lib/helpers";
import { STOCK_UNIT_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
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
  const { lot } = data;
  const [state, dispatch, isPending] = useActionState(registerStockBatch, {});
  const [picked, setPicked] = useState<SupplierDeliveryRow | null>(null);

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
      purchaseLineReceivalUuid: "",
      purchaseOrderItemUuid: "",
      charge: lot.charge ?? "",
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
            <div>
              <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Article / stock
              </p>
              <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Code</p>
                  <p className="text-sm">{lot.productCode ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm">{lot.locationName ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="text-sm">
                    {lot.quantity} {unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Internal charge (ours)
                  </p>
                  <p className="text-sm">{lot.internalCharge ?? "—"}</p>
                </div>
              </div>
            </div>

            {/* ── Inkoopleveringen — the deliveries it could have come from ── */}
            <div>
              <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Purchase deliveries
              </p>
              <div className="max-h-56 overflow-y-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Line</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead className="text-right">L</TableHead>
                      <TableHead className="text-right">W</TableHead>
                      <TableHead className="text-right">Qty (w)</TableHead>
                      <TableHead className="text-right">Kg (w)</TableHead>
                      <TableHead>Charge</TableHead>
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveries.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={10}
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
                          className={
                            picked?.receivalUuid === row.receivalUuid
                              ? "bg-accent"
                              : ""
                          }
                        >
                          <TableCell className="font-medium">
                            {row.purchaseOrderNumber ?? "—"}
                          </TableCell>
                          <TableCell>{row.lineNumber ?? "—"}</TableCell>
                          <TableCell>
                            {row.supplierCode ?? "—"}
                            {row.supplierName ? ` · ${row.supplierName}` : ""}
                          </TableCell>
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
                          <TableCell className="text-right tabular-nums">
                            {row.kgWeighed}
                          </TableCell>
                          <TableCell>{row.charge ?? "—"}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => choose(row)}
                            >
                              Pick
                            </Button>
                          </TableCell>
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
                setPicked(null);
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
