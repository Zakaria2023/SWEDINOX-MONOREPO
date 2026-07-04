"use client";

import { FormProvider } from "react-hook-form";
import { usePurchaseOrderSubmit } from "@/app/(dashboard)/purchase-orders/use-purchase-order-submit";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { PurchaseOrderInformationSection } from "./sections/purchase-order-information-section";
import { PurchaseOrderTypeSection } from "./sections/purchase-order-type-section";
import { PurchaseOrderFinancesSection } from "./sections/purchase-order-finances-section";
import { PurchaseOrderDeliverySection } from "./sections/purchase-order-delivery-section";
import { PurchaseOrderLogisticsSection } from "./sections/purchase-order-logistics-section";
import { PurchaseOrderRemarksSection } from "./sections/purchase-order-remarks-section";
import { ClerkUserOption } from "@/lib/server/clerk";

type Props = {
  companies: CompanyOption[];
  clerkUsers: ClerkUserOption[];
};

export const PurchaseOrderForm = ({ companies, clerkUsers }: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    arrangeTransport,
    deliveryType,
    supplierOptions,
    agentOptions,
    contactOptions,
    supplierAddressOptions,
    purchaseOrderTypeOptions,
    weightTypeOptions,
    deliveryTermOptions,
    paymentTermOptions,
    purchaserOptions,
    isLoadingSupplierData,
    handleSupplierChange,
    handleCancel,
  } = usePurchaseOrderSubmit({ companies, clerkUsers });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        <FormError>{state.error}</FormError>

        <PurchaseOrderInformationSection
          supplierOptions={supplierOptions}
          agentOptions={agentOptions}
          contactOptions={contactOptions}
          purchaserOptions={purchaserOptions}
          isLoadingSupplierData={isLoadingSupplierData}
          handleSupplierChange={handleSupplierChange}
        />

        <PurchaseOrderTypeSection
          purchaseOrderTypeOptions={purchaseOrderTypeOptions}
          weightTypeOptions={weightTypeOptions}
        />

        <PurchaseOrderFinancesSection paymentTermOptions={paymentTermOptions} />

        <PurchaseOrderDeliverySection
          arrangeTransport={arrangeTransport}
          deliveryType={deliveryType}
          deliveryTermOptions={deliveryTermOptions}
          supplierAddressOptions={supplierAddressOptions}
        />

        <PurchaseOrderLogisticsSection />

        <PurchaseOrderRemarksSection />

        <FormActions
          submitLabel="Create Purchase Order"
          pendingLabel="Creating..."
          isPending={isPending}
          onCancel={handleCancel}
        />
      </form>
    </FormProvider>
  );
};
