"use client";

import {
  preNotifyPurchaseOrder,
  PurchaseReceiptDocument,
} from "@/app/(dashboard)/purchase-orders/actions";
import {
  PreNotifyFormValues,
  preNotifySchema,
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
  receipts: PurchaseReceiptDocument[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * `Pre-notify purchase order` (C17, captured on 404299 8-10-2026).
 *
 * "Copy these values into the selected receipts below": the bill of lading,
 * the pre-notified delivery date, the pre-notification code, the confirmation
 * it answers and the supplier's document — onto the receptions that are
 * ticked, and only those that have not arrived. `Change pre-notify` re-picks a
 * bill of lading already on the order (`Take over`).
 */
export const PreNotifyDialog = ({
  purchaseOrderUuid,
  purchaseOrderId,
  receipts,
  open,
  onOpenChange,
}: Props) => {
  const [state, dispatch, isPending] = useActionState(
    preNotifyPurchaseOrder,
    {},
  );
  const [changing, setChanging] = useState(false);
  const [takeOverFrom, setTakeOverFrom] = useState("");

  // Only what has not arrived can be pre-notified.
  const openReceipts = receipts.filter(
    (receipt) => Number(receipt.kgActual ?? 0) === 0,
  );
  const existing = [
    ...new Set(
      receipts.flatMap((receipt) =>
        receipt.billOfLading ? [receipt.billOfLading] : [],
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
  } = useForm<PreNotifyFormValues>({
    resolver: zodResolver(preNotifySchema),
    defaultValues: {
      purchaseOrderUuid,
      billOfLading: "",
      advisedDate: todayDateString(),
      preNotifyCode: "",
      confirmationNumber: "",
      confirmationDate: "",
      documentSupplier: "",
      receivalUuids: [],
      inStockUnit: true,
    },
  });

  const ticked = watch("receivalUuids");

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  const toggle = (uuid: string, on: boolean) =>
    setValue(
      "receivalUuids",
      on ? [...ticked, uuid] : ticked.filter((value) => value !== uuid),
      { shouldValidate: true },
    );

  const takeOver = () => {
    const matching = receipts.filter(
      (receipt) => receipt.billOfLading === takeOverFrom,
    );
    const first = matching[0];
    if (!first) {
      return;
    }
    setValue("billOfLading", takeOverFrom);
    setValue(
      "advisedDate",
      first.preAnnouncedDeliveryDate ?? todayDateString(),
    );
    setValue("preNotifyCode", first.preNotifyCode ?? "");
    setValue("confirmationNumber", first.confirmationNumber ?? "");
    setValue("documentSupplier", first.documentSupplier ?? "");
    setValue(
      "receivalUuids",
      matching
        .filter((receipt) => Number(receipt.kgActual ?? 0) === 0)
        .map((receipt) => receipt.uuid),
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
            <DialogTitle>
              Pre-notify purchase order {purchaseOrderId}
            </DialogTitle>
            <DialogDescription>
              Copy these values into the selected receipts below.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <div className="grid grid-cols-2 gap-3 rounded-lg border p-3">
                <div className="col-span-2">
                  <FormLabel htmlFor="billOfLading">
                    Bill of lading number
                  </FormLabel>
                  <Input id="billOfLading" {...register("billOfLading")} />
                </div>
                <div>
                  <FormLabel htmlFor="advisedDate">
                    Pre-notified delivery date
                  </FormLabel>
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
                  <FormLabel htmlFor="preNotifyCode">
                    Pre-notification code
                  </FormLabel>
                  <Input id="preNotifyCode" {...register("preNotifyCode")} />
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
                </div>
                <div className="col-span-2">
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
                  Change pre-notify
                </label>
                <div>
                  <FormLabel htmlFor="takeOverBill">
                    Bill of lading number
                  </FormLabel>
                  <Select
                    id="takeOverBill"
                    value={takeOverFrom}
                    disabled={!changing}
                    placeholder={
                      existing.length === 0 ? "None yet" : "Choose one"
                    }
                    options={existing.map((bill) => ({
                      value: bill,
                      label: bill,
                    }))}
                    onValueChange={setTakeOverFrom}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!changing || !takeOverFrom}
                  onClick={takeOver}
                >
                  Take over
                </Button>
                <div>
                  <FormLabel htmlFor="takeOverDate">
                    Pre-notified delivery date
                  </FormLabel>
                  <Input
                    id="takeOverDate"
                    readOnly
                    disabled={!changing}
                    value={
                      takeOverFrom
                        ? formatDateColumn(
                            openReceipts.find(
                              (receipt) => receipt.billOfLading === takeOverFrom,
                            )?.preAnnouncedDeliveryDate ?? null,
                          )
                        : ""
                    }
                  />
                </div>
              </div>
            </div>

            {/* `Options` on the reference opens the line's options; they are
                kept on the order's Options panel here. */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              title="Options are added on the order's Options panel"
            >
              Options
            </Button>

            <div className="overflow-x-auto">
            <Table>
              {/* 🔴 The reference's grid, column for column: It. · For line ·
                  Qty1 · U1 · Kg1 · M1 · Charge · Batch number · #Bundle ·
                  Product · Length1 · Width · Thickness · Bill of lading ·
                  Delivery date · Qty2 · U2 · Length2 · Delivery date (actual)
                  · Conf. No. · Prd. Sup. · Product code · Order · EDI
                  Consignment · EDI Charge · EDI Delivery date · Doc. supplier
                  · Doc. code. The 1-figures are what was ordered, the
                  2-figures what has been pre-notified so far. */}
              <TableHeader>
                <TableRow>
                  <TableHead />
                  <TableHead className="text-right">It.</TableHead>
                  <TableHead>For line</TableHead>
                  <TableHead className="text-right">Qty1</TableHead>
                  <TableHead>U1</TableHead>
                  <TableHead className="text-right">Kg1</TableHead>
                  <TableHead className="text-right">M1</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead>Batch number</TableHead>
                  <TableHead className="text-right">#Bundle</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Length1</TableHead>
                  <TableHead className="text-right">Width</TableHead>
                  <TableHead className="text-right">Thickness</TableHead>
                  <TableHead>Bill of lading</TableHead>
                  <TableHead>Delivery date</TableHead>
                  <TableHead className="text-right">Qty2</TableHead>
                  <TableHead>U2</TableHead>
                  <TableHead className="text-right">Length2</TableHead>
                  <TableHead>Delivery date (actual)</TableHead>
                  <TableHead>Conf. No.</TableHead>
                  <TableHead>Prd. sup.</TableHead>
                  <TableHead>Product code</TableHead>
                  <TableHead className="text-right">Order</TableHead>
                  <TableHead>EDI Consignment</TableHead>
                  <TableHead>EDI Charge</TableHead>
                  <TableHead>EDI Delivery date</TableHead>
                  <TableHead>Doc. supplier</TableHead>
                  <TableHead>Doc. code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openReceipts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={29}
                      className="h-16 text-center text-muted-foreground"
                    >
                      Every reception has arrived — there is nothing left to
                      pre-notify.
                    </TableCell>
                  </TableRow>
                ) : (
                  openReceipts.map((receipt) => (
                    <TableRow key={receipt.uuid}>
                      <TableCell>
                        <Checkbox
                          aria-label={`Pre-notify reception ${receipt.lineNumber ?? ""}`}
                          checked={ticked.includes(receipt.uuid)}
                          onChange={(event) =>
                            toggle(receipt.uuid, event.target.checked)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {receipt.lineNumber === null ? "—" : receipt.lineNumber * 10}
                      </TableCell>
                      <TableCell>
                        —
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(receipt.qtyPlanned ?? 0))}
                      </TableCell>
                      <TableCell>
                        {orDash(receipt.unit ? receipt.unit.toUpperCase() : null)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(receipt.kgPlanned ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber((Number(receipt.qtyPlanned ?? 0) * Number(receipt.lengthMm ?? 0)) / 1000)}
                      </TableCell>
                      <TableCell>
                        {orDash(receipt.charge)}
                      </TableCell>
                      <TableCell>
                        {orDash(receipt.plateNumber)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        0
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {[receipt.productCode, receipt.productName]
                          .filter(Boolean)
                          .join(" — ")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {orDash(receipt.lengthMm)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {orDash(receipt.widthMm)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {receipt.thicknessMm === null ? "—" : formatNumber(Number(receipt.thicknessMm))}
                      </TableCell>
                      <TableCell>
                        {orDash(receipt.billOfLading)}
                      </TableCell>
                      <TableCell>
                        {formatDateColumn(receipt.preAnnouncedDeliveryDate ?? receipt.receiptDate)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(receipt.qtyActual ?? 0))}
                      </TableCell>
                      <TableCell>
                        {Number(receipt.qtyActual ?? 0) > 0 && receipt.unit ? receipt.unit.toUpperCase() : ""}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {orDash(receipt.lengthMm)}
                      </TableCell>
                      <TableCell>
                        {formatDateColumn(receipt.deliveryDateActual)}
                      </TableCell>
                      <TableCell>
                        {orDash(receipt.confirmationNumber)}
                      </TableCell>
                      <TableCell>
                        —
                      </TableCell>
                      <TableCell>
                        {orDash(receipt.productCode)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {purchaseOrderId}
                      </TableCell>
                      <TableCell>
                        {orDash(receipt.ediBillOfLading)}
                      </TableCell>
                      <TableCell>
                        {orDash(receipt.ediCharge)}
                      </TableCell>
                      <TableCell>
                        {formatDateColumn(receipt.ediDeliveryDate)}
                      </TableCell>
                      <TableCell>
                        {orDash(receipt.documentSupplier)}
                      </TableCell>
                      <TableCell>
                        —
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
            <FormFieldError message={errors.receivalUuids?.message} />
            <FormError>{state.error}</FormError>
          </DialogBody>

          <DialogFooter className="items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setValue(
                  "receivalUuids",
                  openReceipts.map((receipt) => receipt.uuid),
                  { shouldValidate: true },
                )
              }
            >
              All select
            </Button>
            <Controller
              name="inStockUnit"
              control={control}
              render={({ field }) => (
                <label className="me-auto flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                  Pre-notify in stock unit (if receipt for stock)
                </label>
              )}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || ticked.length === 0}>
              {isPending ? "Saving…" : "OK"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
