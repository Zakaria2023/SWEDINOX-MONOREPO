"use client";

import { FormProvider } from "react-hook-form";
import { useMachineSubmit } from "@/app/(dashboard)/machines/use-machine-submit";
import type { MachineStockLocationOption } from "@/app/(dashboard)/warehouses/actions";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { GeneralSection } from "./sections/general-section";
import { DimensionsAndRemarksSection } from "./sections/dimensions-and-remarks-section";
import { AvailabilitySection } from "./sections/availability-section";
import { CapacitySection } from "./sections/capacity-section";
import { DocumentsSection } from "./sections/documents-section";

type Props = {
  stockLocations: MachineStockLocationOption[];
};

export const MachineForm = ({ stockLocations }: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    stockLocationOptions,
    optionOptions,
    productionOptions,
    loadingOptions,
    capacityUnitOptions,
    handleCancel,
  } = useMachineSubmit({ stockLocations });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        <GeneralSection
          optionOptions={optionOptions}
          productionOptions={productionOptions}
          loadingOptions={loadingOptions}
          stockLocationOptions={stockLocationOptions}
        />

        <DimensionsAndRemarksSection />

        <AvailabilitySection />

        <CapacitySection capacityUnitOptions={capacityUnitOptions} />

        <DocumentsSection />

        {state.error && <FormError>{state.error}</FormError>}

        <FormActions
          submitLabel="Save Machine"
          isPending={isPending}
          onCancel={handleCancel}
        />
      </form>
    </FormProvider>
  );
};
