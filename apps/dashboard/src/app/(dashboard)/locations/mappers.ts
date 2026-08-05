import { SelectWarehouses } from "@/db";
import {
  WarehouseBlockReason,
  WarehouseCountStockType,
  WarehouseLoadingLocation,
  WarehouseLocationType,
  WarehouseProductType,
} from "@/lib/enums";
import { LocationEditFields } from "./actions";
import { LocationEditValues } from "./validation";

export const locationToEditValues = (
  location: SelectWarehouses,
): LocationEditValues => ({
  name: location.name,
  locationType: location.locationType ?? "",
  loadingLocation: location.loadingLocation ?? "",
  blocked: location.blocked ?? false,
  blockReason: location.blockReason ?? "",
  blockedForOptimization: location.blockedForOptimization ?? false,
  limitedDimensions: location.limitedDimensions ?? false,
  minLength: location.minLength ?? "",
  maxLength: location.maxLength ?? "",
  maxWidth: location.maxWidth ?? "",
  maxWeight: location.maxWeight ?? "",
  productTypes: (location.productTypes ?? []) as WarehouseProductType[],
  pickingSequence: location.pickingSequence ?? "",
  countPer: location.countPer ?? "",
  countAs: (location.countAs ?? "technical_stock") as WarehouseCountStockType,
  countUnderValue: location.countUnderValue ?? "",
  countUnderUnit: location.countUnderUnit ?? "",
  openCountOrderAvailable: location.openCountOrderAvailable ?? false,
  documents: location.documents ?? [],
});

// On an update an emptied field has to reach the column as NULL. `undefined`
// would leave the old value in place, so clearing an input would silently do
// nothing.
const numberOrNull = (value: number | "" | undefined): number | null =>
  value === "" || value === undefined ? null : Number(value);

export const editValuesToLocationFields = (
  values: LocationEditValues,
): LocationEditFields => ({
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
  countPer: numberOrNull(values.countPer),
  countAs: values.countAs,
  countUnderValue: numberOrNull(values.countUnderValue),
  countUnderUnit: values.countUnderUnit || null,
  openCountOrderAvailable: values.openCountOrderAvailable,
  documents: values.documents,
});
