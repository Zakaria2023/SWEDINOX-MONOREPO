"use client";

import { useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPurchaseInvoice,
  type PurchaseInvoiceActionResult,
} from "./actions";
import {
  createPurchaseInvoiceSchema,
  type PurchaseInvoiceFormValues,
} from "./validation";
import {
  getPendingStockForCompany,
  type PendingStockOption,
} from "@/app/(dashboard)/stock/actions";
import { toDecimal } from "@/lib/helpers";

export const usePurchaseInvoiceSubmit = () => {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<PurchaseInvoiceActionResult>({});
  const [pendingStock, setPendingStock] = useState<PendingStockOption[]>([]);

  const form = useForm<PurchaseInvoiceFormValues>({
    resolver: zodResolver(createPurchaseInvoiceSchema()),
    defaultValues: {
      companyUuid: "",
      items: [],
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
      remarks: "",
      documents: [],
      surchargeLines: [],
    },
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
    replace: replaceItems,
  } = useFieldArray({ control: form.control, name: "items" });

  const companyUuid = form.watch("companyUuid");

  useEffect(() => {
    replaceItems([]);
    if (!companyUuid) {
      setPendingStock([]);
      return;
    }
    getPendingStockForCompany(companyUuid).then(setPendingStock);
  }, [companyUuid, replaceItems]);

  const onSubmit = form.handleSubmit((values) => {
    const surcharges = values.surchargeLines.map((line) => ({
      booked: line.booked,
      orderRef: line.orderRef || null,
      description: line.description || null,
      revenueGroup: line.revenueGroup || null,
      surcharge: toDecimal(line.surcharge, "0.00"),
      unit: line.unit || null,
      surchargeBasis: toDecimal(line.surchargeBasis, "0.00"),
      amount: toDecimal(line.amount, "0.00"),
      vatRate: line.vatRate?.trim() ? line.vatRate : null,
      order: 0,
    }));

    startTransition(async () => {
      const result = await createPurchaseInvoice(
        {
          companyUuid: values.companyUuid || undefined,
          invoiceSentByContactUuid:
            values.invoiceSentByContactUuid || undefined,
          bookingDate: values.bookingDate ? new Date(values.bookingDate) : null,
          invoiceDate: values.invoiceDate ? new Date(values.invoiceDate) : null,
          expirationDate: values.expirationDate
            ? new Date(values.expirationDate)
            : null,
          invoiceNumberSupplier: values.invoiceNumberSupplier || undefined,
          creditorNo: values.creditorNo || undefined,
          creditorNo2: values.creditorNo2 || undefined,
          basisForFiscalPeriod: values.basisForFiscalPeriod,
          invoiceTotal: values.invoiceTotal,
          purchaseOrderNumber: values.purchaseOrderNumber || undefined,
          paymentTerms: values.paymentTerms ?? null,
          blocked: values.blocked,
          blockReason: values.blockReason ?? null,
          remarks: values.remarks || undefined,
          documents: values.documents ?? [],
        },
        values.items ?? [],
        surcharges,
      );
      setState(result);
    });
  });

  return {
    form,
    isPending,
    onSubmit,
    state,
    pendingStock,
    itemFields,
    appendItem,
    removeItem,
  };
};
