"use client";

import { FormProvider } from "react-hook-form";
import { useProductSubmit } from "@/app/(dashboard)/products/use-product-submit";
import { ProductGroupOption } from "@/app/(dashboard)/product-groups/actions";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { BasicInformationSection } from "./sections/basic-information-section";
import { FlagsSection } from "./sections/flags-section";
import { DimensionsSection } from "./sections/dimensions-section";
import { StockAndWeightSection } from "./sections/stock-and-weight-section";

type Props = {
  productGroups: ProductGroupOption[];
};

export const ProductForm = ({ productGroups }: Props) => {
  const { form, isPending, onSubmit, state, groupOptions, handleCancel } =
    useProductSubmit({ productGroups });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        <FormError>{state.error}</FormError>

        <BasicInformationSection groupOptions={groupOptions} />

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
