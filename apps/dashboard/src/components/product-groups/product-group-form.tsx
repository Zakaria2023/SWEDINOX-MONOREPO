"use client";

import { FormProvider } from "react-hook-form";
import { useProductGroupSubmit } from "@/app/(dashboard)/product-groups/use-product-group-submit";
import { ProductGroupOption } from "@/app/(dashboard)/product-groups/actions";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { GeneralSection } from "./sections/general-section";
import { BasisSection } from "./sections/basis-section";
import { PurchaseSection } from "./sections/purchase-section";
import { WarehouseControlSection } from "./sections/warehouse-control-section";
import { StockPolicySection } from "./sections/stock-policy-section";
import { SalesSection } from "./sections/sales-section";
import { SupplierSection } from "./sections/supplier-section";
import { DocumentsSection } from "./sections/documents-section";

type Props = {
  existingGroups: ProductGroupOption[];
  companies: CompanyOption[];
};

export const ProductGroupForm = ({ existingGroups, companies }: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    parentGroupOptions,
    supplierOptions,
    handleCancel,
  } = useProductGroupSubmit({ existingGroups, companies });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-10">
        {state.error && <FormError>{state.error}</FormError>}

        <GeneralSection parentGroupOptions={parentGroupOptions} />
        <BasisSection />
        <PurchaseSection />
        <WarehouseControlSection />
        <StockPolicySection />
        <SalesSection />
        <SupplierSection supplierOptions={supplierOptions} />
        <DocumentsSection />

        <FormActions
          submitLabel="Save Product Group"
          isPending={isPending}
          onCancel={handleCancel}
        />
      </form>
    </FormProvider>
  );
};
