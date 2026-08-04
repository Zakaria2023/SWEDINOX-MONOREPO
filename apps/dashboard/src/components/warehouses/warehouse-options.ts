import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import {
  WarehouseLocationOption,
  WarehouseOption,
} from "@/app/(dashboard)/warehouses/actions";
import { SelectOption } from "@/components/shadcn/select";
import {
  countWorkorderMethods,
  printerEntries,
  printerNames,
  stickerPerPickWorkorderTypes,
  warehouseAddresses,
  warehouseBlockReasons,
  warehouseLoadingLocations,
  warehouseLocationTypes,
  workorderPrintMethods,
  workorderProcessingMethods,
  workorderReleaseMethods,
  workorderSlipTypes,
} from "@/lib/enums";
import {
  COUNT_WORKORDER_METHOD_LABELS,
  PRINTER_ENTRY_LABELS,
  PRINTER_NAME_LABELS,
  STICKER_PER_PICK_WORKORDER_LABELS,
  WAREHOUSE_ADDRESS_LABELS,
  WAREHOUSE_BLOCK_REASON_LABELS,
  WAREHOUSE_LOADING_LOCATION_LABELS,
  WAREHOUSE_LOCATION_TYPE_LABELS,
  WORKORDER_PRINT_METHOD_LABELS,
  WORKORDER_PROCESSING_METHOD_LABELS,
  WORKORDER_RELEASE_METHOD_LABELS,
  WORKORDER_SLIP_TYPE_LABELS,
} from "@/lib/labels";

type WarehouseOptionSources = {
  companies?: CompanyOption[];
  warehouseLocations?: WarehouseLocationOption[];
  existingWarehouses?: WarehouseOption[];
};

export type WarehouseOptions = {
  locationTypeOptions: SelectOption[];
  loadingLocationOptions: SelectOption[];
  addressOptions: SelectOption[];
  blockReasonOptions: SelectOption[];
  adaptFromOptions: SelectOption[];
  countMethodOptions: SelectOption[];
  releaseMethodOptions: SelectOption[];
  printMethodOptions: SelectOption[];
  processingMethodOptions: SelectOption[];
  workorderSlipOptions: SelectOption[];
  companyOptions: SelectOption[];
  warehouseLocationOptions: SelectOption[];
  printerNameOptions: SelectOption[];
  printerEntryOptions: SelectOption[];
  stickerPerPickOptions: SelectOption[];
};

const emptyOption: SelectOption = { value: "", label: "Empty" };

const fromEnum = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
): SelectOption[] => [
  emptyOption,
  ...values.map((value) => ({ value, label: labels[value] })),
];

/**
 * Every dropdown a warehouse form shows.
 *
 * The create form and each edit section both read from here, so a label or a
 * newly allowed value only has to be right in one place.
 */
export const buildWarehouseOptions = ({
  companies = [],
  warehouseLocations = [],
  existingWarehouses = [],
}: WarehouseOptionSources = {}): WarehouseOptions => ({
  locationTypeOptions: fromEnum(
    warehouseLocationTypes,
    WAREHOUSE_LOCATION_TYPE_LABELS,
  ),
  loadingLocationOptions: fromEnum(
    warehouseLoadingLocations,
    WAREHOUSE_LOADING_LOCATION_LABELS,
  ),
  addressOptions: fromEnum(warehouseAddresses, WAREHOUSE_ADDRESS_LABELS),
  blockReasonOptions: fromEnum(
    warehouseBlockReasons,
    WAREHOUSE_BLOCK_REASON_LABELS,
  ),
  adaptFromOptions: [
    emptyOption,
    ...existingWarehouses.map((warehouse) => ({
      value: warehouse.uuid,
      label: warehouse.name,
    })),
  ],
  countMethodOptions: fromEnum(
    countWorkorderMethods,
    COUNT_WORKORDER_METHOD_LABELS,
  ),
  releaseMethodOptions: fromEnum(
    workorderReleaseMethods,
    WORKORDER_RELEASE_METHOD_LABELS,
  ),
  printMethodOptions: fromEnum(
    workorderPrintMethods,
    WORKORDER_PRINT_METHOD_LABELS,
  ),
  processingMethodOptions: fromEnum(
    workorderProcessingMethods,
    WORKORDER_PROCESSING_METHOD_LABELS,
  ),
  workorderSlipOptions: fromEnum(workorderSlipTypes, WORKORDER_SLIP_TYPE_LABELS),
  companyOptions: [
    emptyOption,
    ...companies.map((company) => ({
      value: company.uuid,
      label: company.companyName ?? company.searchCode1 ?? company.uuid,
    })),
  ],
  warehouseLocationOptions: [
    emptyOption,
    ...warehouseLocations.map((location) => ({
      value: location.uuid,
      label: location.name,
    })),
  ],
  printerNameOptions: fromEnum(printerNames, PRINTER_NAME_LABELS),
  printerEntryOptions: fromEnum(printerEntries, PRINTER_ENTRY_LABELS),
  stickerPerPickOptions: fromEnum(
    stickerPerPickWorkorderTypes,
    STICKER_PER_PICK_WORKORDER_LABELS,
  ),
});
