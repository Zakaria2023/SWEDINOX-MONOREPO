"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createInvoice,
  type InvoiceActionResult,
  type InvoiceSurchargeInput,
} from "./actions";
import { createInvoiceSchema, type InvoiceFormValues } from "./validation";

export const useInvoiceSubmit = (surcharges: InvoiceSurchargeInput[]) => {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<InvoiceActionResult>({});

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(createInvoiceSchema()),
    defaultValues: {
      invoiceNumber: "",
      companyUuid: "",
      debtorNo: "",
      invoiceDate: "",
      expirationDate: "",
      invoiceAmountExclVat: "",
      invoiceAmountInclVat: "",
      creditRestriction: "0.00",
      invoiceTotal: "",
      outstanding: "0.00",
      calculateVat: false,
      printed: false,
      mailed: false,
      vatScenario: undefined,
      paymentTerms: undefined,
      explanation: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createInvoice(
        {
          invoiceNumber: values.invoiceNumber,
          companyUuid: values.companyUuid || undefined,
          debtorNo: values.debtorNo || undefined,
          invoiceDate: values.invoiceDate || undefined,
          expirationDate: values.expirationDate || undefined,
          invoiceAmountExclVat: values.invoiceAmountExclVat || "0.00",
          invoiceAmountInclVat: values.invoiceAmountInclVat || "0.00",
          creditRestriction: values.creditRestriction || "0.00",
          invoiceTotal: values.invoiceTotal || "0.00",
          outstanding: values.outstanding || "0.00",
          calculateVat: values.calculateVat,
          printed: values.printed,
          mailed: values.mailed,
          vatScenario: values.vatScenario ?? null,
          paymentTerms: values.paymentTerms ?? null,
          explanation: values.explanation || undefined,
        },
        surcharges,
      );
      setState(result);
    });
  });

  return { form, isPending, onSubmit, state };
};
