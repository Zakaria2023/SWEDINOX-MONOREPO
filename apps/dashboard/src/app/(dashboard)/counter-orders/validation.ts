import { z } from "zod";
import {
  counterOrderPriorities,
  counterOrderStatuses,
  deliveryTerms,
  orderMethods,
} from "@/lib/enums";

export const createCounterOrderSchema = () =>
  z.object({
    companyUuid: z.string().min(1, "Customer is required"),
    contactUuid: z.string().optional(),
    customerRef: z.string().optional(),
    leaveCustomer: z.boolean(),
    orderMethod: z.union([z.enum(orderMethods), z.literal("")]).optional(),
    ourReference: z.string().optional(),
    seller: z.string().optional(),
    projectUuid: z.string().optional(),
    status: z.enum(counterOrderStatuses),
    priority: z.enum(counterOrderPriorities),
    priceDate: z.string().optional(),
    orderDate: z.string().optional(),
    handlingBlocked: z.boolean(),
    printPickingSlips: z.boolean(),
    isPickup: z.boolean(),
    isIncidental: z.boolean(),
    isOverlengte: z.boolean(),
    isPrinted: z.boolean(),
    isMailed: z.boolean(),
    isFaxed: z.boolean(),
    deliveryTerms: z.union([z.enum(deliveryTerms), z.literal("")]).optional(),
    deliveryAddressUuid: z.string().optional(),
    deliveryDate: z.string().optional(),
    deliveryRemark: z.string().optional(),
    amountExVat: z.string().optional(),
    weightKg: z.string().optional(),
    gainPercent: z.string().optional(),
    remarks: z.string().optional(),
  });

export type CounterOrderFormValues = z.infer<
  ReturnType<typeof createCounterOrderSchema>
>;
