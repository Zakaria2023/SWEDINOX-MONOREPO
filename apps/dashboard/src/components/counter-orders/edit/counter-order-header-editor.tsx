"use client";

import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { updateCounterOrderHeader } from "@/app/(dashboard)/counter-orders/[uuid]/edit/actions";
import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import {
  ContactOption,
  getContactsForCompany,
} from "@/app/(dashboard)/contacts/actions";
import { SelectOption } from "@/components/shadcn/select";
import { companyOptionLabel } from "@/lib/helpers";
import {
  counterOrderPriorities,
  counterOrderStatuses,
  orderMethods,
  salesRepresentatives,
} from "@/lib/enums";
import {
  COUNTER_ORDER_PRIORITY_LABELS,
  COUNTER_ORDER_STATUS_LABELS,
  ORDER_METHOD_LABELS,
  SALES_REPRESENTATIVE_LABELS,
} from "@/lib/labels";
import { useEffect, useState } from "react";
import { HeaderSection } from "../sections/header-section";
import { CounterOrderSectionForm } from "./counter-order-section-form";

type Props = {
  counterOrderUuid: string;
  defaultValues: CounterOrderFormValues;
  companies: CompanyOption[];
};

const emptyOption: SelectOption = { value: "", label: "Empty" };

export const CounterOrderHeaderEditor = ({
  counterOrderUuid,
  defaultValues,
  companies,
}: Props) => {
  const [contacts, setContacts] = useState<ContactOption[]>([]);

  // An existing order already names a customer, so its contacts have to be
  // fetched before the form can show which one is selected.
  const companyUuid = defaultValues.companyUuid;
  useEffect(() => {
    if (!companyUuid) {
      return;
    }
    getContactsForCompany(companyUuid).then(setContacts);
  }, [companyUuid]);

  const companyOptions: SelectOption[] = [
    { value: "", label: "Select an option" },
    ...companies.map((company) => ({
      value: company.uuid,
      label: companyOptionLabel(company),
    })),
  ];

  const contactOptions: SelectOption[] = [
    emptyOption,
    ...contacts.map((contact) => ({
      value: contact.uuid,
      label:
        [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
        "Contact",
    })),
  ];

  const orderMethodOptions: SelectOption[] = [
    emptyOption,
    ...orderMethods.map((method) => ({
      value: method,
      label: ORDER_METHOD_LABELS[method],
    })),
  ];

  const sellerOptions: SelectOption[] = [
    emptyOption,
    ...salesRepresentatives.map((rep) => ({
      value: rep,
      label: SALES_REPRESENTATIVE_LABELS[rep],
    })),
  ];

  const statusOptions: SelectOption[] = counterOrderStatuses.map((status) => ({
    value: status,
    label: COUNTER_ORDER_STATUS_LABELS[status],
  }));

  const priorityOptions: SelectOption[] = counterOrderPriorities.map(
    (priority) => ({
      value: priority,
      label: COUNTER_ORDER_PRIORITY_LABELS[priority],
    }),
  );

  return (
    <CounterOrderSectionForm
      counterOrderUuid={counterOrderUuid}
      defaultValues={defaultValues}
      save={updateCounterOrderHeader}
      submitLabel="Save Counter Order"
    >
      {(isPending) => (
        <HeaderSection
          isPending={isPending}
          companyOptions={companyOptions}
          contactOptions={contactOptions}
          hasContacts={contacts.length > 0}
          orderMethodOptions={orderMethodOptions}
          sellerOptions={sellerOptions}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          onCompanyChange={(value) => {
            getContactsForCompany(value).then(setContacts);
          }}
        />
      )}
    </CounterOrderSectionForm>
  );
};
