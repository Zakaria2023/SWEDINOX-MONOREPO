"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPurchaseInvoice,
  type PurchaseInvoiceActionResult,
} from "./actions";
import {
  createPurchaseInvoiceSchema,
  type PurchaseInvoiceFormValues,
} from "./validation";

export const usePurchaseInvoiceSubmit = () => {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<PurchaseInvoiceActionResult>({});

  const form = useForm<PurchaseInvoiceFormValues>({
    resolver: zodResolver(createPurchaseInvoiceSchema()),
    defaultValues: {
      companyUuid: "",
      invoiceSentByContactUuid: "",
      bookingDate: "",
      invoiceDate: "",
      expirationDate: "",
      invoiceNumberSupplier: "",
      creditorNo: "",
      creditorNo2: "",
      basisForFiscalPeriod: "booking_date",
      invoiceTotal: "0.00",
      purchaseOrderNumber: "",
      paymentTerms: undefined,
      blocked: false,
      blockReason: undefined,
      materials: "0.00",
      optionsAmount: "0.00",
      surcharges: "0.00",
      vatHigh: "0.00",
      vatMiddle: "0.00",
      vatLow: "0.00",
      creditRestriction: "0.00",
      remarks: "",
      documents: [],
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createPurchaseInvoice({
        companyUuid: values.companyUuid || undefined,
        invoiceSentByContactUuid: values.invoiceSentByContactUuid || undefined,
        bookingDate: values.bookingDate ? new Date(values.bookingDate) : null,
        invoiceDate: values.invoiceDate ? new Date(values.invoiceDate) : null,
        expirationDate: values.expirationDate ? new Date(values.expirationDate) : null,
        invoiceNumberSupplier: values.invoiceNumberSupplier || undefined,
        creditorNo: values.creditorNo || undefined,
        creditorNo2: values.creditorNo2 || undefined,
        basisForFiscalPeriod: values.basisForFiscalPeriod,
        invoiceTotal: values.invoiceTotal,
        purchaseOrderNumber: values.purchaseOrderNumber || undefined,
        paymentTerms: values.paymentTerms ?? null,
        blocked: values.blocked,
        blockReason: values.blockReason ?? null,
        materials: values.materials,
        optionsAmount: values.optionsAmount,
        surcharges: values.surcharges,
        vatHigh: values.vatHigh,
        vatMiddle: values.vatMiddle,
        vatLow: values.vatLow,
        creditRestriction: values.creditRestriction,
        remarks: values.remarks || undefined,
        documents: values.documents ?? [],
      });
      setState(result);
    });
  });

  return { form, isPending, onSubmit, state };
};
