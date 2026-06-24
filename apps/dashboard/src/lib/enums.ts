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

export const visitReportContactMethods = [
  "visit",
  "telephone_contact",
] as const satisfies readonly string[];

export type VisitReportContactMethod = (typeof visitReportContactMethods)[number];

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

export type WarehouseTransportRegion =
  (typeof warehouseTransportRegions)[number];

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

export type InvoiceSurchargeDescription = (typeof invoiceSurchargeDescriptions)[number];

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

export const currencies = [
  "eur",
  "usd",
  "gbp",
  "hkd",
] as const satisfies readonly string[];

export type Currency = (typeof currencies)[number];
