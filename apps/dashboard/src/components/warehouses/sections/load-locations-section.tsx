"use client";

import { Select } from "@/components/shadcn/select";
import {
  warehouseTransportRegions,
  warehouseLoadingLocations,
  WarehouseTransportRegion,
  WarehouseLoadingLocation,
} from "@/lib/enums";
import {
  WAREHOUSE_TRANSPORT_REGION_CODES,
  WAREHOUSE_TRANSPORT_REGION_LABELS,
  WAREHOUSE_LOADING_LOCATION_LABELS,
  COMMON_TEXT,
} from "@/lib/labels";
import { useFormContext, useFieldArray } from "react-hook-form";
import { WarehouseFormValues } from "@/app/(dashboard)/warehouses/validation";

const transportRegionOptions = warehouseTransportRegions.map((r) => ({
  value: r,
  label: WAREHOUSE_TRANSPORT_REGION_CODES[r as WarehouseTransportRegion],
  description: WAREHOUSE_TRANSPORT_REGION_LABELS[r as WarehouseTransportRegion],
}));

const loadLocationOptions = [
  { value: "", label: COMMON_TEXT.emptyOption },
  ...warehouseLoadingLocations.map((l) => ({
    value: l,
    label: WAREHOUSE_LOADING_LOCATION_LABELS[l as WarehouseLoadingLocation],
  })),
];

export const LoadLocationsSection = () => {
  const { control, watch, setValue } = useFormContext<WarehouseFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "loadLocations",
  });

  const loadLocations = watch("loadLocations");

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Load Locations
      </h2>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                Transport Region
              </th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                Load Location
              </th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {fields.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  No load locations added.
                </td>
              </tr>
            )}
            {fields.map((field, index) => (
              <tr key={field.id} className="border-b last:border-0">
                <td className="px-4 py-2">
                  <Select
                    id={`loadLocations.${index}.transportRegion`}
                    name={`loadLocations.${index}.transportRegion`}
                    options={transportRegionOptions}
                    columnHeaders={{ left: "Code", right: "Description" }}
                    value={loadLocations[index]?.transportRegion ?? ""}
                    onValueChange={(val) =>
                      setValue(
                        `loadLocations.${index}.transportRegion`,
                        val as WarehouseTransportRegion,
                      )
                    }
                  />
                </td>
                <td className="px-4 py-2">
                  <Select
                    id={`loadLocations.${index}.loadLocation`}
                    name={`loadLocations.${index}.loadLocation`}
                    options={loadLocationOptions}
                    value={loadLocations[index]?.loadLocation ?? ""}
                    onValueChange={(val) =>
                      setValue(
                        `loadLocations.${index}.loadLocation`,
                        val as WarehouseLoadingLocation,
                      )
                    }
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove row"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={() =>
          append({
            transportRegion: warehouseTransportRegions[0],
            loadLocation: "",
          })
        }
        className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
      >
        + Add Load Location
      </button>
    </section>
  );
};
