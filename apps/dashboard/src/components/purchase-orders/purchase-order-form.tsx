"use client";

import { FormProvider } from "react-hook-form";
import { usePurchaseOrderSubmit } from "@/app/(dashboard)/purchase-orders/use-purchase-order-submit";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { PurchaseOrderInformationSection } from "./sections/purchase-order-information-section";
import { PurchaseOrderTypeSection } from "./sections/purchase-order-type-section";
import { POFinancesSection } from "./sections/po-finances-section";
import { PODeliverySection } from "./sections/po-delivery-section";
import { POLogisticsSection } from "./sections/po-logistics-section";
import { PORemarksSection } from "./sections/po-remarks-section";

type Props = {
  companies: CompanyOption[];
};

export const PurchaseOrderForm = ({ companies }: Props) => {
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
    isLoadingSupplierData,
    handleSupplierChange,
    handleCancel,
  } = usePurchaseOrderSubmit({ companies });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        <FormError>{state.error}</FormError>

        <PurchaseOrderInformationSection
          supplierOptions={supplierOptions}
          agentOptions={agentOptions}
          contactOptions={contactOptions}
          isLoadingSupplierData={isLoadingSupplierData}
          handleSupplierChange={handleSupplierChange}
        />

        <PurchaseOrderTypeSection
          purchaseOrderTypeOptions={purchaseOrderTypeOptions}
          weightTypeOptions={weightTypeOptions}
        />

        <POFinancesSection paymentTermOptions={paymentTermOptions} />

        <PODeliverySection
          arrangeTransport={arrangeTransport}
          deliveryType={deliveryType}
          deliveryTermOptions={deliveryTermOptions}
          supplierAddressOptions={supplierAddressOptions}
        />

        <POLogisticsSection />

        <PORemarksSection />

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
