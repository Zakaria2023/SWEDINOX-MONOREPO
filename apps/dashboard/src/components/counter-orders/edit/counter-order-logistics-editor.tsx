"use client";

import { updateCounterOrderLogistics } from "@/app/(dashboard)/counter-orders/[uuid]/edit/actions";
import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import { LogisticsSection } from "../sections/logistics-section";
import { CounterOrderSectionForm } from "./counter-order-section-form";

type Props = {
  counterOrderUuid: string;
  defaultValues: CounterOrderFormValues;
};

export const CounterOrderLogisticsEditor = ({
  counterOrderUuid,
  defaultValues,
}: Props) => (
  <CounterOrderSectionForm
    counterOrderUuid={counterOrderUuid}
    defaultValues={defaultValues}
    save={updateCounterOrderLogistics}
    submitLabel="Save Logistics"
  >
    {() => <LogisticsSection />}
  </CounterOrderSectionForm>
);
