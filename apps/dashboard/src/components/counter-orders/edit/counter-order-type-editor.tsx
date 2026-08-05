"use client";

import { updateCounterOrderType } from "@/app/(dashboard)/counter-orders/[uuid]/edit/actions";
import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import { OrderTypeSection } from "../sections/order-type-section";
import { CounterOrderSectionForm } from "./counter-order-section-form";

type Props = {
  counterOrderUuid: string;
  defaultValues: CounterOrderFormValues;
};

export const CounterOrderTypeEditor = ({ counterOrderUuid, defaultValues }: Props) => (
  <CounterOrderSectionForm
    counterOrderUuid={counterOrderUuid}
    defaultValues={defaultValues}
    save={updateCounterOrderType}
    submitLabel="Save Order Type"
  >
    {(isPending) => <OrderTypeSection isPending={isPending} />}
  </CounterOrderSectionForm>
);
