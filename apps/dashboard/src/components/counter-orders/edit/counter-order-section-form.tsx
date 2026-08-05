"use client";

import { CounterOrderActionResult } from "@/app/(dashboard)/counter-orders/actions";
import {
  CounterOrderFormValues,
  createCounterOrderSchema,
} from "@/app/(dashboard)/counter-orders/validation";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ReactNode, useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";

type Props = {
  counterOrderUuid: string;
  defaultValues: CounterOrderFormValues;
  /** Writes only the columns or child rows this section owns. */
  save: (
    counterOrderUuid: string,
    values: CounterOrderFormValues,
  ) => Promise<CounterOrderActionResult>;
  submitLabel?: string;
  children: (isPending: boolean) => ReactNode;
};

/** The shell every counter order section edits inside. */
export const CounterOrderSectionForm = ({
  counterOrderUuid,
  defaultValues,
  save,
  submitLabel = "Save Changes",
  children,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<CounterOrderActionResult>({});

  const form = useForm<CounterOrderFormValues>({
    resolver: zodResolver(createCounterOrderSchema()),
    defaultValues,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setState(await save(counterOrderUuid, values));
    });
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        {state.error && <FormError>{state.error}</FormError>}

        {children(isPending)}

        <FormActions
          submitLabel={submitLabel}
          isPending={isPending}
          onCancel={() =>
            router.push(`/counter-orders/${counterOrderUuid}/edit`)
          }
        />
      </form>
    </FormProvider>
  );
};
