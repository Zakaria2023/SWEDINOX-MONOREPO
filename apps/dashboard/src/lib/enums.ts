export const addressCategories = [
  "invoice",
  "visit",
  "correspondence",
  "delivery",
] as const satisfies readonly string[];

export type AddressCategory = (typeof addressCategories)[number];

export const availableAtOptions = [
  "crane_unloading",
  "forklift_unloading",
] as const satisfies readonly string[];

export type AvailableAt = (typeof availableAtOptions)[number];

export const companyLangs = [
  "dutch",
  "arabic",
  "english",
] as const satisfies readonly string[];

export type CompanyLang = (typeof companyLangs)[number];

export const companyRoles = [
  "customer",
  "prospect",
  "supplier",
  "processor",
  "transporter",
  "agent",
  "purchasing_org",
  "other",
  "internal",
] as const satisfies readonly string[];

export type CompanyRole = (typeof companyRoles)[number];

export const contractableRoles = [
  "customer",
  "prospect",
  "supplier",
  "processor",
] as const satisfies readonly string[];

export type ContractableRole = (typeof contractableRoles)[number];

export const contractTypes = [
  "gross_prices",
  "options",
  "net_prices",
  "cost_price",
  "surcharges",
  "allowances",
] as const satisfies readonly string[];

export type ContractType = (typeof contractTypes)[number];

export const communicationSettingDocumentTypes = [
  "order_status_message",
  "bill_of_lading",
  "order_confirmation",
  "quote",
  "purchase_request",
  "purchase_return",
  "purchase_order",
  "consignment_consumption_confirmation",
  "call_off_confirmation",
  "return_order_confirmation",
  "pro_forma_invoice",
  "certificate_email",
  "invoice",
  "price_catalogue",
  "eta",
  "eta_delayed",
  "checklist",
] as const satisfies readonly string[];

export type CommunicationSettingDocumentType =
  (typeof communicationSettingDocumentTypes)[number];

export const communicationSettingTypes = [
  "email",
  "fax",
  "printing",
  "edi_ftp",
  "edi_http",
  "edi_https",
] as const satisfies readonly string[];

export type CommunicationSettingType =
  (typeof communicationSettingTypes)[number];

export const contractTierUnits = [
  "TN",
  "Euro",
] as const satisfies readonly string[];
export type ContractTierUnit = (typeof contractTierUnits)[number];

export const contractSurchargePerTypes = [
  "order_line",
  "group_product",
  "product_group",
] as const satisfies readonly string[];
export type ContractSurchargePerType =
  (typeof contractSurchargePerTypes)[number];

export const contractDiscountBasedOnTypes = [
  "group_product",
  "product_group",
] as const satisfies readonly string[];
export type ContractDiscountBasedOnType =
  (typeof contractDiscountBasedOnTypes)[number];

export const visitReportContactMethods = [
  "visit",
  "telephone_contact",
] as const satisfies readonly string[];

export type VisitReportContactMethod =
  (typeof visitReportContactMethods)[number];

export const visitReportReasons = [
  "visit_frequency",
  "turnover_is_lagging_behind",
  "complaint",
  "quotation_follow_up",
  "at_customers_request",
  "introduction",
] as const satisfies readonly string[];

export type VisitReportReason = (typeof visitReportReasons)[number];

export const communicationSettingShapes = [
  "pdf",
  "scsn",
  "sales_in_the_construction",
  "edi4steel",
  "text",
  "peppol",
] as const satisfies readonly string[];

export type CommunicationSettingShape =
  (typeof communicationSettingShapes)[number];

export const salesRepresentatives = [
  "arian_bloks",
  "bnl",
  "cherice_van_rooyen",
  "export",
  "guy_mambourg",
  "hego",
] as const satisfies readonly string[];

export type SalesRepresentative = (typeof salesRepresentatives)[number];

export const devTheorWtOptions = [
  "theoretical_weight",
  "trade_weight",
  "german_trade_weight",
  "weighed",
] as const satisfies readonly string[];

export type DevTheorWt = (typeof devTheorWtOptions)[number];

export const groupLinesByDescriptionOptions = [
  "order_of_order_lines",
  "alphabetical_order",
  "lowest_order_line",
  "print_group_titles",
] as const satisfies readonly string[];

export type GroupLinesByDescription =
  (typeof groupLinesByDescriptionOptions)[number];

export const printProductCodesOptions = [
  "do_not_print",
  "print_easy2trade",
  "print_company",
] as const satisfies readonly string[];

export type PrintProductCodes = (typeof printProductCodesOptions)[number];

export const miscellaneousOptions = [
  "occasional_customer",
  "customer_has_login_code",
  "bill_of_ladings_per_order",
  "print_waybills",
  "consignment_customer",
  "neutral_labels",
  "label_per_sawed_piece",
] as const satisfies readonly string[];

export type MiscellaneousOption = (typeof miscellaneousOptions)[number];

export const quoteOrderOptions = [
  "reference_required",
  "complete_delivery",
  "round_weight_per_piece_up",
  "certificate",
  "overlength",
  "default_pickup",
] as const satisfies readonly string[];

export type QuoteOrderOption = (typeof quoteOrderOptions)[number];

export const quoteOrderInvoiceOptions = [
  "do_not_print_prices",
  "total_amount_per_line",
  "condensing_options",
  "include_option_prices_in_material_prices",
] as const satisfies readonly string[];

export type QuoteOrderInvoiceOption = (typeof quoteOrderInvoiceOptions)[number];

export const orderOptions = [
  "net_prices_only",
  "scrap_surcharge_separately",
  "no_commercial_blocking",
  "no_financial_blockage",
  "call_off_quantities_on_call_off_confirmation",
  "backorders_on_order_confirmation",
] as const satisfies readonly string[];

export type OrderOption = (typeof orderOptions)[number];

export const quoteOptions = [
  "net_prices_only",
  "scrap_surcharge_separate",
  "no_commercial_blocking",
  "no_financial_blockage",
  "dont_show_at_all",
] as const satisfies readonly string[];

export type QuoteOption = (typeof quoteOptions)[number];

export const ediOptions = [
  "product_features",
  "send_pdf",
] as const satisfies readonly string[];

export type EdiOption = (typeof ediOptions)[number];

export const contactSalutations = [
  "mr",
  "mrs",
] as const satisfies readonly string[];

export type ContactSalutation = (typeof contactSalutations)[number];

export const contactCategories = [
  "procurement",
  "sales",
  "warehouse",
  "management",
  "bookkeeping",
  "certificates",
] as const satisfies readonly string[];

export type ContactCategory = (typeof contactCategories)[number];

export const warehouseTypes = [
  "warehouse",
  "location",
] as const satisfies readonly string[];

export type WarehouseType = (typeof warehouseTypes)[number];

export const warehouseAddresses = [
  "hego_almere",
  "port_of_rotterdam",
  "port_of_antwerp",
] as const satisfies readonly string[];

export type WarehouseAddress = (typeof warehouseAddresses)[number];

export const warehouseLocationTypes = [
  "pick",
  "bulk",
  "production",
  "scrap",
  "load",
  "inspection",
  "put_away",
  "sorting",
  "processing",
  "collection",
  "call_off",
] as const satisfies readonly string[];

export type WarehouseLocationType = (typeof warehouseLocationTypes)[number];

export const warehouseLoadingLocations = [
  "load",
] as const satisfies readonly string[];

export type WarehouseLoadingLocation =
  (typeof warehouseLoadingLocations)[number];

export const warehouseCountStockTypes = [
  "technical_stock",
  "available_stock",
] as const satisfies readonly string[];

export type WarehouseCountStockType = (typeof warehouseCountStockTypes)[number];

export const warehouseBlockReasons = [
  "disapproval",
  "reserved_for_customer",
  "other",
  "consignment",
  "location_type_setting",
] as const satisfies readonly string[];

export type WarehouseBlockReason = (typeof warehouseBlockReasons)[number];

export const warehouseProductTypes = [
  "beam",
  "tube",
  "sheet",
  "profile",
  "bar",
] as const satisfies readonly string[];

export type WarehouseProductType = (typeof warehouseProductTypes)[number];

export const warehouseTransportRegions = [
  "azie",
  "bal",
  "bel",
  "dui",
  "eng",
  "fra",
  "ita",
  "lux",
  "ned",
  "oe",
  "sp_po",
  "zd_am",
] as const satisfies readonly string[];

export const productShapes = [
  "bar_steel",
  "coil",
  "piece_article",
  "sheet",
  "tube",
  "beam_steel",
  "profile",
] as const satisfies readonly string[];

export type ProductShape = (typeof productShapes)[number];

export const articleGroups = [
  "ck304",
  "ck316",
  "ck430",
  "ckm304",
  "pdiva",
  "pk304",
  "pta2_5",
  "pta3",
  "pta3_5",
  "pta5",
  "pw304",
  "pw316",
  "pw430",
] as const satisfies readonly string[];

export type ArticleGroup = (typeof articleGroups)[number];

export const purchasingUnits = [
  "HS",
  "ST",
] as const satisfies readonly string[];

export type PurchasingUnit = (typeof purchasingUnits)[number];

export const deliveryTimeUnits = [
  "months",
  "weeks",
  "working_days",
] as const satisfies readonly string[];

export type DeliveryTimeUnit = (typeof deliveryTimeUnits)[number];

export const revenueGroups = [
  "ss_304",
  "ss_316",
  "ss_321",
  "ss_430",
  "high_alloys",
  "aluminium",
  "steel",
  "roestvast_nl",
  "foil_consumption_and_sales",
  "sales_residual_material",
  "other_pallets_etc",
  "other_products",
  "decoiling",
  "grinding_foiling",
  "cutting",
  "lasering",
  "other_processing",
  "freight_costs",
  "freight_costs_external",
  "credit_notes_yet_to_be_received",
  "vat_credit_restriction_creditor",
  "price_differences",
  "other_allowances",
  "eu_import_duties",
  "revenue_asia_vs_eu_material",
  "import_costs",
] as const satisfies readonly string[];

export type RevenueGroup = (typeof revenueGroups)[number];

export const salesUnitOptions = [
  "HK",
  "HM",
  "HS",
  "KG",
  "M1",
  "M2",
  "MM",
  "ST",
  "TN",
] as const satisfies readonly string[];

export type SalesUnit = (typeof salesUnitOptions)[number];

export const vatCodes = [
  "vat_0",
  "vat_low_9",
  "vat_high_21",
  "vat_middle_12",
] as const satisfies readonly string[];

export type VatCode = (typeof vatCodes)[number];

export const certificaatOptions = [
  "en10204_2_1",
  "en10204_3_1",
] as const satisfies readonly string[];

export type CertificaatOption = (typeof certificaatOptions)[number];

export const stockModes = [
  "multiplier",
  "fixed_value",
] as const satisfies readonly string[];

export type StockMode = (typeof stockModes)[number];

export const leadTimeMethods = [
  "manually",
  "automatic_maximum",
  "automatic_average",
] as const satisfies readonly string[];

export type LeadTimeMethod = (typeof leadTimeMethods)[number];

export const stockLabelTypes = [
  "label",
  "sticker",
] as const satisfies readonly string[];

export type StockLabelType = (typeof stockLabelTypes)[number];

export const stockLabelPrintingOptions = [
  "per_line_bundle",
  "per_bundle",
  "amount_per_line",
] as const satisfies readonly string[];

export type StockLabelPrintingOption =
  (typeof stockLabelPrintingOptions)[number];

export const stockStatuses = [
  "pending",
  "received",
  "cancelled",
] as const satisfies readonly string[];

export type StockStatus = (typeof stockStatuses)[number];

export const stockMovementTypes = [
  "in",
  "out",
] as const satisfies readonly string[];

export type StockMovementType = (typeof stockMovementTypes)[number];

export const stockMovementReasons = [
  "purchase_receipt",
  "invoice_consumption",
  "purchase_order_cancelled",
  "invoice_cancelled",
  "sale_consumption",
  "sale_invoice_cancelled",
  "manual_correction",
  "count_correction",
  "damaged",
  "production_output",
  // Goods a customer sent back, booked into stock when the return is received.
  "sales_return",
] as const satisfies readonly string[];

export type StockMovementReason = (typeof stockMovementReasons)[number];

// The subset of stockMovementReasons a staff member can pick when manually
// correcting stock — the others are only ever written by the system itself.
export const stockCorrectionReasons = [
  "manual_correction",
  "count_correction",
  "damaged",
] as const satisfies readonly string[];

export type StockCorrectionReason = (typeof stockCorrectionReasons)[number];

// Stock unit ("StkU") a stock lot is counted in — kg for coil/plate, pieces
// for cut items, running/square/cubic metres for profiles.
export const stockUnits = [
  "kg",
  "st",
  "m1",
  "m2",
  "m3",
  "mm",
] as const satisfies readonly string[];

export type StockUnit = (typeof stockUnits)[number];

// How a counterparty counts in the steel federation (SFN) goods-flow return:
// a mill that makes the material, a fellow federation member, or anyone else.
// Combined with whether the counterparty sits at home or abroad, this decides
// which column of the "Freight flow (SFN)" report a movement lands in.
export const sfnCounterpartyRoles = [
  "producer",
  "sfn_member",
  "non_member",
] as const satisfies readonly string[];

export type SfnCounterpartyRole = (typeof sfnCounterpartyRoles)[number];

export const customerLabelOptions = [
  "csv_file",
  "line_label",
  "no_customer_label",
  "sticker_per_collo",
  "sticker_per_line",
  "sticker_per_piece",
] as const satisfies readonly string[];

export type CustomerLabelOption = (typeof customerLabelOptions)[number];

export const decimalPlacesOptions = [
  "0",
  "1",
  "2",
] as const satisfies readonly string[];

export type DecimalPlacesOption = (typeof decimalPlacesOptions)[number];

export const processedOptions = [
  "D",
  "SL",
  "K",
  "LSR",
  "DUP",
  "NG",
  "BF",
  "L",
  "F",
  "FV",
  "ANO",
  "BEI",
  "COA",
  "SIC",
  "PER",
  "KNT",
  "POL",
  "PON",
  "SLI",
  "WAL",
  "STP",
  "Z",
] as const satisfies readonly string[];

export type ProcessedOption = (typeof processedOptions)[number];

export const ceStandards = [
  "en_10255",
  "en_10219_1",
  "en_10210_1",
  "en_10025_1",
] as const satisfies readonly string[];

export type CeStandard = (typeof ceStandards)[number];

export const productQualityStandards = [
  "en_10025_2",
  "en_10219_1",
] as const satisfies readonly string[];

export type ProductQualityStandard = (typeof productQualityStandards)[number];

export const featuresQualities = [
  "115CrV3",
  "11SMn30+C/SH",
  "11SMnPb30+C/SH",
  "300-serie",
  "301",
  "303",
  "304",
  "3041D",
  "3042B",
  "3042BB",
  "3042D",
  "3042E",
  "3044N",
  "304BA",
  "304DECO",
  "304DIV",
  "304L",
  "304L1D",
  "304L2B",
  "304L2BB",
  "304L2D",
  "304L2E",
  "304L4N",
  "304LBA",
  "304LNO4",
  "304LSB",
  "304POL",
  "304SB",
  "304-serie",
  "309",
  "3092B",
  "3092BB",
  "309BA",
  "309H2B",
  "310",
  "3102B",
  "3102BB",
  "310S1D",
  "310SWGW",
  "316",
  "3161D",
  "3162B",
  "316BA",
  "316L",
  "316L1D",
  "316L2B",
  "316L2D",
  "316L2E",
  "316LBA",
  "316LWGW",
  "316-serie",
  "316T",
  "316T1D",
  "316T2B",
  "316T2D",
  "316T2E",
  "316TBA",
  "316TWGW",
  "321",
  "3211D",
  "3212B",
  "321WGW",
  "34CrNiMo6+QT",
  "40031D",
  "400-serie",
  "409",
  "4092B",
  "410S",
  "410S2B",
  "42CrMoS4+QT",
  "42MnV7",
  "430",
  "4301D",
  "4302B",
  "4302BB",
  "4304N",
  "430AF/SB",
  "430BA",
  "430SB",
  "431",
  "439",
  "4392B",
  "439BA",
  "441",
  "4412B",
  "4412D",
  "441BA",
  "444",
  "4442B",
  "4442D",
  "444BA",
  "4510Ti BA",
  "4513",
  "48351D",
  "A1050",
  "A1050H111",
  "A1050H22",
  "A1050H24",
  "A105N",
  "A106 Grade B",
  "A234 Grade WPB",
  "A3103",
  "A3103 H14",
  "A5005",
  "A5005H111",
  "A5005H14",
  "A5005H22",
  "A5005H24",
  "A5083",
  "A5083H111",
  "A5083H22",
  "A5083H24",
  "A5754",
  "A5754H111",
  "A5754H22",
  "A5754H24",
  "A5754O2TR",
  "A5754O5TR",
  "A6082",
  "A6082T6",
  "AlCuBiPb",
  "AlCuMgPb",
  "AlMg4.5Mn0.7",
  "AlMgSi0.5",
  "AlMgSi1",
  "Alu",
  "B500A-HKN",
  "B500B-HWL",
  "C15R",
  "C22",
  "C35+C/SH",
  "C35R",
  "C45",
  "C45+C",
  "C45+C/SH",
  "C45+N",
  "C45+SL",
  "C60R",
  "C85S",
  "DC01",
  "DC01+ZE25/25APC",
  "DC01-Am",
  "DX51D+Z275MAC",
  "E195",
  "E220",
  "E-Cu",
  "HA-serie",
  "Laserpress 240",
  "Ms58",
  "Ms63",
  "P195T",
  "P235GH",
  "P235TR1",
  "P250GH",
  "Rg12",
  "Rg7",
  "S195T",
] as const satisfies readonly string[];

export type FeaturesQuality = (typeof featuresQualities)[number];

export type WarehouseTransportRegion =
  (typeof warehouseTransportRegions)[number];

export const transportModes = [
  "sea_transport",
  "rail_transport",
  "road_transport",
  "air_transport",
  "postal_shipments",
  "fixed_transport_facilities",
  "inland_waterway_transport",
  "own_power",
] as const satisfies readonly string[];

export type TransportMode = (typeof transportModes)[number];

export const returnOrderReasons = [
  "wrong_delivery",
  "damaged_goods",
  "quality_issue",
  "wrong_order",
  "excess_delivery",
  "customer_changed_mind",
  "other",
] as const satisfies readonly string[];

export type ReturnOrderReason = (typeof returnOrderReasons)[number];

export const returnOrderStatuses = [
  "open",
  "in_progress",
  "received",
  "credited",
  "cancelled",
] as const satisfies readonly string[];

export type ReturnOrderStatus = (typeof returnOrderStatuses)[number];

export const orderDeblockTypes = [
  "financial",
  "invoice",
  "transport",
  "handling",
] as const satisfies readonly string[];

export type OrderDeblockType = (typeof orderDeblockTypes)[number];

export const purchaseReturnOrderReasons = [
  "damaged",
  "wrong_quantity",
  "wrong_material_delivered",
  "delivered_too_late",
  "not_delivered",
  "transport_damage",
  "incorrect_delivery_address",
] as const satisfies readonly string[];

export type PurchaseReturnOrderReason =
  (typeof purchaseReturnOrderReasons)[number];

export const machineOptionTypes = [
  "decoiling",
  "grinding",
  "shear_cut",
  "laser",
  "duplo",
  "brushing",
  "blue_foil",
  "laser_foil",
  "uv_foil",
  "remove_foil",
  "anodizing",
  "pickling",
  "coating",
  "embossing",
  "perforate",
  "bending",
  "polished",
  "punching",
  "slitting",
  "rolling",
  "stamping",
  "sawing",
] as const satisfies readonly string[];

export type MachineOptionType = (typeof machineOptionTypes)[number];

export const machineProductionTypes = [
  "decoiler",
  "internal_processing",
  "shearing",
  "laser_1",
  "laser_2",
  "grinding_foiling",
] as const satisfies readonly string[];

export type MachineProductionType = (typeof machineProductionTypes)[number];

export const machineLoadingTypes = [
  "load",
] as const satisfies readonly string[];

export type MachineLoadingType = (typeof machineLoadingTypes)[number];

export const machineCapacityUnits = [
  "percent",
  "amount",
  "hk",
  "hm",
  "hs",
  "kg",
  "m1",
  "m2",
  "m3",
  "mm",
  "line",
  "st",
  "tn",
] as const satisfies readonly string[];

export type MachineCapacityUnit = (typeof machineCapacityUnits)[number];

export const processingEditings = [
  "stamping",
  "polished",
  "paper_interleaving",
  "pickling",
  "laser",
  "blue_foil",
  "bending",
  "uv_foil",
  "rolling",
  "anodizing",
  "slitting",
  "brushing",
  "remove_foil",
  "certificate_2_1",
  "sawing",
  "coating",
  "punching",
  "grinding",
  "decoiling",
  "duplo",
  "embossing",
  "shear_cut",
  "laser_foil",
  "perforate",
  "certificate_3_1",
] as const satisfies readonly string[];

export type ProcessingEditing = (typeof processingEditings)[number];

export const textUsageCategories = [
  "purchase_quote_request",
  "purchase_order",
  "purchase_order_tool_tip",
  "purchase_return_order",
  "sales_quote",
  "sales_order",
  "sales_order_tool_tip",
  "sales_invoice",
  "warehouse_order",
  "production_order",
  "loadlist",
  "waybill",
  "ride_list",
  "customer_label",
  "visit_report",
  "transport_planning",
  "website_in_advance",
  "website_after",
] as const satisfies readonly string[];

export type TextUsageCategory = (typeof textUsageCategories)[number];

export const invoiceSurchargeDescriptions = [
  "project_discount",
  "certificate_costs",
  "cutting_surcharge",
  "decoil_surcharge",
  "order_surcharge",
  "packaging_surcharge",
  "pallet_surcharge",
  "administration_costs",
  "transport_costs",
  "transport_costs_internal",
  "maut_costs",
  "return_costs",
  "import_costs",
  "costs",
  "other",
  "purchasing_rounding_differences",
  "credit_notes_to_be_received_third_party",
  "credit_notes_to_be_received",
  "eu_import_duties",
  "price_differences",
  "price_differences_eu_non_eu",
  "external_transport",
] as const satisfies readonly string[];

export type InvoiceSurchargeDescription =
  (typeof invoiceSurchargeDescriptions)[number];

// What an Invoices row actually is. A credit note is the same document with
// its amounts negated — same numbering, same ledger, same ageing — so it lives
// in the same table rather than a parallel one that every report would have to
// learn about separately.
export const invoiceDocumentTypes = [
  "invoice",
  "credit_note",
] as const satisfies readonly string[];

export type InvoiceDocumentType = (typeof invoiceDocumentTypes)[number];

export const invoiceVatScenarios = [
  "purchase_domestically",
  "domestic_purchase_vat_shifted",
  "purchase_within_eu_with_reverse_charge",
  "purchase_outside_eu_with_reverse_charge",
  "domestic_sales",
  "sales_within_eu_with_reverse_charge",
  "sales_outside_eu_with_reverse_charge",
] as const satisfies readonly string[];

export type InvoiceVatScenario = (typeof invoiceVatScenarios)[number];

export const invoicePaymentTerms = [
  "prepayment",
  "cash",
  "within_7_days_after_invoice_date",
  "within_8_days_from_date_of_invoice",
  "within_10_days_from_date_of_invoice",
  "within_14_days_from_date_of_invoice",
  "within_21_days_after_invoice_date",
  "within_30_days_from_date_of_invoice",
  "within_30_days_end_of_month",
  "within_45_days_from_date_of_invoice",
  "within_60_days_from_date_of_invoice",
  "within_90_days_after_invoice_date",
  "prepayment_minus1pct_discount",
  "within_8_days_minus1pct_30_days_net",
  "within_8_days_minus1_5pct_30_days_net",
  "within_8_days_minus2pct_30_days_net",
  "5pct_prepayment_balance_cad",
  "10pct_prepayment_balance_cad",
  "15pct_prepayment_balance_cad",
  "20pct_prepayment_balance_cad",
  "25pct_prepayment_balance_cad",
  "30pct_prepayment_balance_cad",
  "50pct_prepayment_balance_cad",
  "cash_against_documents",
  "lc_at_sight",
  "within_10_days_1_5pct_30_days_net",
  "within_14_days_minus2pct_30_days_net",
  "within_10_days_minus1pct_30_days_net",
  "within_14_days_minus1pct_30_days_net",
  "within_14_days_minus3pct_30_days_net",
  "within_10_days_minus3pct_30_days_net",
  "lc_120_days",
  "20pct_prepayment_rest_before_shipping",
  "25pct_prepayment_rest_before_shipping",
  "20pct_advance_payment_remainder_copy_bl",
  "30pct_advance_payment_remainder_copy_bl",
  "5pct_prepayment_balance_30_days_copy_bl",
  "50pct_in_advance_remainder_14_days_after_arrival_at_port",
  "5pct_prepayment_balance_60_days_copy_bl",
  "50pct_prepayment_remaining_15_days_after_shipment",
  "prepayment_minus2pct_discount",
  "lc_180_days",
  "lc_90_days",
  "to_be_determined",
  "immediately_after_receipt_of_goods",
  "payment_in_settlement",
  "direct_debit",
] as const satisfies readonly string[];

export type InvoicePaymentTerm = (typeof invoicePaymentTerms)[number];

export const orderMethods = [
  "telephone",
  "email",
  "counter",
  "representative",
  "oral",
  "website",
  "edi",
  "ai_read_email",
] as const satisfies readonly string[];

export type OrderMethod = (typeof orderMethods)[number];

export const orderStatuses = [
  "open",
  "confirmed",
  "completed",
  "cancelled",
] as const satisfies readonly string[];

export type OrderStatus = (typeof orderStatuses)[number];

export const orderItemStatuses = [
  "reserved",
  "delivered",
  "invoiced",
  // Billed, then sent back and credited. Terminal: a line can only come back
  // once, so this is what stops the same delivery being credited twice.
  "returned",
  "cancelled",
] as const satisfies readonly string[];

export type OrderItemStatus = (typeof orderItemStatuses)[number];

// Fulfilment state of an order/return line (the "Line status" column).
export const orderLineStatuses = [
  "in_progress",
  "released",
  "partially_delivered",
  "delivered",
  "partially_invoiced",
  "invoiced",
  "cancelled",
] as const satisfies readonly string[];

export type OrderLineStatus = (typeof orderLineStatuses)[number];

// Whether a line is ready to physically leave the warehouse.
export const deliveryStatuses = [
  "not_ready",
  "ready",
  "released",
  "delivered",
] as const satisfies readonly string[];

export type DeliveryStatus = (typeof deliveryStatuses)[number];

export const deliveryTerms = [
  "exw",
  "fca",
  "fob",
  "cfr",
  "cif",
  "cpt",
  "cip",
  "dap",
  "dpu",
  "ddp",
] as const satisfies readonly string[];

export type DeliveryTerm = (typeof deliveryTerms)[number];

export const orderWeightTypes = [
  "theoretical_weight",
  "trade_weight",
  "german_trade_weight",
  "weighed",
] as const satisfies readonly string[];

export type OrderWeightType = (typeof orderWeightTypes)[number];

export const deliveryTypes = [
  "date",
  "week",
] as const satisfies readonly string[];

export type DeliveryType = (typeof deliveryTypes)[number];

export const transporterPriceUnits = [
  "amount",
  "per_km",
  "per_kg",
  "percentage",
] as const satisfies readonly string[];

export type TransporterPriceUnit = (typeof transporterPriceUnits)[number];

// Country codes used on the transporter countries grid. Values are the legacy
// dispatch codes shown in the "Code" column; labels are the descriptions.
export const transporterCountries = [
  "A",
  "AE",
  "AN",
  "AZ",
  "B",
  "BAN",
  "BE2",
  "BG",
  "BR",
  "BY",
  "CDN",
  "CH",
  "CL",
  "CN",
  "CR",
  "CW",
  "CY",
  "CZ",
  "D",
  "DK",
  "E",
  "EE",
  "ES2",
  "ET",
  "F",
  "FIN",
  "FL",
  "GB",
  "GB2",
  "GE",
  "GR",
  "H",
  "HEG",
  "HK",
  "I",
  "IND",
  "IR",
  "IRL",
  "KR",
  "KRO",
  "L",
  "LT",
  "LV",
  "MA",
  "MAL",
  "MK",
  "NL",
  "NO",
  "P",
  "PK",
  "PL",
  "RC",
  "RO",
  "ROK",
  "RUS",
  "S",
  "SGP",
  "SK",
  "SLO",
  "SME",
  "SRB",
  "SVN",
  "SYR",
  "TR",
  "UA",
  "uk",
  "USA",
  "VN",
  "ZA",
] as const satisfies readonly string[];

export type TransporterCountry = (typeof transporterCountries)[number];

export const counterOrderStatuses = [
  "open",
  "in_progress",
  "delivered",
  "invoiced",
  "cancelled",
] as const satisfies readonly string[];

export type CounterOrderStatus = (typeof counterOrderStatuses)[number];

export const counterOrderPriorities = [
  "normal",
  "rush",
] as const satisfies readonly string[];

export type CounterOrderPriority = (typeof counterOrderPriorities)[number];

export const invoicingMethods = [
  "per_delivery",
  "per_order",
  "per_order_line",
] as const satisfies readonly string[];

export type InvoicingMethod = (typeof invoicingMethods)[number];

export const invoiceFrequencies = [
  "daily",
  "weekly",
  "monthly",
] as const satisfies readonly string[];

export type InvoiceFrequency = (typeof invoiceFrequencies)[number];

export const purchaseOrderTypes = [
  "materials",
  "processing",
  "customer_materials",
] as const satisfies readonly string[];

export type PurchaseOrderType = (typeof purchaseOrderTypes)[number];

export const purchaseOrderStatuses = [
  "open",
  "confirmed",
  "pre_notified",
  "completed",
  "cancelled",
] as const satisfies readonly string[];

export type PurchaseOrderStatus = (typeof purchaseOrderStatuses)[number];

// How money actually moved. "Offset" is settlement without cash — a credit
// note or a counter-invoice netted against this one.
export const paymentMethods = [
  "bank_transfer",
  "direct_debit",
  "cash",
  "card",
  "offset",
] as const satisfies readonly string[];

export type PaymentMethod = (typeof paymentMethods)[number];

// Where a purchase request has got to. A request is the "who can supply this?"
// document: it is sent to several suppliers at once, collects their quotes, and
// ends when one of them is turned into a purchase order.
export const purchaseRequestStatuses = [
  "draft",
  "sent",
  "quoted",
  "awarded",
  "cancelled",
] as const satisfies readonly string[];

export type PurchaseRequestStatus = (typeof purchaseRequestStatuses)[number];

// Where a supplier's quote has got to. "lost" is set on the siblings when
// another quote against the same request is awarded, so the comparison screen
// shows that a decision was taken rather than leaving every quote open forever.
export const purchaseQuoteStatuses = [
  "open",
  "received",
  "awarded",
  "lost",
  "expired",
] as const satisfies readonly string[];

export type PurchaseQuoteStatus = (typeof purchaseQuoteStatuses)[number];

export const purchaseCompanyTypes = [
  "supplier",
  "agent",
] as const satisfies readonly string[];

export type PurchaseCompanyType = (typeof purchaseCompanyTypes)[number];

export const complaintTypes = [
  "counter_order",
  "general",
  "order",
  "purchase_order",
  "purchase_quote",
  "quote",
  "return_order",
] as const satisfies readonly string[];

export type ComplaintType = (typeof complaintTypes)[number];

export const complaintCategories = [
  "damaged",
  "wrong_price_calculated",
  "wrong_quantity",
  "wrong_material_delivered",
  "delivered_too_late",
  "transport_damage",
  "incorrect_delivery_address",
] as const satisfies readonly string[];

export type ComplaintCategory = (typeof complaintCategories)[number];

export const complaintReports = [
  "telephone",
  "email",
  "counter",
  "representative",
  "oral",
  "website",
  "edi",
  "ai_read_email",
] as const satisfies readonly string[];

export type ComplaintReport = (typeof complaintReports)[number];

export const complaintStatuses = [
  "new",
  "in_progress",
  "on_hold",
  "done",
] as const satisfies readonly string[];

export type ComplaintStatus = (typeof complaintStatuses)[number];

export const complaintCauses = [
  "warehouse",
  "production",
  "purchasing",
  "sale",
  "transportation",
  "customer",
  "supplier",
  "processor",
] as const satisfies readonly string[];

export type ComplaintCause = (typeof complaintCauses)[number];

export const complaintSolutions = [
  "collect_goods_back_credit",
  "return_goods_credit_redeliver",
  "price_correction",
  "subsequent_delivery",
  "complaint_rejected",
  "material_retained_correct_delivery",
] as const satisfies readonly string[];

export type ComplaintSolution = (typeof complaintSolutions)[number];

export const countWorkorderMethods = [
  "counting_locations",
  "products_counting",
] as const satisfies readonly string[];

export type CountWorkorderMethod = (typeof countWorkorderMethods)[number];

export const workorderReleaseMethods = [
  "direct",
  "according_to_schedule",
  "manual",
] as const satisfies readonly string[];

export type WorkorderReleaseMethod = (typeof workorderReleaseMethods)[number];

export const workorderPrintMethods = [
  "manual",
  "automatic",
  "do_not_print",
] as const satisfies readonly string[];

export type WorkorderPrintMethod = (typeof workorderPrintMethods)[number];

export const workorderSlipTypes = [
  "a4_landscape",
  "a4_portrait",
  "label",
  "label_via_csv",
] as const satisfies readonly string[];

export type WorkorderSlipType = (typeof workorderSlipTypes)[number];

export const workorderProcessingMethods = [
  "order_picking",
] as const satisfies readonly string[];

export type WorkorderProcessingMethod =
  (typeof workorderProcessingMethods)[number];

export const stickerPerPickWorkorderTypes = [
  "no_customer_label",
  "sticker_per_workorder_600dpi",
  "sticker_per_workorder_line_600dpi",
] as const satisfies readonly string[];

export type StickerPerPickWorkorderType =
  (typeof stickerPerPickWorkorderTypes)[number];

export const printerNames = [
  "microsoft_print_to_pdf_8_redirected",
  "onenote_desktop_8_redirected",
  "send_to_onenote_16",
  "sales_black",
  "sales_color",
  "sato_cl4nx_203dpi",
  "sato_cl408e_logistics",
  "onenote_desktop",
  "microsoft_print_to_pdf",
  "logistics_black",
  "logistics_color",
  "administration_black",
  "administration_color",
] as const satisfies readonly string[];

export type PrinterName = (typeof printerNames)[number];

export const printerEntries = [
  "select_automatically",
  "manual_feed",
  "tray_1",
  "tray_2",
  "tray_3",
  "tray_4",
  "tray_5",
] as const satisfies readonly string[];

export type PrinterEntry = (typeof printerEntries)[number];

export const warehouseWorkOrderStatuses = [
  "new",
  "in_progress",
  "completed",
  "cancelled",
] as const satisfies readonly string[];

export type WarehouseWorkOrderStatus =
  (typeof warehouseWorkOrderStatuses)[number];

export const warehouseWorkOrderLineTypes = [
  "unloading",
  "loading",
  "transfer",
  "processing",
  "inspection",
  "put_away",
  "picking",
] as const satisfies readonly string[];

export type WarehouseWorkOrderLineType =
  (typeof warehouseWorkOrderLineTypes)[number];

export const purchaseInvoiceBlockReasons = [
  "price_mismatch",
  "awaiting_goods_receipt",
  "awaiting_approval",
  "duplicate",
  "disputed",
  "other",
] as const satisfies readonly string[];

export type PurchaseInvoiceBlockReason =
  (typeof purchaseInvoiceBlockReasons)[number];

export const purchaseInvoiceFiscalBases = [
  "booking_date",
  "document_date",
] as const satisfies readonly string[];

export type PurchaseInvoiceFiscalBase =
  (typeof purchaseInvoiceFiscalBases)[number];

export const currencies = [
  "eur",
  "usd",
  "gbp",
  "hkd",
] as const satisfies readonly string[];

export type Currency = (typeof currencies)[number];

export const customerGroups = [
  "warehouse_staff",
  "regional_trade",
  "commission_external",
  "maritime",
  "food_industry",
  "agricultural",
  "water_purification",
  "dealer",
  "equipment_manufacturing_external",
  "contract_work_external",
  "construction",
  "building",
  "user_external",
  "tank_construction",
  "equipment_manufacturing",
  "service",
  "contract_work_internal",
  "cutting_company",
  "trade_external",
  "end_user",
  "consultancies",
  "aluminium_processing",
  "auto_bicycle_garage",
  "trailer_construction",
  "tree_nurseries",
  "construction_contracting",
  "flower_growers",
  "building_materials_trade",
  "reinforcing_steel_bending",
  "camping_recreation",
  "caravan_camping_articles",
  "bodywork_light",
  "construction_companies_light",
  "construction_companies_heavy",
  "container_construction",
  "cooperatives",
  "cultural_environmental_tech",
  "hvac_sanitary_air",
  "roofing",
  "defense",
  "animal_parks",
  "miscellaneous",
  "electrotechnical",
  "consumer_goods_manufacturers",
  "various_manufacturers",
  "mink_farmers",
  "government",
  "tool_makers",
  "technical_trading",
  "various_trading",
  "fencing_industry",
  "wood_industry_carpentry",
  "purchasing_combinations",
  "installation_companies",
  "refrigeration_technology",
  "agriculture_livestock",
  "agricultural_mechanization",
  "welding_companies",
  "contracting_companies",
  "contract_sawing",
  "machine_factories",
  "warehouse_fitters",
  "market_stand_tent",
  "metal_furniture",
  "assembly_companies",
  "utilities",
  "private_individuals",
  "pipeline_companies",
  "sheet_metal_processing",
  "stainless_steel_processing",
  "gabion_baskets",
  "schools_training",
  "shipbuilding",
  "smithies",
  "social_employment",
  "steel_trade",
  "stable_construction",
  "blasting_coating",
  "transport_companies",
  "rental_companies",
  "horticulture",
  "garden_centers",
  "road_water_construction",
  "hardware_stores",
  "care_homes",
] as const satisfies readonly string[];

export type CustomerGroup = (typeof customerGroups)[number];

export const customerStockReasons = [
  "initial_stock",
  "correction",
  "counting_difference",
  "damaged",
  "return_from_customer",
  "transfer",
  "other",
] as const satisfies readonly string[];

export type CustomerStockReason = (typeof customerStockReasons)[number];

// One row of a company's yearly visit planning grid. The array is ordered
// January (index 0) → December (index 11).
export type VisitPlanningEntry = { call: boolean; visit: boolean };

export const visitReportCategories = [
  "wishing_next_visit",
  "following_complaint",
  "acquisition",
] as const satisfies readonly string[];

export type VisitReportCategory = (typeof visitReportCategories)[number];

// One reader row on a visit report: the functionary (Clerk user id) plus
// whether the report is queued for them to read and whether they have read it.
export type VisitReportReader = {
  userId: string;
  toRead: boolean;
  read: boolean;
};

export const companyClassifications = [
  "A",
  "B",
  "C",
] as const satisfies readonly string[];

export type CompanyClassification = (typeof companyClassifications)[number];

// Production-capacity traffic-light status shown on the "Production capacity"
// overview: whether the machine's booked capacity is within limits.
export const productionCapacityStatuses = [
  "ok",
  "warning",
  "full",
] as const satisfies readonly string[];

export type ProductionCapacityStatus =
  (typeof productionCapacityStatuses)[number];

// Status of the material fetch (retrieving the raw bar/length from stock to
// bring to the saw) on the Logistics "Sawing layouts" overview.
export const sawingLayoutFetchStatuses = [
  "new",
  "in_progress",
  "completed",
  "cancelled",
] as const satisfies readonly string[];

export type SawingLayoutFetchStatus =
  (typeof sawingLayoutFetchStatuses)[number];

// Status of the sawing operation itself on the "Sawing layouts" overview.
export const sawingStatuses = [
  "new",
  "in_progress",
  "completed",
  "cancelled",
] as const satisfies readonly string[];

export type SawingStatus = (typeof sawingStatuses)[number];

// The cross-section a product is made in — what "Dimensions" on the product
// screen selects. It decides which of the width/thickness fields carry meaning:
// a round bar's width is its diameter and its thickness stays 0, while a flat
// bar uses both.
export const productDimensionShapes = [
  "round",
  "square",
  "flat",
  "rectangular",
  "hexagonal",
  "octagonal",
  "tube_round",
  "tube_square",
  "tube_rectangular",
  "sheet",
  "plate",
  "beam",
  "angle",
] as const satisfies readonly string[];

export type ProductDimensionShape = (typeof productDimensionShapes)[number];

// Which stock lot leaves the warehouse first when a product is dispatched.
export const dispatchStrategies = [
  "lifo",
  "fifo",
] as const satisfies readonly string[];

export type DispatchStrategy = (typeof dispatchStrategies)[number];

// What a price-structure surcharge or discount tier is measured against: the
// single order line, the group product, or the whole product group.
export const priceTierBases = [
  "order_line",
  "group_product",
  "product_group",
] as const satisfies readonly string[];

export type PriceTierBase = (typeof priceTierBases)[number];

// How the stock label print run is broken up on a warehouse workorder.
export const stockLabelBreakdowns = [
  "per_line_bundle",
  "per_bundle",
  "amount_per_line",
] as const satisfies readonly string[];

export type StockLabelBreakdown = (typeof stockLabelBreakdowns)[number];

// Which stock figure the periodic count is measured against.
export const countStockBases = [
  "technical",
  "available",
] as const satisfies readonly string[];

export type CountStockBasis = (typeof countStockBases)[number];
