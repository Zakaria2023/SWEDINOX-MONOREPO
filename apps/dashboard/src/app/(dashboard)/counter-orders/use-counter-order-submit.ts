"use client";

import { todayDateString } from "@/lib/helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  CounterOrderActionResult,
  CounterOrderInput,
  createCounterOrder,
} from "./actions";
import {
  createCounterOrderSchema,
  CounterOrderFormValues,
} from "./validation";

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
      isOverlengte: false,
      isPrinted: false,
      isMailed: false,
      isFaxed: false,
      deliveryTerms: "",
      deliveryAddressUuid: "",
      deliveryDate: "",
      deliveryRemark: "",
      amountExVat: "0.00",
      weightKg: "0.000",
      gainPercent: "0.00",
      remarks: "",
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
        isOverlengte: values.isOverlengte,
        isPrinted: values.isPrinted,
        isMailed: values.isMailed,
        isFaxed: values.isFaxed,
        deliveryTerms: values.deliveryTerms || undefined,
        deliveryAddressUuid: values.deliveryAddressUuid || undefined,
        deliveryDate: values.deliveryDate || undefined,
        deliveryRemark: values.deliveryRemark || undefined,
        amountExVat: values.amountExVat || "0.00",
        weightKg: values.weightKg || "0.000",
        gainPercent: values.gainPercent || "0.00",
        remarks: values.remarks || undefined,
      };

      const result = await createCounterOrder(input);
      setState(result);
    });
  });

  return { form, isPending, onSubmit, state };
};
