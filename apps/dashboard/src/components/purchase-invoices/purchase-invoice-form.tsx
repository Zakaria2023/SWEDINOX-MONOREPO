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
import { SurchargesSection } from "./sections/surcharges-section";
import { RemarksAndDocumentsSection } from "./sections/remarks-and-documents-section";
import {
  invoicePaymentTerms,
  purchaseInvoiceBlockReasons,
} from "@/lib/enums";
import { getPaymentTermDueDate } from "@/lib/helpers";
import {
  COMMON_TEXT,
  INVOICE_PAYMENT_TERM_LABELS,
  PURCHASE_INVOICE_BLOCK_REASON_LABELS,
} from "@/lib/labels";

type PurchaseInvoiceFormProps = {
  availableSuppliers: CompanyOption[];
  availableContacts: ContactOption[];
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
  const paymentTerms = watch("paymentTerms");
  const invoiceDate = watch("invoiceDate");

  // Auto-fill the due date from the payment term whenever it (or the invoice
  // date) changes and the term implies a determinate due date.
  useEffect(() => {
    const due = getPaymentTermDueDate(paymentTerms ?? null, invoiceDate ?? null);
    if (due) {
      setValue("expirationDate", due);
    }
  }, [paymentTerms, invoiceDate, setValue]);

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
        <PurchaseInvoiceDetailsSection
          isPending={isPending}
          supplierOptions={supplierOptions}
          contactOptions={contactOptions}
          paymentTermOptions={paymentTermOptions}
          blockReasonOptions={blockReasonOptions}
          today={today}
        />

        {/* Stock items — only shown once a supplier with pending stock is selected */}
        <PurchaseInvoiceItemsSection
          pendingStock={pendingStock}
          itemFields={itemFields}
          appendItem={appendItem}
          removeItem={removeItem}
          isPending={isPending}
        />

        {/* Surcharges */}
        <SurchargesSection />

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
