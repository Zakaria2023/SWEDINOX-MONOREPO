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
      companyUuid: "",
      invoiceDate: "",
      expirationDate: "",
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
          companyUuid: values.companyUuid || undefined,
          invoiceDate: values.invoiceDate ? new Date(values.invoiceDate) : null,
          expirationDate: values.expirationDate ? new Date(values.expirationDate) : null,
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
