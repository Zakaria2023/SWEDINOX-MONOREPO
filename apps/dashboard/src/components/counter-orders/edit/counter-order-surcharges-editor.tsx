"use client";

import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { updateCounterOrderSurcharges } from "@/app/(dashboard)/counter-orders/[uuid]/edit/actions";
import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import { SelectOption } from "@/components/shadcn/select";
import { SurchargesSection } from "../sections/surcharges-section";
import { CounterOrderSectionForm } from "./counter-order-section-form";

type Props = {
  counterOrderUuid: string;
  defaultValues: CounterOrderFormValues;
  companies: CompanyOption[];
};

export const CounterOrderSurchargesEditor = ({
  counterOrderUuid,
  defaultValues,
  companies,
}: Props) => {
  const companyOptions: SelectOption[] = [
    { value: "", label: "Select an option" },
    ...companies.map((company) => ({
      value: company.uuid,
      label:
        [company.searchCode1, company.companyName]
          .filter(Boolean)
          .join(" - ") || company.uuid,
    })),
  ];

  return (
    <CounterOrderSectionForm
      counterOrderUuid={counterOrderUuid}
      defaultValues={defaultValues}
      save={updateCounterOrderSurcharges}
      submitLabel="Save Surcharges"
    >
      {() => <SurchargesSection companyOptions={companyOptions} />}
    </CounterOrderSectionForm>
  );
};
