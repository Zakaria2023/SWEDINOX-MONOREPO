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
  "toeslagen",
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
  "vrachtbrieven_afdrukken",
  "consignment_customer",
  "neutral_labels",
  "label_per_sawed_piece",
] as const satisfies readonly string[];

export type MiscellaneousOption = (typeof miscellaneousOptions)[number];

export const quoteOrderOptions = [
  "reference_required",
  "complete_delivery",
  "round_weight_per_piece_up",
  "certificaat",
  "overlengte",
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

export const machineOptionTypes = [
  "decoilen",
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
  "kanten",
  "polished",
  "punching",
  "slitting",
  "rolling",
  "stempelen",
  "zagen",
] as const satisfies readonly string[];

export type MachineOptionType = (typeof machineOptionTypes)[number];

export const machineProductionTypes = [
  "decoiler",
  "interne_wzh",
  "knip",
  "laser_1",
  "laser_2",
  "slijpen_folien",
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
  "regel",
  "st",
  "tn",
] as const satisfies readonly string[];

export type MachineCapacityUnit = (typeof machineCapacityUnits)[number];

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
  "order_surcharge",
  "packaging_surcharge",
  "pallet_surcharge",
  "administration_costs",
  "transport_costs",
  "transport_costs_internal",
  "maut_costs",
  "import_costs",
  "costs",
  "other",
  "purchasing_rounding_differences",
  "price_differences",
  "external_transport",
] as const satisfies readonly string[];

export type InvoiceSurchargeDescription =
  (typeof invoiceSurchargeDescriptions)[number];

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
  "ai_ingelezen_email",
] as const satisfies readonly string[];

export type OrderMethod = (typeof orderMethods)[number];

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

export const purchaseOrderTypes = [
  "materials",
  "processing",
  "customer_materials",
] as const satisfies readonly string[];

export type PurchaseOrderType = (typeof purchaseOrderTypes)[number];

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
  "ai_ingelezen_email",
] as const satisfies readonly string[];

export type ComplaintReport = (typeof complaintReports)[number];

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
  "microsoft_print_to_pdf_8_omgeleid",
  "onenote_desktop_8_omgeleid",
  "verzenden_naar_onenote_16",
  "verkoop_zwart",
  "verkoop_kleur",
  "sato_cl4nx_203dpi",
  "sato_cl408e_logistiek",
  "onenote_desktop",
  "microsoft_print_to_pdf",
  "logistiek_zwart",
  "logistiek_kleur",
  "administratie_zwart",
  "administratie_kleur",
] as const satisfies readonly string[];

export type PrinterName = (typeof printerNames)[number];

export const printerEntries = [
  "automatisch_selecteren",
  "handmatige_invoer",
  "lade_1",
  "lade_2",
  "lade_3",
  "lade_4",
  "lade_5",
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
