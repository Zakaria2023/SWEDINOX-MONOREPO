"use client";

import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { useFormContext } from "react-hook-form";
import { WarehouseFormValues } from "@/app/(dashboard)/warehouses/validation";

type Props = {
  workorderSlipOptions: { value: string; label: string }[];
  companyOptions: { value: string; label: string }[];
};

export const MiscellaneousSection = ({
  workorderSlipOptions,
  companyOptions,
}: Props) => {
  const { register, control, watch, setValue } =
    useFormContext<WarehouseFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Miscellaneous
      </h2>
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="makeWorkordersPerSubsection"
            checked={watch("makeWorkordersPerSubsection")}
            onChange={(e) =>
              setValue("makeWorkordersPerSubsection", e.target.checked)
            }
          />
          <span className="text-sm font-medium">
            Make workorders per subsection
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="capacityPerResource"
            checked={watch("capacityPerResource")}
            onChange={(e) =>
              setValue("capacityPerResource", e.target.checked)
            }
          />
          <span className="text-sm font-medium">Capacity per resource</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="sortLinesByWidthProductCodeLength"
            checked={watch("sortLinesByWidthProductCodeLength")}
            onChange={(e) =>
              setValue("sortLinesByWidthProductCodeLength", e.target.checked)
            }
          />
          <span className="text-sm font-medium">
            Sort lines on pick- and fetch workorders by width (descending),
            product code (ascending), length (descending)
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="printAllLocationsOnSlip"
            checked={watch("printAllLocationsOnSlip")}
            onChange={(e) =>
              setValue("printAllLocationsOnSlip", e.target.checked)
            }
          />
          <span className="text-sm font-medium">
            Print all locations where product stock is located on the
            unloading and picking workorder slip
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="addSectionToCsvFileName"
            checked={watch("addSectionToCsvFileName")}
            onChange={(e) =>
              setValue("addSectionToCsvFileName", e.target.checked)
            }
          />
          <span className="text-sm font-medium">
            Add section to CSV file name
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="addSubsectionToCsvFileName"
            checked={watch("addSubsectionToCsvFileName")}
            onChange={(e) =>
              setValue("addSubsectionToCsvFileName", e.target.checked)
            }
          />
          <span className="text-sm font-medium">
            Add subsection to CSV file name
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="addProductTypeToCsvFileName"
            checked={watch("addProductTypeToCsvFileName")}
            onChange={(e) =>
              setValue("addProductTypeToCsvFileName", e.target.checked)
            }
          />
          <span className="text-sm font-medium">
            Add product type to CSV file name
          </span>
        </label>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FormLabel htmlFor="orderEntryDeadlineForInternal">
            Order Entry Deadline for Internal
          </FormLabel>
          <Input
            id="orderEntryDeadlineForInternal"
            placeholder="00:00"
            maxLength={5}
            {...register("orderEntryDeadlineForInternal")}
          />
        </div>
        <FormSelectField
          id="workorderSlip"
          name="workorderSlip"
          control={control}
          label="Workorder Slip"
          options={workorderSlipOptions}
          emptyValue=""
        />
        <div>
          <FormLabel htmlFor="callOffLocation">Call-off Location</FormLabel>
          <Input
            id="callOffLocation"
            {...register("callOffLocation")}
          />
        </div>
        <FormSelectField
          id="transportByCompanyUuid"
          name="transportByCompanyUuid"
          control={control}
          label="Transport By"
          options={companyOptions}
          emptyValue=""
        />
      </div>
    </section>
  );
};
