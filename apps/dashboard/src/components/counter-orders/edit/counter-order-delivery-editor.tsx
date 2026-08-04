"use client";

import { updateCounterOrderDelivery } from "@/app/(dashboard)/counter-orders/[uuid]/edit/actions";
import { AddressOption } from "@/app/(dashboard)/counter-orders/actions";
import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import { SelectOption } from "@/components/shadcn/select";
import { deliveryTerms } from "@/lib/enums";
import { DELIVERY_TERM_LABELS } from "@/lib/labels";
import { DeliverySection } from "../sections/delivery-section";
import { CounterOrderSectionForm } from "./counter-order-section-form";
import { addressSelectOptions } from "./address-options";

type Props = {
  counterOrderUuid: string;
  defaultValues: CounterOrderFormValues;
  addresses: AddressOption[];
};

export const CounterOrderDeliveryEditor = ({
  counterOrderUuid,
  defaultValues,
  addresses,
}: Props) => {
  const deliveryTermOptions: SelectOption[] = [
    { value: "", label: "Empty" },
    ...deliveryTerms.map((term) => ({
      value: term,
      label: DELIVERY_TERM_LABELS[term],
    })),
  ];

  return (
    <CounterOrderSectionForm
      counterOrderUuid={counterOrderUuid}
      defaultValues={defaultValues}
      save={updateCounterOrderDelivery}
      submitLabel="Save Delivery"
    >
      {(isPending) => (
        <DeliverySection
          isPending={isPending}
          addressOptions={addressSelectOptions(addresses)}
          deliveryTermOptions={deliveryTermOptions}
        />
      )}
    </CounterOrderSectionForm>
  );
};
