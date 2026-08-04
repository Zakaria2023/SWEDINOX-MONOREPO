"use client";

import { useLocationEdit } from "@/app/(dashboard)/locations/use-location-edit";
import { LocationEditValues } from "@/app/(dashboard)/locations/validation";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormProvider } from "react-hook-form";
import { CountSettingsSection } from "./sections/count-settings-section";
import { DocumentsSection } from "./sections/documents-section";
import { GeneralSection } from "./sections/general-section";
import { StatusSection } from "./sections/status-section";

type Props = {
  locationUuid: string;
  defaultValues: LocationEditValues;
};

export const LocationEditForm = ({ locationUuid, defaultValues }: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    blocked,
    locationTypeOptions,
    loadingLocationOptions,
    blockReasonOptions,
    handleCancel,
  } = useLocationEdit({ locationUuid, defaultValues });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        {state.error && <FormError>{state.error}</FormError>}

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
