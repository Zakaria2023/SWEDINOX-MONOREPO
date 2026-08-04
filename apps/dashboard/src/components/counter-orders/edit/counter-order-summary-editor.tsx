"use client";

import { updateCounterOrderSummary } from "@/app/(dashboard)/counter-orders/[uuid]/edit/actions";
import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import { SummarySection } from "../sections/summary-section";
import { CounterOrderSectionForm } from "./counter-order-section-form";

type Props = {
  counterOrderUuid: string;
  defaultValues: CounterOrderFormValues;
};

export const CounterOrderSummaryEditor = ({ counterOrderUuid, defaultValues }: Props) => (
  <CounterOrderSectionForm
    counterOrderUuid={counterOrderUuid}
    defaultValues={defaultValues}
    save={updateCounterOrderSummary}
    submitLabel="Save Summary"
  >
    {(isPending) => <SummarySection isPending={isPending} />}
  </CounterOrderSectionForm>
);
