"use client";

import { useWarehouseSubSectionEdit } from "@/app/(dashboard)/warehouse-sub-sections/use-warehouse-sub-section-edit";
import { WarehouseSubSectionEditValues } from "@/app/(dashboard)/warehouse-sub-sections/validation";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormProvider } from "react-hook-form";
import { GeneralSection } from "./sections/general-section";
import { StatusSection } from "./sections/status-section";

type Props = {
  subSectionUuid: string;
  defaultValues: WarehouseSubSectionEditValues;
};

export const WarehouseSubSectionEditForm = ({
  subSectionUuid,
  defaultValues,
}: Props) => {
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
  } = useWarehouseSubSectionEdit({ subSectionUuid, defaultValues });

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

        <FormActions
          submitLabel="Save Sub Section"
          isPending={isPending}
          onCancel={handleCancel}
        />
      </form>
    </FormProvider>
  );
};
