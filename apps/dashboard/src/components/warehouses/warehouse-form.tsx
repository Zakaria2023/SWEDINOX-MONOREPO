"use client";

import { useWarehouseSubmit } from "@/app/(dashboard)/warehouses/use-warehouse-submit";
import { WarehouseOption, WarehouseLocationOption } from "@/app/(dashboard)/warehouses/actions";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormProvider } from "react-hook-form";
import { AdaptFromSection } from "./sections/adapt-from-section";
import { GeneralSection } from "./sections/general-section";
import { StatusSection } from "./sections/status-section";
import { LoadLocationsSection } from "./sections/load-locations-section";
import { CountWorkordersSection } from "./sections/count-workorders-section";
import { MiscellaneousSection } from "./sections/miscellaneous-section";
import { PickingWorkordersSection } from "./sections/picking-workorders-section";
import { FetchWorkordersSurfaceTreatmentSection } from "./sections/fetch-workorders-surface-treatment-section";
import { FetchWorkordersSawingSection } from "./sections/fetch-workorders-sawing-section";
import { PrintSettingsSection } from "./sections/print-settings-section";
import { PickupWorkordersSection } from "./sections/pickup-workorders-section";
import { DocumentsSection } from "./sections/documents-section";

type Props = {
  existingWarehouses: WarehouseOption[];
  companies: CompanyOption[];
  warehouseLocations: WarehouseLocationOption[];
};

export const WarehouseForm = ({
  existingWarehouses,
  companies,
  warehouseLocations,
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
    addressOptions,
    adaptFromOptions,
    adaptFromValue,
    handleAdaptFrom,
    handleCancel,
    countMethodOptions,
    releaseMethodOptions,
    printMethodOptions,
    workorderSlipOptions,
    processingMethodOptions,
    companyOptions,
    warehouseLocationOptions,
    printerNameOptions,
    printerEntryOptions,
    stickerPerPickOptions,
  } = useWarehouseSubmit({ existingWarehouses, companies, warehouseLocations });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        {state.error && <FormError>{state.error}</FormError>}

        <AdaptFromSection
          adaptFromOptions={adaptFromOptions}
          adaptFromValue={adaptFromValue}
          handleAdaptFrom={handleAdaptFrom}
        />

        <GeneralSection
          locationTypeOptions={locationTypeOptions}
          loadingLocationOptions={loadingLocationOptions}
          addressOptions={addressOptions}
        />

        <StatusSection
          blocked={blocked}
          blockReasonOptions={blockReasonOptions}
        />

        <LoadLocationsSection />

        <CountWorkordersSection
          countMethodOptions={countMethodOptions}
          releaseMethodOptions={releaseMethodOptions}
          printMethodOptions={printMethodOptions}
        />

        <MiscellaneousSection
          workorderSlipOptions={workorderSlipOptions}
          companyOptions={companyOptions}
        />

        <PickingWorkordersSection
          processingMethodOptions={processingMethodOptions}
          releaseMethodOptions={releaseMethodOptions}
          printMethodOptions={printMethodOptions}
        />

        <FetchWorkordersSurfaceTreatmentSection
          processingMethodOptions={processingMethodOptions}
          releaseMethodOptions={releaseMethodOptions}
          printMethodOptions={printMethodOptions}
        />

        <FetchWorkordersSawingSection
          processingMethodOptions={processingMethodOptions}
          releaseMethodOptions={releaseMethodOptions}
          printMethodOptions={printMethodOptions}
        />

        <PrintSettingsSection
          printerNameOptions={printerNameOptions}
          stickerPerPickOptions={stickerPerPickOptions}
        />

        <PickupWorkordersSection
          warehouseLocationOptions={warehouseLocationOptions}
          printerNameOptions={printerNameOptions}
          printerEntryOptions={printerEntryOptions}
        />

        <DocumentsSection />

        <FormActions
          submitLabel="Save Warehouse"
          isPending={isPending}
          onCancel={handleCancel}
        />
      </form>
    </FormProvider>
  );
};
