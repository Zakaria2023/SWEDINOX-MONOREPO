"use client";

import { updateCounterOrderDocuments } from "@/app/(dashboard)/counter-orders/[uuid]/edit/actions";
import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import { DocumentsSection } from "../sections/documents-section";
import { CounterOrderSectionForm } from "./counter-order-section-form";

type Props = {
  counterOrderUuid: string;
  defaultValues: CounterOrderFormValues;
};

export const CounterOrderDocumentsEditor = ({
  counterOrderUuid,
  defaultValues,
}: Props) => (
  <CounterOrderSectionForm
    counterOrderUuid={counterOrderUuid}
    defaultValues={defaultValues}
    save={updateCounterOrderDocuments}
    submitLabel="Save Documents"
  >
    {() => <DocumentsSection />}
  </CounterOrderSectionForm>
);
