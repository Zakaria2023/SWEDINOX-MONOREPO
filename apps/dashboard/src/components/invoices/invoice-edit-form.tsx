"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  InvoiceDetail,
  updateInvoice,
} from "@/app/(dashboard)/invoices/actions";
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
  debtorNo: z.string().optional(),
  invoiceDate: z.string().optional(),
  expirationDate: z.string().optional(),
  paymentTerms: z.string().optional(),
  explanation: z.string().optional(),
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
  invoice: InvoiceDetail;
};

export const InvoiceEditForm = ({ invoice }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const { register, control, handleSubmit, watch, setValue } =
    useForm<EditFormValues>({
      resolver: zodResolver(editSchema),
      defaultValues: {
        debtorNo: invoice.debtorNo ?? "",
        invoiceDate: toDateInput(invoice.invoiceDate),
        expirationDate: toDateInput(invoice.expirationDate),
        paymentTerms: invoice.paymentTerms ?? "",
        explanation: invoice.explanation ?? "",
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
      const result = await updateInvoice(invoice.uuid, {
        debtorNo: values.debtorNo || null,
        invoiceDate: values.invoiceDate ? new Date(values.invoiceDate) : null,
        expirationDate: values.expirationDate
          ? new Date(values.expirationDate)
          : null,
        paymentTerms: (values.paymentTerms || null) as InvoiceDetail["paymentTerms"],
        explanation: values.explanation || null,
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
          <FormLabel htmlFor="debtorNo">Debtor No.</FormLabel>
          <Input id="debtorNo" {...register("debtorNo")} disabled={isPending} />
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
          <FormLabel htmlFor="expirationDate">Expiration Date</FormLabel>
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
        <FormLabel htmlFor="explanation">Explanation</FormLabel>
        <Textarea
          id="explanation"
          rows={4}
          {...register("explanation")}
          disabled={isPending}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/invoices/${invoice.uuid}`)}
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
