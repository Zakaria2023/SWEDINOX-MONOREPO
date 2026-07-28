"use client";

import { FormProvider } from "react-hook-form";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { LocationOption } from "@/app/(dashboard)/locations/actions";
import { ProductGroupOption } from "@/app/(dashboard)/product-groups/actions";
import {
  ProductOption,
  RevenueGroupOption,
} from "@/app/(dashboard)/products/actions";
import { useProductSubmit } from "@/app/(dashboard)/products/use-product-submit";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { AlternativesSection } from "./sections/alternatives-section";
import { BasisSection } from "./sections/basis-section";
import { ClassificationSection } from "./sections/classification-section";
import { IdentitySection } from "./sections/identity-section";
import { OptimizationCriteriaSection } from "./sections/optimization-criteria-section";
import { PreferredLocationsSection } from "./sections/preferred-locations-section";
import { PriceStructuresSection } from "./sections/price-structures-section";
import { PurchaseSection } from "./sections/purchase-section";
import { SalesSection } from "./sections/sales-section";
import { SawingPricesSection } from "./sections/sawing-prices-section";
import { StockControlSection } from "./sections/stock-control-section";
import { StockPolicySection } from "./sections/stock-policy-section";
import { SuppliersSection } from "./sections/suppliers-section";
import { ValuationSection } from "./sections/valuation-section";
import { WarehouseControlSection } from "./sections/warehouse-control-section";

type Props = {
  productGroups: ProductGroupOption[];
  suppliers: CompanyOption[];
  products: ProductOption[];
  locations: LocationOption[];
  revenueGroups: RevenueGroupOption[];
  /** Set when editing an existing product; omitted when creating one. */
  productUuid?: string;
  defaultValues?: ProductFormValues;
};

export const ProductForm = ({
  productGroups,
  suppliers,
  products,
  locations,
  revenueGroups,
  productUuid,
  defaultValues,
}: Props) => {
  const {
    form,
    isPending,
    isEditing,
    onSubmit,
    state,
    groupOptions,
    companyOptions,
    productOptions,
    locationOptions,
    revenueGroupOptions,
    handleCancel,
  } = useProductSubmit({
    productGroups,
    suppliers,
    products,
    locations,
    revenueGroups,
    productUuid,
    defaultValues,
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-10">
        <FormError>{state.error}</FormError>

        <IdentitySection
          groupOptions={groupOptions}
          companyOptions={companyOptions}
          revenueGroupOptions={revenueGroupOptions}
        />

        <BasisSection productOptions={productOptions} />

        <ClassificationSection />

        <AlternativesSection productOptions={productOptions} />

        <ValuationSection />

        <PriceStructuresSection />

        <SawingPricesSection />

        <PurchaseSection />

        <SuppliersSection supplierOptions={companyOptions} />

        <SalesSection />

        <WarehouseControlSection />

        <StockControlSection
          productOptions={productOptions}
          locationOptions={locationOptions}
        />

        <PreferredLocationsSection locationOptions={locationOptions} />

        <StockPolicySection />

        <OptimizationCriteriaSection />

        <FormActions
          submitLabel={isEditing ? "Save Product" : "Create Product"}
          pendingLabel={isEditing ? "Saving..." : "Creating..."}
          isPending={isPending}
          onCancel={handleCancel}
        />
      </form>
    </FormProvider>
  );
};
