"use client";

import { useFormContext } from "react-hook-form";
import { PurchaseOrderFormValues } from "@/app/(dashboard)/purchase-orders/validation";
import { Textarea } from "@/components/shadcn/textarea";

export const PurchaseOrderRemarksSection = () => {
  const { register } = useFormContext<PurchaseOrderFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Remarks</h2>
      <Textarea
        id="remarks"
        rows={4}
        placeholder="Additional remarks..."
        {...register("remarks")}
      />
    </section>
  );
};
