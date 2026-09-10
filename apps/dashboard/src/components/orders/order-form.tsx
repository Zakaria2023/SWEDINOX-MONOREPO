"use client";

import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { useOrderSubmit } from "@/app/(dashboard)/orders/use-order-submit";
import { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { ClerkUserOption } from "@/lib/server/clerk";
import { FormProvider } from "react-hook-form";
import { ContractsSection } from "./sections/contracts-section";
import { DeliverySection } from "./sections/delivery-section";
import { DocumentsSection } from "./sections/documents-section";
import { FinancesSection } from "./sections/finances-section";
import { LogisticsSection } from "./sections/logistics-section";
import { OrderInformationSection } from "./sections/order-information-section";
import { OrderItemsSection } from "./sections/order-items-section";
import { OrderTypeSection } from "./sections/order-type-section";
import { RemarksSection } from "./sections/remarks-section";
import { SurchargesSection } from "./sections/surcharges-section";
import { TextsSection } from "./sections/texts-section";

type Props = {
  companies: CompanyOption[];
  clerkUsers: ClerkUserOption[];
  textCategories: TextCategoryOption[];
};

export const OrderForm = ({ companies, clerkUsers, textCategories }: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    isPickup,
    isConsignment,
    deliveryType,
    companyOptions,
    contactOptions,
    projectOptions,
    addressOptions,
    orderMethodOptions,
    deliveryTermOptions,
    orderTypeOptions,
    weightTypeOptions,
    paymentTermOptions,
    contracts,
    isLoadingCompanyData,
    handleCompanyChange,
    handleCancel,
    stockOptions,
    itemFields,
    appendItem,
    removeItem,
  } = useOrderSubmit({ companies });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        <FormError>{state.error}</FormError>

        <OrderInformationSection
          companyOptions={companyOptions}
          contactOptions={contactOptions}
          orderMethodOptions={orderMethodOptions}
          projectOptions={projectOptions}
          clerkUsers={clerkUsers}
          isLoadingCompanyData={isLoadingCompanyData}
          handleCompanyChange={handleCompanyChange}
        />

        <OrderItemsSection
          stockOptions={stockOptions}
          itemFields={itemFields}
          appendItem={appendItem}
          removeItem={removeItem}
        />

        <OrderTypeSection
          isConsignment={isConsignment}
          orderTypeOptions={orderTypeOptions}
          weightTypeOptions={weightTypeOptions}
        />

        <DeliverySection
          isPickup={isPickup}
          deliveryType={deliveryType}
          addressOptions={addressOptions}
          deliveryTermOptions={deliveryTermOptions}
        />

        <LogisticsSection />

        <FinancesSection
          addressOptions={addressOptions}
          paymentTermOptions={paymentTermOptions}
        />

        <ContractsSection contracts={contracts} />

        <SurchargesSection companyOptions={companyOptions} />

        <RemarksSection />

        <TextsSection textCategories={textCategories} />

        <DocumentsSection />

        <FormActions
          submitLabel="Create Order"
          pendingLabel="Creating..."
          isPending={isPending}
          onCancel={handleCancel}
        />
      </form>
    </FormProvider>
  );
};
