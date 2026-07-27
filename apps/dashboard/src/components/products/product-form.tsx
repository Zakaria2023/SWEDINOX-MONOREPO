"use client";

import { FormProvider } from "react-hook-form";
import { useProductSubmit } from "@/app/(dashboard)/products/use-product-submit";
import { ProductGroupOption } from "@/app/(dashboard)/product-groups/actions";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { BasicInformationSection } from "./sections/basic-information-section";
import { FlagsSection } from "./sections/flags-section";
import { DimensionsSection } from "./sections/dimensions-section";
import { StockAndWeightSection } from "./sections/stock-and-weight-section";

type Props = {
  productGroups: ProductGroupOption[];
  suppliers: CompanyOption[];
};

export const ProductForm = ({ productGroups, suppliers }: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    groupOptions,
    companyOptions,
    handleCancel,
  } = useProductSubmit({ productGroups, suppliers });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        <FormError>{state.error}</FormError>

        <BasicInformationSection
          groupOptions={groupOptions}
          companyOptions={companyOptions}
        />

        <FlagsSection />

        <DimensionsSection />

        <StockAndWeightSection />

        <FormActions
          submitLabel="Create Product"
          pendingLabel="Creating..."
          isPending={isPending}
          onCancel={handleCancel}
        />
      </form>
    </FormProvider>
  );
};
