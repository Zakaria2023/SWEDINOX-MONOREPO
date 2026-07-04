"use client";

import { useWarehouseSubSectionSubmit } from "@/app/(dashboard)/warehouse-sub-sections/use-warehouse-sub-section-submit";
import { WarehouseItemOption } from "@/app/(dashboard)/warehouses/actions";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormProvider } from "react-hook-form";
import { AdaptFromSection } from "./sections/adapt-from-section";
import { GeneralSection } from "./sections/general-section";
import { StatusSection } from "./sections/status-section";

type Props = {
  allItems: WarehouseItemOption[];
};

export const WarehouseSubSectionForm = ({ allItems }: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    blocked,
    placement,
    isNextDisabled,
    adaptFromOptions,
    locationTypeOptions,
    loadingLocationOptions,
    blockReasonOptions,
    handleAdaptFrom,
    handleCancel,
  } = useWarehouseSubSectionSubmit({ allItems });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        {state.error && <FormError>{state.error}</FormError>}

        <AdaptFromSection
          adaptFromOptions={adaptFromOptions}
          placement={placement}
          isNextDisabled={isNextDisabled}
          handleAdaptFrom={handleAdaptFrom}
        />

        <GeneralSection
          locationTypeOptions={locationTypeOptions}
          loadingLocationOptions={loadingLocationOptions}
        />

        <StatusSection
          blocked={blocked}
          blockReasonOptions={blockReasonOptions}
        />

        <FormActions
          submitLabel="Save Sub Section"
          isPending={isPending}
          onCancel={handleCancel}
        />
      </form>
    </FormProvider>
  );
};
