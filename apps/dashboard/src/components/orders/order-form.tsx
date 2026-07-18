"use client";

import { FormProvider } from "react-hook-form";
import { useOrderSubmit } from "@/app/(dashboard)/orders/use-order-submit";
import { ClerkUserOption } from "@/lib/server/clerk";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { OrderInformationSection } from "./sections/order-information-section";
import { OrderTypeSection } from "./sections/order-type-section";
import { DeliverySection } from "./sections/delivery-section";
import { LogisticsSection } from "./sections/logistics-section";
import { FinancesSection } from "./sections/finances-section";
import { ContractsSection } from "./sections/contracts-section";
import { SurchargesSection } from "./sections/surcharges-section";
import { RemarksSection } from "./sections/remarks-section";
import { TextsSection } from "./sections/texts-section";
import { DocumentsSection } from "./sections/documents-section";

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
    weightTypeOptions,
    paymentTermOptions,
    contracts,
    isLoadingCompanyData,
    handleCompanyChange,
    handleCancel,
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

        <OrderTypeSection
          isConsignment={isConsignment}
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
