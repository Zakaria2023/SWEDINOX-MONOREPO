"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PurchaseInvoiceDetail,
  updatePurchaseInvoice,
} from "@/app/(dashboard)/purchase-invoices/actions";
import { Button } from "@/components/shadcn/button";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";
import { FormError } from "@/components/ui/form-error";
import { FormLabel } from "@/components/ui/form-field";
import { InvoicePaymentTerm, invoicePaymentTerms } from "@/lib/enums";
import { getPaymentTermDueDate } from "@/lib/helpers";
import { COMMON_TEXT, INVOICE_PAYMENT_TERM_LABELS } from "@/lib/labels";

const editSchema = z.object({
  invoiceNumberSupplier: z.string().optional(),
  creditorNo: z.string().optional(),
  creditorNo2: z.string().optional(),
  invoiceDate: z.string().optional(),
  expirationDate: z.string().optional(),
  paymentTerms: z.string().optional(),
  remarks: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

const toDateInput = (value: Date | string | null) => {
  if (!value) {
    return "";
  }
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().split("T")[0];
};

type Props = {
  purchaseInvoice: PurchaseInvoiceDetail;
};

export const PurchaseInvoiceEditForm = ({ purchaseInvoice }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const { register, control, handleSubmit, watch, setValue } =
    useForm<EditFormValues>({
      resolver: zodResolver(editSchema),
      defaultValues: {
        invoiceNumberSupplier: purchaseInvoice.invoiceNumberSupplier ?? "",
        creditorNo: purchaseInvoice.creditorNo ?? "",
        creditorNo2: purchaseInvoice.creditorNo2 ?? "",
        invoiceDate: toDateInput(purchaseInvoice.invoiceDate),
        expirationDate: toDateInput(purchaseInvoice.expirationDate),
        paymentTerms: purchaseInvoice.paymentTerms ?? "",
        remarks: purchaseInvoice.remarks ?? "",
      },
    });

  const paymentTerms = watch("paymentTerms");
  const invoiceDate = watch("invoiceDate");

  // Recompute the due date from the payment term when it or the invoice date
  // changes and the term implies a determinate due date.
  useEffect(() => {
    const due = getPaymentTermDueDate(
      (paymentTerms || null) as InvoicePaymentTerm | null,
      invoiceDate ?? null,
    );
    if (due) {
      setValue("expirationDate", due);
    }
  }, [paymentTerms, invoiceDate, setValue]);

  const paymentTermOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...invoicePaymentTerms.map((t) => ({
      value: t,
      label: INVOICE_PAYMENT_TERM_LABELS[t],
    })),
  ];

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await updatePurchaseInvoice(purchaseInvoice.uuid, {
        invoiceNumberSupplier: values.invoiceNumberSupplier || null,
        creditorNo: values.creditorNo || null,
        creditorNo2: values.creditorNo2 || null,
        invoiceDate: values.invoiceDate ? new Date(values.invoiceDate) : null,
        expirationDate: values.expirationDate
          ? new Date(values.expirationDate)
          : null,
        paymentTerms:
          (values.paymentTerms ||
            null) as PurchaseInvoiceDetail["paymentTerms"],
        remarks: values.remarks || null,
      });

      if (result.error) {
        setError(result.error);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <FormError>{error}</FormError>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FormLabel htmlFor="invoiceNumberSupplier">
            Invoice Number Supplier
          </FormLabel>
          <Input
            id="invoiceNumberSupplier"
            {...register("invoiceNumberSupplier")}
            disabled={isPending}
          />
        </div>
        <div>
          <FormLabel htmlFor="paymentTerms">Payment Terms</FormLabel>
          <Controller
            control={control}
            name="paymentTerms"
            render={({ field }) => (
              <Select
                id="paymentTerms"
                value={field.value ?? ""}
                options={paymentTermOptions}
                onValueChange={field.onChange}
                disabled={isPending}
              />
            )}
          />
        </div>
        <div>
          <FormLabel htmlFor="creditorNo">Cred. No.</FormLabel>
          <Input
            id="creditorNo"
            {...register("creditorNo")}
            disabled={isPending}
          />
        </div>
        <div>
          <FormLabel htmlFor="creditorNo2">Cred. No. 2</FormLabel>
          <Input
            id="creditorNo2"
            {...register("creditorNo2")}
            disabled={isPending}
          />
        </div>
        <div>
          <FormLabel htmlFor="invoiceDate">Invoice Date</FormLabel>
          <Controller
            control={control}
            name="invoiceDate"
            render={({ field }) => (
              <DatePicker
                value={field.value ?? ""}
                onChange={field.onChange}
                disabled={isPending}
              />
            )}
          />
        </div>
        <div>
          <FormLabel htmlFor="expirationDate">Exp. Date</FormLabel>
          <Controller
            control={control}
            name="expirationDate"
            render={({ field }) => (
              <DatePicker
                value={field.value ?? ""}
                onChange={field.onChange}
                disabled={isPending}
              />
            )}
          />
        </div>
      </div>

      <div>
        <FormLabel htmlFor="remarks">Remarks</FormLabel>
        <Textarea
          id="remarks"
          rows={4}
          {...register("remarks")}
          disabled={isPending}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(`/purchase-invoices/${purchaseInvoice.uuid}`)
          }
          disabled={isPending}
        >
          {COMMON_TEXT.cancel}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? COMMON_TEXT.saving : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};
