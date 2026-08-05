"use client";

import { updateCounterOrderContracts } from "@/app/(dashboard)/counter-orders/[uuid]/edit/actions";
import { ContractOption } from "@/app/(dashboard)/counter-orders/actions";
import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import { ContractsSection } from "../sections/contracts-section";
import { CounterOrderSectionForm } from "./counter-order-section-form";

type Props = {
  counterOrderUuid: string;
  defaultValues: CounterOrderFormValues;
  contracts: ContractOption[];
};

export const CounterOrderContractsEditor = ({
  counterOrderUuid,
  defaultValues,
  contracts,
}: Props) => (
  <CounterOrderSectionForm
    counterOrderUuid={counterOrderUuid}
    defaultValues={defaultValues}
    save={updateCounterOrderContracts}
    submitLabel="Save Contracts"
  >
    {() => <ContractsSection contracts={contracts} />}
  </CounterOrderSectionForm>
);
