"use client";

import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { FormLabel } from "@/components/ui/form-field";
import { useFormContext } from "react-hook-form";

type Props = {
  isPending: boolean;
};

export const SummarySection = ({ isPending }: Props) => {
  const { register } = useFormContext<CounterOrderFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
        Summary
      </h2>
      <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 md:grid-cols-3">
        <div>
          <FormLabel htmlFor="amountExVat">Amount (ex VAT)</FormLabel>
          <Input
            id="amountExVat"
            inputMode="decimal"
            {...register("amountExVat")}
            disabled={isPending}
          />
        </div>
        <div>
          <FormLabel htmlFor="weightKg">Weight (kg)</FormLabel>
          <Input
            id="weightKg"
            inputMode="decimal"
            {...register("weightKg")}
            disabled={isPending}
          />
        </div>
        <div>
          <FormLabel htmlFor="gainPercent">Gain %</FormLabel>
          <Input
            id="gainPercent"
            inputMode="decimal"
            {...register("gainPercent")}
            disabled={isPending}
          />
        </div>
        <div className="md:col-span-3">
          <FormLabel htmlFor="remarks">Remarks</FormLabel>
          <Textarea
            id="remarks"
            {...register("remarks")}
            disabled={isPending}
          />
        </div>
      </div>
    </section>
  );
};
