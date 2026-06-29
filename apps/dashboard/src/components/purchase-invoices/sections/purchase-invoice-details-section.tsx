"use client";

import { Controller, useFormContext } from "react-hook-form";
import { PurchaseInvoiceFormValues } from "@/app/(dashboard)/purchase-invoices/validation";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { Select, SelectOption } from "@/components/shadcn/select";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { purchaseInvoiceFiscalBases } from "@/lib/enums";
import { PURCHASE_INVOICE_FISCAL_BASE_LABELS } from "@/lib/labels";

type Props = {
  isPending: boolean;
  supplierOptions: SelectOption[];
  contactOptions: SelectOption[];
  paymentTermOptions: SelectOption[];
  blockReasonOptions: SelectOption[];
  today: string;
};

export const PurchaseInvoiceDetailsSection = ({
  isPending,
  supplierOptions,
  contactOptions,
  paymentTermOptions,
  blockReasonOptions,
  today,
}: Props) => {
  const { register, control, watch, setValue } =
    useFormContext<PurchaseInvoiceFormValues>();

  const blocked = watch("blocked");

  return (
    <div className="space-y-4 lg:col-span-2">
      <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
        Purchase Invoice
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FormLabel htmlFor="companyUuid">Company</FormLabel>
          <Controller
            name="companyUuid"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Select
                  id="companyUuid"
                  options={supplierOptions}
                  value={field.value ?? ""}
                  onValueChange={(v) => {
                    field.onChange(v || undefined);
                    setValue("invoiceSentByContactUuid", "");
                  }}
                  disabled={isPending}
                />
                <FormFieldError message={fieldState.error?.message} />
              </>
            )}
          />
        </div>

        <div>
          <FormLabel htmlFor="invoiceSentByContactUuid">Invoice Sent By</FormLabel>
          <Controller
            name="invoiceSentByContactUuid"
            control={control}
            render={({ field }) => (
              <Select
                id="invoiceSentByContactUuid"
                options={contactOptions}
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v || undefined)}
                disabled={isPending}
              />
            )}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <FormLabel>Booking Date</FormLabel>
          <p className="mt-1 rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-600">
            Automatically — {today}
          </p>
        </div>
        <div>
          <FormLabel>Invoice Date</FormLabel>
          <Controller
            name="invoiceDate"
            control={control}
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
          <FormLabel>Exp. Date</FormLabel>
          <Controller
            name="expirationDate"
            control={control}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FormLabel htmlFor="invoiceNumberSupplier">Invoice Number Supplier</FormLabel>
          <Input
            id="invoiceNumberSupplier"
            {...register("invoiceNumberSupplier")}
            disabled={isPending}
          />
        </div>
        <div>
          <FormLabel htmlFor="purchaseOrderNumber">Purchase Order</FormLabel>
          <Input
            id="purchaseOrderNumber"
            {...register("purchaseOrderNumber")}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <div>
        <FormLabel>Basis for Fiscal Period</FormLabel>
        <div className="mt-2 flex gap-6">
          {purchaseInvoiceFiscalBases.map((basis) => (
            <label key={basis} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                value={basis}
                {...register("basisForFiscalPeriod")}
                className="size-4 accent-primary"
                disabled={isPending}
              />
              <span className="text-sm font-medium text-gray-700">
                {PURCHASE_INVOICE_FISCAL_BASE_LABELS[basis]}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FormLabel htmlFor="invoiceTotal">Invoice Total</FormLabel>
          <Input
            id="invoiceTotal"
            type="number"
            step="0.01"
            {...register("invoiceTotal")}
            disabled={isPending}
          />
        </div>
        <div>
          <FormLabel htmlFor="paymentTerms">Payment Terms</FormLabel>
          <Controller
            name="paymentTerms"
            control={control}
            render={({ field }) => (
              <Select
                id="paymentTerms"
                options={paymentTermOptions}
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v || undefined)}
                disabled={isPending}
              />
            )}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            id="blocked"
            {...register("blocked")}
            className="size-4 accent-primary"
            disabled={isPending}
          />
          <label htmlFor="blocked" className="text-sm font-medium text-gray-700 cursor-pointer">
            Blocked
          </label>
        </div>
        {blocked && (
          <div>
            <FormLabel htmlFor="blockReason">Blocking Reason</FormLabel>
            <Controller
              name="blockReason"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Select
                    id="blockReason"
                    options={blockReasonOptions}
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v || undefined)}
                    disabled={isPending}
                  />
                  <FormFieldError message={fieldState.error?.message} />
                </>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
};
