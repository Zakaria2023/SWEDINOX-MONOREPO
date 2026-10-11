"use client";

import { useFormContext } from "react-hook-form";
import { OrderFormValues } from "@/app/(dashboard)/orders/validation";
import { Textarea } from "@/components/shadcn/textarea";

export const RemarksSection = () => {
  const { register } = useFormContext<OrderFormValues>();

  return (
    <section className="space-y-4">
      <Textarea
        id="remarks"
        rows={4}
        placeholder="Additional remarks..."
        {...register("remarks")}
      />
    </section>
  );
};
