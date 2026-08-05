"use client";

import { updateCounterOrderLines } from "@/app/(dashboard)/counter-orders/[uuid]/edit/actions";
import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import { ProductGroupOption } from "@/app/(dashboard)/product-groups/actions";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import { OrderLinesSection } from "../sections/order-lines-section";
import { CounterOrderSectionForm } from "./counter-order-section-form";

type Props = {
  counterOrderUuid: string;
  defaultValues: CounterOrderFormValues;
  products: ProductOption[];
  productGroups: ProductGroupOption[];
};

export const CounterOrderLinesEditor = ({
  counterOrderUuid,
  defaultValues,
  products,
  productGroups,
}: Props) => (
  <CounterOrderSectionForm
    counterOrderUuid={counterOrderUuid}
    defaultValues={defaultValues}
    save={updateCounterOrderLines}
    submitLabel="Save Order Lines"
  >
    {() => (
      <OrderLinesSection products={products} productGroups={productGroups} />
    )}
  </CounterOrderSectionForm>
);
