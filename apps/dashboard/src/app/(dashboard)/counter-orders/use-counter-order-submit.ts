"use client";

import { todayDateString } from "@/lib/helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  CounterOrderActionResult,
  CounterOrderExtras,
  CounterOrderInput,
  createCounterOrder,
} from "./actions";
import { createCounterOrderSchema, CounterOrderFormValues } from "./validation";
import { toDecimal } from "@/lib/helpers";

export const useCounterOrderSubmit = () => {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<CounterOrderActionResult>({});

  const form = useForm<CounterOrderFormValues>({
    resolver: zodResolver(createCounterOrderSchema()),
    defaultValues: {
      companyUuid: "",
      contactUuid: "",
      customerRef: "",
      leaveCustomer: false,
      orderMethod: "",
      ourReference: "",
      seller: "",
      projectUuid: "",
      status: "open",
      priority: "normal",
      priceDate: todayDateString(),
      orderDate: todayDateString(),
      handlingBlocked: false,
      printPickingSlips: true,
      isPickup: false,
      isIncidental: false,
      isOverlength: false,
      isPrinted: false,
      isMailed: false,
      isFaxed: false,
      deliveryTerms: "",
      deliveryAddressUuid: "",
      deliveryDate: "",
      deliveryRemark: "",

      completeDelivery: false,
      transportBlockage: false,
      vehicleWithCrane: false,
      vehicleWithCanopy: false,
      bundlingSeparate: false,
      transportRegion: "",
      maxLengthMm: "",
      maxBundleWeightKg: "",
      deliveryAfterTime: "00:00",
      deliverForTime: "00:00",
      transportMode: "",

      showNetPrice: false,
      scrapSurchargeSeparate: false,
      calculateVatIfApplicable: false,
      financialBlockage: false,
      invoiceBlockage: false,
      onlyTotalAmountOnInvoice: false,
      includeOptionPricesInMaterialPrices: false,
      paymentTerms: "",
      billingAddressUuid: "",
      blockingReason: "",

      amountExVat: "0.00",
      weightKg: "0.000",
      gainPercent: "0.00",
      remarks: "",

      surcharges: [],
      documents: [],
      contractUuids: [],
      texts: [],
      items: [],
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const input: CounterOrderInput = {
        companyUuid: values.companyUuid,
        contactUuid: values.contactUuid || undefined,
        customerRef: values.customerRef || undefined,
        leaveCustomer: values.leaveCustomer,
        orderMethod: values.orderMethod || undefined,
        ourReference: values.ourReference || undefined,
        seller: values.seller || undefined,
        projectUuid: values.projectUuid || undefined,
        status: values.status,
        priority: values.priority,
        priceDate: values.priceDate || undefined,
        orderDate: values.orderDate || undefined,
        handlingBlocked: values.handlingBlocked,
        printPickingSlips: values.printPickingSlips,
        isPickup: values.isPickup,
        isIncidental: values.isIncidental,
        isOverlength: values.isOverlength,
        isPrinted: values.isPrinted,
        isMailed: values.isMailed,
        isFaxed: values.isFaxed,
        deliveryTerms: values.deliveryTerms || undefined,
        deliveryAddressUuid: values.deliveryAddressUuid || undefined,
        deliveryDate: values.deliveryDate || undefined,
        deliveryRemark: values.deliveryRemark || undefined,

        completeDelivery: values.completeDelivery,
        transportBlockage: values.transportBlockage,
        vehicleWithCrane: values.vehicleWithCrane,
        vehicleWithCanopy: values.vehicleWithCanopy,
        bundlingSeparate: values.bundlingSeparate,
        transportRegion: values.transportRegion || undefined,
        maxLengthMm: values.maxLengthMm
          ? Number(values.maxLengthMm)
          : undefined,
        maxBundleWeightKg: values.maxBundleWeightKg || undefined,
        deliveryAfterTime: values.deliveryAfterTime || undefined,
        deliverForTime: values.deliverForTime || undefined,
        transportMode: values.transportMode || undefined,

        showNetPrice: values.showNetPrice,
        scrapSurchargeSeparate: values.scrapSurchargeSeparate,
        calculateVatIfApplicable: values.calculateVatIfApplicable,
        financialBlockage: values.financialBlockage,
        invoiceBlockage: values.invoiceBlockage,
        onlyTotalAmountOnInvoice: values.onlyTotalAmountOnInvoice,
        includeOptionPricesInMaterialPrices:
          values.includeOptionPricesInMaterialPrices,
        paymentTerms: values.paymentTerms || undefined,
        billingAddressUuid: values.billingAddressUuid || undefined,
        blockingReason: values.blockingReason || undefined,

        amountExVat: values.amountExVat || "0.00",
        weightKg: values.weightKg || "0.000",
        gainPercent: values.gainPercent || "0.00",
        remarks: values.remarks || undefined,

        documents: values.documents?.length ? values.documents : undefined,
      };

      const extras: CounterOrderExtras = {
        surcharges: values.surcharges.map((surcharge) => ({
          companyUuid: surcharge.companyUuid || null,
          order: 0,
          description: surcharge.description || null,
          surcharge: toDecimal(surcharge.surcharge, "0.00"),
          unit: surcharge.unit || null,
          fromValue: toDecimal(surcharge.fromValue, "0.00"),
          unitIndication: surcharge.unitIndication || null,
          tierUnit: surcharge.tierUnit || null,
          amount: toDecimal(surcharge.amount, "0.00"),
          profit: toDecimal(surcharge.profit, "0.00"),
          thirdParties: surcharge.thirdParties,
          companyCode: surcharge.companyCode || null,
        })),
        texts: values.texts.map((text) => ({
          title: text.title,
          textBlock: text.textBlock,
          textCategoryUuid: text.textCategoryUuid || null,
        })),
        contractUuids: values.contractUuids,
        items: values.items.map((item) => ({
          productUuid: item.productUuid,
          status: item.status,
          deliveryDate: item.deliveryDate || null,
          description: item.description || null,
          levCode: item.levCode || null,
          reference: item.reference || null,
          unit: item.unit,
          qtyPlanned: toDecimal(item.qtyPlanned, "0.000"),
          qtyActual: toDecimal(item.qtyActual, "0.000"),
          lengthMm: item.lengthMm ? Number(item.lengthMm) : null,
          kgPlanned: toDecimal(item.kgPlanned, "0.00"),
          kgActual: toDecimal(item.kgActual, "0.00"),
          grossPrice: toDecimal(item.grossPrice, "0.00"),
          lineDiscount: toDecimal(item.lineDiscount, "0.00"),
          groupDiscount: toDecimal(item.groupDiscount, "0.00"),
          netPrice: toDecimal(item.netPrice, "0.00"),
          amount: toDecimal(item.amount, "0.00"),
        })),
      };

      const result = await createCounterOrder(input, extras);
      setState(result);
    });
  });

  return { form, isPending, onSubmit, state };
};
