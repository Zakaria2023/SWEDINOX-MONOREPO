"use client";

import { updateCounterOrderTexts } from "@/app/(dashboard)/counter-orders/[uuid]/edit/actions";
import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import { TextsSection } from "../sections/texts-section";
import { CounterOrderSectionForm } from "./counter-order-section-form";

type Props = {
  counterOrderUuid: string;
  defaultValues: CounterOrderFormValues;
  textCategories: TextCategoryOption[];
};

export const CounterOrderTextsEditor = ({
  counterOrderUuid,
  defaultValues,
  textCategories,
}: Props) => (
  <CounterOrderSectionForm
    counterOrderUuid={counterOrderUuid}
    defaultValues={defaultValues}
    save={updateCounterOrderTexts}
    submitLabel="Save Texts"
  >
    {() => <TextsSection textCategories={textCategories} />}
  </CounterOrderSectionForm>
);
