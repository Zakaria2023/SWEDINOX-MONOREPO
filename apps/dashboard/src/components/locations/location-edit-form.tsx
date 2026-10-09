"use client";

import { useLocationEdit } from "@/app/(dashboard)/locations/use-location-edit";
import { LocationEditValues } from "@/app/(dashboard)/locations/validation";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { LocationStockGrid } from "@/components/locations/location-stock-grid";
import { pluralize } from "@/lib/helpers";
import type { StockLotOverviewRow } from "@/lib/server/stock-lot-overview";
import { FormProvider } from "react-hook-form";
import { CountSettingsSection } from "./sections/count-settings-section";
import { DocumentsSection } from "./sections/documents-section";
import { GeneralSection } from "./sections/general-section";
import { StatusSection } from "./sections/status-section";

type Props = {
  locationUuid: string;
  defaultValues: LocationEditValues;
  /** The lots standing here — our own and customers' together. */
  stock: StockLotOverviewRow[];
};

export const LocationEditForm = ({
  locationUuid,
  defaultValues,
  stock,
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
  } = useLocationEdit({ locationUuid, defaultValues });

  // `Voorraad` and `Klantvoorraad` on the reference's location screen (246):
  // a lot with an owner is a customer's, held here.
  const ownStock = stock.filter((row) => !row.ownerCompanyUuid);
  const customerStock = stock.filter((row) => Boolean(row.ownerCompanyUuid));

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

        <div className="space-y-2">
          <CollapsibleSection
            title="Stock"
            summary={`${ownStock.length} ${pluralize(ownStock.length, "lot")}`}
            defaultOpen
          >
            <LocationStockGrid
              rows={ownStock}
              emptyText="No stock on this location."
            />
          </CollapsibleSection>
          <CollapsibleSection
            title="Customer stock"
            summary={`${customerStock.length} ${pluralize(customerStock.length, "lot")}`}
          >
            <LocationStockGrid
              rows={customerStock}
              showOwner
              emptyText="No customer stock on this location."
            />
          </CollapsibleSection>
        </div>

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
