"use client";

import { updateCounterOrderFinances } from "@/app/(dashboard)/counter-orders/[uuid]/edit/actions";
import { AddressOption } from "@/app/(dashboard)/counter-orders/actions";
import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import { FinancesSection } from "../sections/finances-section";
import { addressSelectOptions } from "./address-options";
import { CounterOrderSectionForm } from "./counter-order-section-form";

type Props = {
  counterOrderUuid: string;
  defaultValues: CounterOrderFormValues;
  addresses: AddressOption[];
};

export const CounterOrderFinancesEditor = ({
  counterOrderUuid,
  defaultValues,
  addresses,
}: Props) => (
  <CounterOrderSectionForm
    counterOrderUuid={counterOrderUuid}
    defaultValues={defaultValues}
    save={updateCounterOrderFinances}
    submitLabel="Save Finances"
  >
    {() => <FinancesSection addressOptions={addressSelectOptions(addresses)} />}
  </CounterOrderSectionForm>
);
