"use client";

import { FormProvider } from "react-hook-form";
import { useLocationSubmit } from "@/app/(dashboard)/locations/use-location-submit";
import { WarehouseItemOption } from "@/app/(dashboard)/warehouses/actions";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { AdaptFromSection } from "./sections/adapt-from-section";
import { CountSettingsSection } from "./sections/count-settings-section";
import { DocumentsSection } from "./sections/documents-section";
import { GeneralSection } from "./sections/general-section";
import { StatusSection } from "./sections/status-section";

type Props = {
  allItems: WarehouseItemOption[];
};

export const LocationForm = ({ allItems }: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    blocked,
    isNextDisabled,
    adaptFromOptions,
    locationTypeOptions,
    loadingLocationOptions,
    blockReasonOptions,
    handleAdaptFrom,
    handleCancel,
  } = useLocationSubmit({ allItems });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        {state.error && <FormError>{state.error}</FormError>}

        <AdaptFromSection
          adaptFromOptions={adaptFromOptions}
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

        <CountSettingsSection />

        <DocumentsSection />

        <FormActions
          submitLabel="Save Location"
          isPending={isPending}
          onCancel={handleCancel}
        />
      </form>
    </FormProvider>
  );
};
