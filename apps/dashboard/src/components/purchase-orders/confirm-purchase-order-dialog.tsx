"use client";

import {
  confirmPurchaseOrder,
  PurchaseOrderItemDetail,
} from "@/app/(dashboard)/purchase-orders/actions";
import {
  ConfirmPurchaseOrderFormValues,
  confirmPurchaseOrderSchema,
} from "@/app/(dashboard)/purchase-orders/validation";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
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
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
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
import {
  formatDateColumn,
  formatMoney,
  formatNumber,
  orDash,
  todayDateString,
} from "@/lib/helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type Props = {
  purchaseOrderUuid: string;
  purchaseOrderId: number;
  items: PurchaseOrderItemDetail[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * `Confirm purchase order` (C16, captured on 404299 8-10-2026).
 *
 * "Copy these values into the selected order lines below": a confirmation
 * number, a confirmation date (today by default), the delivery date the
 * supplier confirmed and their document — onto the lines that are ticked.
 * `Change confirmation` re-picks a confirmation already on the order and ticks
 * its lines. `OK` stays greyed until a line is ticked.
 */
export const ConfirmPurchaseOrderDialog = ({
  purchaseOrderUuid,
  purchaseOrderId,
  items,
  open,
  onOpenChange,
}: Props) => {
  const [state, dispatch, isPending] = useActionState(confirmPurchaseOrder, {});
  const [changing, setChanging] = useState(false);

  const existing = [
    ...new Set(
      items.flatMap((item) =>
        item.confirmationNumber ? [item.confirmationNumber] : [],
      ),
    ),
  ];

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ConfirmPurchaseOrderFormValues>({
    resolver: zodResolver(confirmPurchaseOrderSchema),
    defaultValues: {
      purchaseOrderUuid,
      confirmationNumber: "",
      confirmationDate: todayDateString(),
      confirmedDeliveryDate: "",
      documentSupplier: "",
      lineUuids: [],
    },
  });

  const ticked = watch("lineUuids");

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  const toggleLine = (uuid: string, on: boolean) =>
    setValue(
      "lineUuids",
      on ? [...ticked, uuid] : ticked.filter((value) => value !== uuid),
      { shouldValidate: true },
    );

  const pickExisting = (number: string) => {
    const lines = items.filter((item) => item.confirmationNumber === number);
    const first = lines[0];
    setValue("confirmationNumber", number);
    setValue("confirmationDate", first?.confirmationDate ?? todayDateString());
    setValue("confirmedDeliveryDate", first?.confirmedDeliveryDate ?? "");
    setValue("documentSupplier", first?.documentSupplier ?? "");
    setValue(
      "lineUuids",
      lines.map((line) => line.uuid),
      { shouldValidate: true },
    );
  };

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, purchaseOrderUuid });
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Confirm purchase order {purchaseOrderId}</DialogTitle>
            <DialogDescription>
              Copy these values into the selected order lines below.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <div className="grid grid-cols-2 gap-3 rounded-lg border p-3">
                <div>
                  <FormLabel htmlFor="confirmationNumber">
                    Confirmation number
                  </FormLabel>
                  <Input
                    id="confirmationNumber"
                    {...register("confirmationNumber")}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="confirmedDeliveryDate">
                    Confirmed delivery date
                  </FormLabel>
                  <Controller
                    name="confirmedDeliveryDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        id="confirmedDeliveryDate"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="confirmationDate">
                    Confirmation date
                  </FormLabel>
                  <Controller
                    name="confirmationDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        id="confirmationDate"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <FormFieldError message={errors.confirmationDate?.message} />
                </div>
                <div>
                  <FormLabel htmlFor="documentSupplier">
                    Document supplier
                  </FormLabel>
                  <Input
                    id="documentSupplier"
                    {...register("documentSupplier")}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border p-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={changing}
                    disabled={existing.length === 0}
                    onChange={(event) => setChanging(event.target.checked)}
                  />
                  Change confirmation
                </label>
                <div>
                  <FormLabel htmlFor="existingConfirmation">
                    Confirmation number
                  </FormLabel>
                  <Select
                    id="existingConfirmation"
                    value=""
                    disabled={!changing}
                    placeholder={
                      existing.length === 0 ? "None yet" : "Choose one"
                    }
                    options={existing.map((number) => ({
                      value: number,
                      label: number,
                    }))}
                    onValueChange={pickExisting}
                  />
                </div>
                {/* The chosen confirmation's own dates, read back as the
                    reference shows them beside the picker. */}
                <div>
                  <FormLabel htmlFor="existingConfirmationDate">
                    Confirmation date
                  </FormLabel>
                  <Input
                    id="existingConfirmationDate"
                    readOnly
                    disabled={!changing}
                    value={changing ? (watch("confirmationDate") ?? "") : ""}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="existingConfirmedDeliveryDate">
                    Confirmed delivery date
                  </FormLabel>
                  <Input
                    id="existingConfirmedDeliveryDate"
                    readOnly
                    disabled={!changing}
                    value={
                      changing ? (watch("confirmedDeliveryDate") ?? "") : ""
                    }
                  />
                </div>
              </div>
            </div>

            {/* `Options` on the reference opens the line's options; they
                are kept on the order's Options panel here. */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              title="Options are added on the order's Options panel"
            >
              Options
            </Button>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead />
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>U</TableHead>
                  <TableHead className="text-right">Kg</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Dim. (mm)</TableHead>
                  <TableHead className="text-right">Thickness</TableHead>
                  <TableHead className="text-right">Gross price</TableHead>
                  <TableHead className="text-right">Line discount</TableHead>
                  <TableHead className="text-right">Group discount</TableHead>
                  <TableHead className="text-right">Net price</TableHead>
                  <TableHead>Conf. No.</TableHead>
                  <TableHead>Delivery date</TableHead>
                  {/* `Prod.Sup.` and `Doc. code` were empty on every line
                      the reference showed; printed as it prints them. */}
                  <TableHead>Prod. sup.</TableHead>
                  <TableHead className="text-right">Order</TableHead>
                  <TableHead>Doc. supplier</TableHead>
                  <TableHead>Doc. code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.uuid}>
                    <TableCell>
                      <Checkbox
                        aria-label={`Confirm line ${item.lineNumber ?? ""}`}
                        checked={ticked.includes(item.uuid)}
                        onChange={(event) =>
                          toggleLine(item.uuid, event.target.checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(item.orderedQuantity))}
                    </TableCell>
                    <TableCell>
                      {orDash(item.unit ? item.unit.toUpperCase() : null)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(item.kgPurchased ?? 0))}
                    </TableCell>
                    <TableCell>
                      {[item.productCode, item.productName]
                        .filter(Boolean)
                        .join(" — ")}
                    </TableCell>
                    <TableCell>
                      {[item.lengthMm, item.widthMm, item.thicknessMm]
                        .filter((value) => value !== null)
                        .join("x") || "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(item.thicknessMm)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-destructive">
                      {formatMoney(
                        Number(item.grossPrice ?? item.netPrice ?? 0),
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(item.lineDiscountPercent ?? 0))} %
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(item.groupDiscountPercent ?? 0))} %
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(item.netPrice ?? 0))}
                    </TableCell>
                    <TableCell>{orDash(item.confirmationNumber)}</TableCell>
                    <TableCell>
                      {formatDateColumn(
                        item.confirmedDeliveryDate ?? item.receiptDate,
                      )}
                    </TableCell>
                    <TableCell>—</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {purchaseOrderId}
                    </TableCell>
                    <TableCell>{orDash(item.documentSupplier)}</TableCell>
                    <TableCell>—</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <FormFieldError message={errors.lineUuids?.message} />
            <FormError>{state.error}</FormError>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setValue(
                  "lineUuids",
                  items.map((item) => item.uuid),
                  { shouldValidate: true },
                )
              }
            >
              All select
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || ticked.length === 0}>
              {isPending ? "Confirming…" : "OK"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
