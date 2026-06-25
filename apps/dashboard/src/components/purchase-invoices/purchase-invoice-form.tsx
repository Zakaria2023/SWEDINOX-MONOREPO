"use client";

import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import type { CompanyOption, ContactOption } from "@/app/(dashboard)/companies/actions";
import { usePurchaseInvoiceSubmit } from "@/app/(dashboard)/purchase-invoices/use-purchase-invoice-submit";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { DocumentUploader } from "@/components/document-uploader";
import {
  invoicePaymentTerms,
  purchaseInvoiceBlockReasons,
  purchaseInvoiceFiscalBases,
} from "@/lib/enums";
import {
  COMMON_TEXT,
  INVOICE_PAYMENT_TERM_LABELS,
  PURCHASE_INVOICE_BLOCK_REASON_LABELS,
  PURCHASE_INVOICE_FISCAL_BASE_LABELS,
} from "@/lib/labels";

type PurchaseInvoiceFormProps = {
  availableSuppliers: CompanyOption[];
  availableContacts: ContactOption[];
};

const formatAmount = (val: string) => {
  const num = parseFloat(val || "0");
  return isNaN(num) ? "€0,00" : `€${num.toFixed(2).replace(".", ",")}`;
};

export const PurchaseInvoiceForm = ({
  availableSuppliers,
  availableContacts,
}: PurchaseInvoiceFormProps) => {
  const router = useRouter();
  const { form, isPending, onSubmit, state } = usePurchaseInvoiceSubmit();
  const { register, watch, control, setValue } = form;

  const [uploadedDocs, setUploadedDocs] = useState<
    Array<{ id: string; fileName: string }>
  >([]);

  useEffect(() => {
    setValue("documents", uploadedDocs);
  }, [uploadedDocs, setValue]);

  const selectedCompanyUuid = watch("companyUuid");
  const blocked = watch("blocked");
  const materials = watch("materials");
  const optionsAmount = watch("optionsAmount");
  const surcharges = watch("surcharges");
  const vatHigh = watch("vatHigh");
  const vatMiddle = watch("vatMiddle");
  const vatLow = watch("vatLow");
  const creditRestriction = watch("creditRestriction");
  const invoiceTotal = watch("invoiceTotal");

  const toNum = (v: string | undefined) => parseFloat(v || "0") || 0;
  const totalExclVat = toNum(materials) + toNum(optionsAmount) + toNum(surcharges);
  const totalInclVat = totalExclVat + toNum(vatHigh) + toNum(vatMiddle) + toNum(vatLow);
  const remainder = totalInclVat - toNum(creditRestriction);
  const totalGeneral = toNum(invoiceTotal);

  const supplierOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...availableSuppliers.map((c) => ({
      value: c.uuid,
      label: [c.searchCode1, c.companyName].filter(Boolean).join(" — "),
    })),
  ];

  const contactOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...availableContacts
      .filter((c) => !selectedCompanyUuid || c.companyUuid === selectedCompanyUuid)
      .map((c) => ({
        value: c.uuid,
        label: [String(c.id), c.firstName, c.lastName].filter(Boolean).join(" "),
      })),
  ];

  const paymentTermOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...invoicePaymentTerms.map((t) => ({
      value: t,
      label: INVOICE_PAYMENT_TERM_LABELS[t],
    })),
  ];

  const blockReasonOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...purchaseInvoiceBlockReasons.map((r) => ({
      value: r,
      label: PURCHASE_INVOICE_BLOCK_REASON_LABELS[r],
    })),
  ];

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: supplier / dates */}
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

        {/* Right: accounting summary */}
        <div className="space-y-4">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Summary
          </h2>

          <div className="space-y-3">
            <div>
              <FormLabel htmlFor="materials">Materials</FormLabel>
              <Input
                id="materials"
                type="number"
                step="0.01"
                {...register("materials")}
                disabled={isPending}
              />
            </div>
            <div>
              <FormLabel htmlFor="optionsAmount">Options</FormLabel>
              <Input
                id="optionsAmount"
                type="number"
                step="0.01"
                {...register("optionsAmount")}
                disabled={isPending}
              />
            </div>
            <div>
              <FormLabel htmlFor="surcharges">Surcharges</FormLabel>
              <Input
                id="surcharges"
                type="number"
                step="0.01"
                {...register("surcharges")}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="rounded-md border bg-gray-50 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tot. excl. VAT</span>
              <span className="font-medium">{formatAmount(totalExclVat.toFixed(2))}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <FormLabel htmlFor="vatHigh">VAT High</FormLabel>
              <Input
                id="vatHigh"
                type="number"
                step="0.01"
                {...register("vatHigh")}
                disabled={isPending}
              />
            </div>
            <div>
              <FormLabel htmlFor="vatMiddle">VAT Middle</FormLabel>
              <Input
                id="vatMiddle"
                type="number"
                step="0.01"
                {...register("vatMiddle")}
                disabled={isPending}
              />
            </div>
            <div>
              <FormLabel htmlFor="vatLow">VAT Low</FormLabel>
              <Input
                id="vatLow"
                type="number"
                step="0.01"
                {...register("vatLow")}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="rounded-md border bg-gray-50 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tot. incl. VAT</span>
              <span className="font-medium">{formatAmount(totalInclVat.toFixed(2))}</span>
            </div>
          </div>

          <div>
            <FormLabel htmlFor="creditRestriction">Credit Restriction</FormLabel>
            <Input
              id="creditRestriction"
              type="number"
              step="0.01"
              {...register("creditRestriction")}
              disabled={isPending}
            />
          </div>

          <div className="rounded-md border bg-gray-50 p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Remainder</span>
              <span className={`font-medium ${remainder < 0 ? "text-red-600" : ""}`}>
                {formatAmount(remainder.toFixed(2))}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Tot. general</span>
              <span>{formatAmount(totalGeneral.toFixed(2))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Remarks + Documents */}
      <div className="space-y-4">
        <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Remarks &amp; Documents
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <FormLabel htmlFor="remarks">Remarks</FormLabel>
            <textarea
              id="remarks"
              {...register("remarks")}
              rows={5}
              className="w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              disabled={isPending}
            />
          </div>
          <div>
            <FormLabel>Documents</FormLabel>
            <DocumentUploader
              onSuccess={(uploads) =>
                setUploadedDocs((prev) => [
                  ...prev,
                  ...uploads.map((u) => ({ id: u.documentId, fileName: u.fileName })),
                ])
              }
            />
            {uploadedDocs.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {uploadedDocs.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between">
                    <span className="truncate text-gray-700">{doc.fileName}</span>
                    <button
                      type="button"
                      className="ml-2 text-xs text-red-500 hover:underline"
                      onClick={() =>
                        setUploadedDocs((prev) => prev.filter((d) => d.id !== doc.id))
                      }
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {state.error && <FormError>{state.error}</FormError>}
      <FormActions
        submitLabel="Create Purchase Invoice"
        isPending={isPending}
        onCancel={() => router.push("/purchase-invoices")}
      />
    </form>
  );
};
