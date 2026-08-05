"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider } from "react-hook-form";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import {
  AddressOption,
  ContractOption,
  getAddressesByCompanyUuid,
  getContractsByCompanyUuid,
} from "@/app/(dashboard)/counter-orders/actions";
import { useCounterOrderSubmit } from "@/app/(dashboard)/counter-orders/use-counter-order-submit";
import { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import { ProductGroupOption } from "@/app/(dashboard)/product-groups/actions";
import {
  ContactOption,
  getContactsByCompanyUuid,
} from "@/app/(dashboard)/visit-reports/actions";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { ContractsSection } from "./sections/contracts-section";
import { DocumentsSection } from "./sections/documents-section";
import { FinancesSection } from "./sections/finances-section";
import { LogisticsSection } from "./sections/logistics-section";
import { DeliverySection } from "./sections/delivery-section";
import { HeaderSection } from "./sections/header-section";
import { OrderLinesSection } from "./sections/order-lines-section";
import { OrderTypeSection } from "./sections/order-type-section";
import { SummarySection } from "./sections/summary-section";
import { SurchargesSection } from "./sections/surcharges-section";
import { TextsSection } from "./sections/texts-section";
import { WorkordersSection } from "./sections/workorders-section";
import {
  counterOrderPriorities,
  counterOrderStatuses,
  deliveryTerms,
  orderMethods,
  salesRepresentatives,
} from "@/lib/enums";
import { COUNTER_ORDER_PRIORITY_LABELS, COUNTER_ORDER_STATUS_LABELS, DELIVERY_TERM_LABELS, ORDER_METHOD_LABELS, SALES_REPRESENTATIVE_LABELS } from "@/lib/labels";

type CounterOrderFormProps = {
  companies: CompanyOption[];
  textCategories: TextCategoryOption[];
  products: ProductOption[];
  productGroups: ProductGroupOption[];
};

export const CounterOrderForm = ({
  companies,
  textCategories,
  products,
  productGroups,
}: CounterOrderFormProps) => {
  const router = useRouter();
  const { form, isPending, onSubmit, state } = useCounterOrderSubmit();

  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [contracts, setContracts] = useState<ContractOption[]>([]);

  const handleCompanyChange = async (
    value: string,
    fieldOnChange: (value: string) => void,
  ) => {
    fieldOnChange(value);
    form.setValue("contactUuid", "");
    form.setValue("deliveryAddressUuid", "");
    form.setValue("billingAddressUuid", "");
    form.setValue("contractUuids", []);
    setContacts([]);
    setAddresses([]);
    setContracts([]);

    if (value) {
      const [contactResult, addressResult, contractResult] = await Promise.all([
        getContactsByCompanyUuid(value),
        getAddressesByCompanyUuid(value),
        getContractsByCompanyUuid(value),
      ]);
      setContacts(contactResult);
      setAddresses(addressResult);
      setContracts(contractResult);
    }
  };

  const companyOptions = [
    { value: "", label: "Select an option" },
    ...companies.map((company) => ({
      value: company.uuid,
      label: [company.searchCode1, company.companyName]
        .filter(Boolean)
        .join(" - "),
    })),
  ];

  const contactOptions = [
    { value: "", label: "Empty" },
    ...contacts.map((contact) => ({
      value: contact.uuid,
      label:
        [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
        "Contact",
    })),
  ];

  const addressOptions = [
    { value: "", label: "Empty" },
    ...addresses.map((address) => ({
      value: address.uuid,
      label:
        [address.streetAndNo, address.postalCode, address.city]
          .filter(Boolean)
          .join(", ") || "Address",
    })),
  ];

  const orderMethodOptions = [
    { value: "", label: "Empty" },
    ...orderMethods.map((method) => ({
      value: method,
      label: ORDER_METHOD_LABELS[method],
    })),
  ];

  const sellerOptions = [
    { value: "", label: "Empty" },
    ...salesRepresentatives.map((rep) => ({
      value: rep,
      label: SALES_REPRESENTATIVE_LABELS[rep],
    })),
  ];

  const statusOptions = counterOrderStatuses.map((status) => ({
    value: status,
    label: COUNTER_ORDER_STATUS_LABELS[status],
  }));

  const priorityOptions = counterOrderPriorities.map((priority) => ({
    value: priority,
    label: COUNTER_ORDER_PRIORITY_LABELS[priority],
  }));

  const deliveryTermOptions = [
    { value: "", label: "Empty" },
    ...deliveryTerms.map((term) => ({
      value: term,
      label: DELIVERY_TERM_LABELS[term],
    })),
  ];

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        <HeaderSection
          isPending={isPending}
          companyOptions={companyOptions}
          contactOptions={contactOptions}
          hasContacts={contacts.length > 0}
          orderMethodOptions={orderMethodOptions}
          sellerOptions={sellerOptions}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          onCompanyChange={(value) =>
            handleCompanyChange(value, (next) =>
              form.setValue("companyUuid", next),
            )
          }
        />

        <OrderTypeSection isPending={isPending} />

        <DeliverySection
          isPending={isPending}
          addressOptions={addressOptions}
          deliveryTermOptions={deliveryTermOptions}
        />

        <OrderLinesSection products={products} productGroups={productGroups} />

        <LogisticsSection />

        <FinancesSection addressOptions={addressOptions} />

        <SurchargesSection companyOptions={companyOptions} />

        <DocumentsSection />

        <ContractsSection contracts={contracts} />

        <WorkordersSection />

        <TextsSection textCategories={textCategories} />

        <SummarySection isPending={isPending} />

        <FormError>{state.error}</FormError>

        <FormActions
          isPending={isPending}
          onCancel={() => router.push("/counter-orders")}
          submitLabel="Create Counter Order"
        />
      </form>
    </FormProvider>
  );
};
