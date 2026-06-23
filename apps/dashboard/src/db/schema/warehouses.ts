import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  countWorkorderMethods,
  printerEntries,
  printerNames,
  stickerPerPickWorkorderTypes,
  warehouseAddresses,
  warehouseBlockReasons,
  warehouseLoadingLocations,
  warehouseLocationTypes,
  warehouseTypes,
  workorderPrintMethods,
  workorderProcessingMethods,
  workorderReleaseMethods,
  workorderSlipTypes,
} from "../../lib/enums";
import { Companies } from "./companies";

export const Warehouses = mysqlTable(
  "Warehouses",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    parentUuid: char("parent_uuid", { length: 36 }),
    type: mysqlEnum("type", warehouseTypes).notNull().default("warehouse"),
    name: varchar("name", { length: 255 }).notNull(),
    locationType: mysqlEnum("location_type", warehouseLocationTypes),
    loadingLocation: mysqlEnum("loading_location", warehouseLoadingLocations),
    // Only populated for root-level rows (parentUuid IS NULL)
    address: mysqlEnum("address", warehouseAddresses),
    blocked: boolean("blocked").notNull().default(false),
    blockReason: mysqlEnum("block_reason", warehouseBlockReasons),
    blockedForOptimization: boolean("blocked_for_optimization")
      .notNull()
      .default(false),
    limitedDimensions: boolean("limited_dimensions").notNull().default(false),
    minLength: int("min_length"),
    maxLength: int("max_length"),
    maxWidth: int("max_width"),
    maxWeight: int("max_weight"),
    productTypes: json("product_types").$type<string[]>(),
    loadLocations: json("load_locations").$type<
      Array<{ transportRegion: string; loadLocation?: string }>
    >(),
    documents: json("documents").$type<Array<{ id: string; fileName: string }>>(),
    // Only populated for non-root rows (parentUuid IS NOT NULL)
    pickingSequence: int("picking_sequence"),

    // Count workorders
    countMethod: mysqlEnum("count_method", countWorkorderMethods),
    countMaxLinesPerCommand: int("count_max_lines_per_command"),
    countReleaseMethod: mysqlEnum("count_release_method", workorderReleaseMethods),
    countPrintMethod: mysqlEnum("count_print_method", workorderPrintMethods),
    countPrintStockOnSlip: boolean("count_print_stock_on_slip").notNull().default(false),

    // Miscellaneous
    makeWorkordersPerSubsection: boolean("make_workorders_per_subsection").notNull().default(false),
    orderEntryDeadlineForInternal: varchar("order_entry_deadline_for_internal", { length: 5 }),
    capacityPerResource: boolean("capacity_per_resource").notNull().default(false),
    sortLinesByWidthProductCodeLength: boolean("sort_lines_by_width_product_code_length").notNull().default(false),
    printAllLocationsOnSlip: boolean("print_all_locations_on_slip").notNull().default(false),
    workorderSlip: mysqlEnum("workorder_slip", workorderSlipTypes),
    addSectionToCsvFileName: boolean("add_section_to_csv_file_name").notNull().default(false),
    addSubsectionToCsvFileName: boolean("add_subsection_to_csv_file_name").notNull().default(false),
    addProductTypeToCsvFileName: boolean("add_product_type_to_csv_file_name").notNull().default(false),
    callOffLocation: varchar("call_off_location", { length: 255 }),
    transportByCompanyUuid: char("transport_by_company_uuid", { length: 36 }),

    // Picking workorders
    pickingProcessingMethod: mysqlEnum("picking_processing_method", workorderProcessingMethods),
    pickingReleaseMethod: mysqlEnum("picking_release_method", workorderReleaseMethods),
    pickingPrintingMethod: mysqlEnum("picking_printing_method", workorderPrintMethods),
    packagingMandatoryOnCompletion: boolean("packaging_mandatory_on_completion").notNull().default(false),
    packagingDialogueOnCompletion: boolean("packaging_dialogue_on_completion").notNull().default(false),

    // Fetch workorders for Surface Treatment
    surfaceTreatmentMakePerSubsection: boolean("surface_treatment_make_per_subsection").notNull().default(false),
    surfaceTreatmentProcessingMethod: mysqlEnum("surface_treatment_processing_method", workorderProcessingMethods),
    surfaceTreatmentReleaseMethod: mysqlEnum("surface_treatment_release_method", workorderReleaseMethods),
    surfaceTreatmentPrintingMethod: mysqlEnum("surface_treatment_printing_method", workorderPrintMethods),

    // Fetch workorders for Sawing
    sawingMakePerSubsection: boolean("sawing_make_per_subsection").notNull().default(false),
    sawingProcessingMethod: mysqlEnum("sawing_processing_method", workorderProcessingMethods),
    sawingReleaseMethod: mysqlEnum("sawing_release_method", workorderReleaseMethods),
    sawingPrintingMethod: mysqlEnum("sawing_printing_method", workorderPrintMethods),

    // Pick-up workorders
    pickupDefaultLocationUuid: char("pickup_default_location_uuid", { length: 36 }),
    pickupSlipPrinter: mysqlEnum("pickup_slip_printer", printerNames),
    pickupSlipPrinterEntry: mysqlEnum("pickup_slip_printer_entry", printerEntries),
    pickupOrderPrinter: mysqlEnum("pickup_order_printer", printerNames),
    pickupOrderPrinterEntry: mysqlEnum("pickup_order_printer_entry", printerEntries),

    // Print settings — A4 Printers
    a4PrinterOriginal: mysqlEnum("a4_printer_original", printerNames),
    a4PrinterCopy1: mysqlEnum("a4_printer_copy1", printerNames),
    a4PrinterCopy2: mysqlEnum("a4_printer_copy2", printerNames),

    // Print settings — A4 Printers small material
    a4SmallMaterialThresholdMm: int("a4_small_material_threshold_mm"),
    a4SmallPrinterOriginal: mysqlEnum("a4_small_printer_original", printerNames),
    a4SmallPrinterCopy1: mysqlEnum("a4_small_printer_copy1", printerNames),
    a4SmallPrinterCopy2: mysqlEnum("a4_small_printer_copy2", printerNames),

    // Print settings — sticker per pick
    stickerPerPickWorkorder: mysqlEnum("sticker_per_pick_workorder", stickerPerPickWorkorderTypes),

    // Print settings — other printers
    labelPrinter: mysqlEnum("label_printer", printerNames),
    stickerPrinter: mysqlEnum("sticker_printer", printerNames),

    // Print settings — CSV files for customer labels
    csvCustomerLabelFileName: varchar("csv_customer_label_file_name", { length: 255 }),
    csvCustomerLabelAddSection: boolean("csv_customer_label_add_section").notNull().default(false),
    csvCustomerLabelAddSubsection: boolean("csv_customer_label_add_subsection").notNull().default(false),
    csvCustomerLabelAddProductType: boolean("csv_customer_label_add_product_type").notNull().default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_warehouses_parent_uuid").on(table.parentUuid),
    index("idx_warehouses_transport_by_company_uuid").on(table.transportByCompanyUuid),
    index("idx_warehouses_pickup_default_location_uuid").on(table.pickupDefaultLocationUuid),
    foreignKey({
      name: "fk_warehouses_parent",
      columns: [table.parentUuid],
      foreignColumns: [table.uuid],
    }),
    foreignKey({
      name: "fk_warehouses_transport_by_company",
      columns: [table.transportByCompanyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_warehouses_pickup_default_location",
      columns: [table.pickupDefaultLocationUuid],
      foreignColumns: [table.uuid],
    }),
  ],
);

export type SelectWarehouses = InferSelectModel<typeof Warehouses>;
export type InsertWarehouses = InferInsertModel<typeof Warehouses>;
