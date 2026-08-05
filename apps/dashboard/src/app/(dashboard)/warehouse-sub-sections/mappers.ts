import { SelectWarehouses } from "@/db";
import {
  WarehouseBlockReason,
  WarehouseLoadingLocation,
  WarehouseLocationType,
  WarehouseProductType,
} from "@/lib/enums";
import { WarehouseSubSectionEditFields } from "./actions";
import { WarehouseSubSectionEditValues } from "./validation";

export const subSectionToEditValues = (
  subSection: SelectWarehouses,
): WarehouseSubSectionEditValues => ({
  name: subSection.name,
  locationType: subSection.locationType ?? "",
  loadingLocation: subSection.loadingLocation ?? "",
  blocked: subSection.blocked ?? false,
  blockReason: subSection.blockReason ?? "",
  blockedForOptimization: subSection.blockedForOptimization ?? false,
  limitedDimensions: subSection.limitedDimensions ?? false,
  minLength: subSection.minLength ?? "",
  maxLength: subSection.maxLength ?? "",
  maxWidth: subSection.maxWidth ?? "",
  maxWeight: subSection.maxWeight ?? "",
  productTypes: (subSection.productTypes ?? []) as WarehouseProductType[],
  pickingSequence: subSection.pickingSequence ?? "",
});

// On an update an emptied field has to reach the column as NULL. `undefined`
// would leave the old value in place, so clearing an input would silently do
// nothing.
const numberOrNull = (value: number | "" | undefined): number | null =>
  value === "" || value === undefined ? null : Number(value);

export const editValuesToSubSectionFields = (
  values: WarehouseSubSectionEditValues,
): WarehouseSubSectionEditFields => ({
  name: values.name,
  locationType: (values.locationType || null) as WarehouseLocationType | null,
  loadingLocation: (values.loadingLocation ||
    null) as WarehouseLoadingLocation | null,
  blocked: values.blocked,
  // A reason for a block that no longer exists would keep showing up in
  // reports, so it is dropped along with the block itself.
  blockReason: (values.blocked
    ? values.blockReason || null
    : null) as WarehouseBlockReason | null,
  blockedForOptimization: values.blockedForOptimization,
  limitedDimensions: values.limitedDimensions,
  minLength: numberOrNull(values.minLength),
  maxLength: numberOrNull(values.maxLength),
  maxWidth: numberOrNull(values.maxWidth),
  maxWeight: numberOrNull(values.maxWeight),
  productTypes: values.productTypes,
  pickingSequence: numberOrNull(values.pickingSequence),
});
