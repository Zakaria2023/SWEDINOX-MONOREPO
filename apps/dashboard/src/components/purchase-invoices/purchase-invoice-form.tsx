"use client";

import { useEffect, useState } from "react";
import { FormProvider } from "react-hook-form";
import { useRouter } from "next/navigation";
import type { CompanyOption, ContactOption } from "@/app/(dashboard)/companies/actions";
import { usePurchaseInvoiceSubmit } from "@/app/(dashboard)/purchase-invoices/use-purchase-invoice-submit";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { PurchaseInvoiceDetailsSection } from "./sections/purchase-invoice-details-section";
import { PurchaseInvoiceItemsSection } from "./sections/purchase-invoice-items-section";
import { PurchaseInvoiceSummarySection } from "./sections/purchase-invoice-summary-section";
import { RemarksAndDocumentsSection } from "./sections/remarks-and-documents-section";
import {
  invoicePaymentTerms,
  purchaseInvoiceBlockReasons,
} from "@/lib/enums";
import {
  COMMON_TEXT,
  INVOICE_PAYMENT_TERM_LABELS,
  PURCHASE_INVOICE_BLOCK_REASON_LABELS,
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
  const {
    form,
    isPending,
    onSubmit,
    state,
    pendingStock,
    itemFields,
    appendItem,
    removeItem,
  } = usePurchaseInvoiceSubmit();
  const { watch, setValue } = form;

  const [uploadedDocs, setUploadedDocs] = useState<
    Array<{ id: string; fileName: string }>
  >([]);

  useEffect(() => {
    setValue("documents", uploadedDocs);
  }, [uploadedDocs, setValue]);

  const selectedCompanyUuid = watch("companyUuid");
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
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: supplier / dates */}
          <PurchaseInvoiceDetailsSection
            isPending={isPending}
            supplierOptions={supplierOptions}
            contactOptions={contactOptions}
            paymentTermOptions={paymentTermOptions}
            blockReasonOptions={blockReasonOptions}
            today={today}
          />

          {/* Right: accounting summary */}
          <PurchaseInvoiceSummarySection
            isPending={isPending}
            formatAmount={formatAmount}
            totalExclVat={totalExclVat}
            totalInclVat={totalInclVat}
            remainder={remainder}
            totalGeneral={totalGeneral}
          />

          {/* Stock items — only shown once a supplier with pending stock is selected */}
          <PurchaseInvoiceItemsSection
            pendingStock={pendingStock}
            itemFields={itemFields}
            appendItem={appendItem}
            removeItem={removeItem}
            isPending={isPending}
          />
        </div>

        {/* Remarks + Documents */}
        <RemarksAndDocumentsSection
          isPending={isPending}
          uploadedDocs={uploadedDocs}
          onUploadSuccess={(uploads) =>
            setUploadedDocs((prev) => [
              ...prev,
              ...uploads.map((u) => ({ id: u.documentId, fileName: u.fileName })),
            ])
          }
          onRemoveDoc={(id) =>
            setUploadedDocs((prev) => prev.filter((d) => d.id !== id))
          }
        />

        {state.error && <FormError>{state.error}</FormError>}
        <FormActions
          submitLabel="Create Purchase Invoice"
          isPending={isPending}
          onCancel={() => router.push("/purchase-invoices")}
        />
      </form>
    </FormProvider>
  );
};
