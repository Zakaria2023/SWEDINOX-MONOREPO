import type {
  AddressCategory,
  ArticleGroup,
  AvailableAt,
  CeStandard,
  CertificaatOption,
  CommunicationSettingDocumentType,
  CustomerLabelOption,
  DeliveryTimeUnit,
  CommunicationSettingShape,
  CommunicationSettingType,
  CompanyLang,
  CompanyRole,
  ContactCategory,
  ContactSalutation,
  ContractableRole,
  ContractDiscountBasedOnType,
  ContractSurchargePerType,
  ContractTierUnit,
  ContractType,
  Currency,
  FeaturesQuality,
  InvoicePaymentTerm,
  InvoiceSurchargeDescription,
  InvoiceVatScenario,
  ProcessedOption,
  ProductQualityStandard,
  PurchaseInvoiceBlockReason,
  PurchaseInvoiceFiscalBase,
  PurchasingUnit,
  RevenueGroup,
  SalesUnit,
  VatCode,
  LeadTimeMethod,
  ProductShape,
  StockLabelPrintingOption,
  StockLabelType,
  StockMode,
  TextUsageCategory,
  VisitReportContactMethod,
  VisitReportReason,
  WarehouseAddress,
  WarehouseBlockReason,
  WarehouseLoadingLocation,
  WarehouseLocationType,
  WarehouseProductType,
  WarehouseTransportRegion,
} from "@/lib/enums";

export const COMMON_TEXT = {
  yes: "Yes",
  no: "No",
  notAvailable: "N/A",
  selectOption: "Select",
  emptyOption: "Empty",
  none: "None",
  cancel: "Cancel",
  close: "Close",
  edit: "Edit",
  delete: "Delete",
  saving: "Saving...",
  deleting: "Deleting...",
  confirmDelete: "Delete",
  columns: "Columns",
  selectPlaceholder: "Select an option",
  datePlaceholder: "Pick a date",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  sidebarTitle: "Sidebar",
  sidebarDescription: "Displays the mobile sidebar.",
  toggleSidebar: "Toggle sidebar",
} as const;

export const ADDRESS_CATEGORY_LABELS: Record<AddressCategory, string> = {
  invoice: "Invoice",
  visit: "Visit",
  correspondence: "Correspondence",
  delivery: "Delivery",
};

export const AVAILABLE_AT_LABELS: Record<AvailableAt, string> = {
  crane_unloading: "Crane Unloading",
  forklift_unloading: "Forklift Unloading",
};

export const COMPANY_LANGUAGE_LABELS: Record<CompanyLang, string> = {
  dutch: "Dutch",
  arabic: "Arabic",
  english: "English",
};

export const COMPANY_ROLE_LABELS: Record<CompanyRole, string> = {
  customer: "Customer",
  prospect: "Prospect",
  supplier: "Supplier",
  processor: "Processor",
  transporter: "Transporter",
  agent: "Agent",
  purchasing_org: "Purchasing Org.",
  other: "Other",
  internal: "Internal",
};

export const CONTRACTABLE_ROLE_LABELS: Record<ContractableRole, string> = {
  customer: "Customer",
  prospect: "Prospect",
  supplier: "Supplier",
  processor: "Processor",
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  gross_prices: "Gross Prices",
  options: "Options",
  net_prices: "Net Prices",
  cost_price: "Cost Price",
  surcharges: "Surcharges",
  toeslagen: "Allowances",
};

export const COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS: Record<
  CommunicationSettingDocumentType,
  string
> = {
  order_status_message: "Order Status Message",
  bill_of_lading: "Bill of Lading",
  order_confirmation: "Order Confirmation",
  quote: "Quote",
  purchase_request: "Purchase Request",
  purchase_return: "Purchase Return",
  purchase_order: "Purchase Order",
  consignment_consumption_confirmation: "Consignment Consumption Confirmation",
  call_off_confirmation: "Call-off Confirmation",
  return_order_confirmation: "Return Order Confirmation",
  pro_forma_invoice: "Pro Forma Invoice",
  certificate_email: "Certificate Email",
  invoice: "Invoice",
  price_catalogue: "Price Catalogue",
  eta: "ETA",
  eta_delayed: "ETA Delayed",
  checklist: "Checklist",
};

export const COMMUNICATION_SETTING_TYPE_LABELS: Record<
  CommunicationSettingType,
  string
> = {
  email: "Email",
  fax: "Fax",
  printing: "Printing",
  edi_ftp: "EDI FTP",
  edi_http: "EDI HTTP",
  edi_https: "EDI HTTPS",
};

export const CONTRACT_TIER_UNIT_LABELS: Record<ContractTierUnit, string> = {
  TN: "TN (Tonnage)",
  Euro: "Euro (Amount)",
};

export const CONTRACT_SURCHARGE_PER_TYPE_LABELS: Record<ContractSurchargePerType, string> = {
  order_line: "Order Line",
  group_product: "Group Product",
  product_group: "Product Group",
};

export const CONTRACT_DISCOUNT_BASED_ON_LABELS: Record<ContractDiscountBasedOnType, string> = {
  group_product: "Group Product",
  product_group: "Product Group",
};

export const COMMUNICATION_SETTING_SHAPE_LABELS: Record<
  CommunicationSettingShape,
  string
> = {
  pdf: "PDF",
  scsn: "SCSN",
  sales_in_the_construction: "Sales in the Construction",
  edi4steel: "EDI4Steel",
  text: "Text",
  peppol: "Peppol",
};

export const VISIT_REPORT_CONTACT_METHOD_LABELS: Record<VisitReportContactMethod, string> = {
  visit: "Visit",
  telephone_contact: "Telephone Contact",
};

export const VISIT_REPORT_REASON_LABELS: Record<VisitReportReason, string> = {
  visit_frequency: "Visit frequency",
  turnover_is_lagging_behind: "Turnover is lagging behind",
  complaint: "Complaint",
  quotation_follow_up: "Quotation follow-up",
  at_customers_request: "At customer's request",
  introduction: "Introduction",
};
export const CONTACT_SALUTATION_LABELS: Record<ContactSalutation, string> = {
  mr: "Mr.",
  mrs: "Mrs.",
};

export const CONTACT_CATEGORY_LABELS: Record<ContactCategory, string> = {
  procurement: "Procurement",
  sales: "Sales",
  warehouse: "Warehouse",
  management: "Management",
  bookkeeping: "Bookkeeping",
  certificates: "Certificates",
};

export const WAREHOUSE_ADDRESS_LABELS: Record<WarehouseAddress, string> = {
  hego_almere: "Bolderweg 10, 1332AT, Almere",
  port_of_rotterdam: "Wilhelminakade 909, 3072AP, Rotterdam",
  port_of_antwerp: "Zaha Hadidplein 1, 2030, Antwerpen",
};

export const WAREHOUSE_LOCATION_TYPE_LABELS: Record<
  WarehouseLocationType,
  string
> = {
  pick: "Pick",
  bulk: "Bulk",
  production: "Production",
  scrap: "Scrap",
  load: "Load",
  inspection: "Inspection",
  put_away: "Put-away",
  sorting: "Sorting",
  processing: "Processing",
  collection: "Collection",
  call_off: "Call-off",
};

export const WAREHOUSE_LOADING_LOCATION_LABELS: Record<
  WarehouseLoadingLocation,
  string
> = {
  load: "Load",
};

export const WAREHOUSE_BLOCK_REASON_LABELS: Record<
  WarehouseBlockReason,
  string
> = {
  disapproval: "Disapproval",
  reserved_for_customer: "Reserved for Customer",
  other: "Other",
  consignment: "Consignment",
  location_type_setting: "Location Type Setting",
};

export const WAREHOUSE_PRODUCT_TYPE_LABELS: Record<
  WarehouseProductType,
  string
> = {
  beam: "Beam",
  tube: "Tube",
  sheet: "Sheet",
  profile: "Profile",
  bar: "Bar",
};

export const WAREHOUSE_TRANSPORT_REGION_CODES: Record<
  WarehouseTransportRegion,
  string
> = {
  azie: "AZIE",
  bal: "BAL",
  bel: "BEL",
  dui: "DUI",
  eng: "ENG",
  fra: "FRA",
  ita: "ITA",
  lux: "LUX",
  ned: "NED",
  oe: "OE",
  sp_po: "SP/PO",
  zd_am: "ZD-AM",
};

export const WAREHOUSE_TRANSPORT_REGION_LABELS: Record<
  WarehouseTransportRegion,
  string
> = {
  azie: "Asia",
  bal: "Baltic States",
  bel: "Belgium",
  dui: "Germany",
  eng: "UK",
  fra: "France",
  ita: "Italy",
  lux: "Luxembourg",
  ned: "Netherlands",
  oe: "Eastern Europe",
  sp_po: "Spain/Portugal",
  zd_am: "South America",
};

export const TEXT_USAGE_CATEGORY_LABELS: Record<TextUsageCategory, string> = {
  purchase_quote_request: "Purchase Quote Request",
  purchase_order: "Purchase Order",
  purchase_order_tool_tip: "Purchase Order Tool Tip",
  purchase_return_order: "Purchase Return Order",
  sales_quote: "Sales Quote",
  sales_order: "Sales Order",
  sales_order_tool_tip: "Sales Order Tool Tip",
  sales_invoice: "Sales Invoice",
  warehouse_order: "Warehouse Order",
  production_order: "Production Order",
  loadlist: "Loadlist",
  waybill: "Waybill",
  ride_list: "Ride List",
  customer_label: "Customer Label",
  visit_report: "Visit Report",
  transport_planning: "Transport Planning",
  website_in_advance: "Website In Advance",
  website_after: "Website After",
};

export const INVOICE_SURCHARGE_DESCRIPTION_LABELS: Record<InvoiceSurchargeDescription, string> = {
  project_discount: "Project discount",
  certificate_costs: "Certificate costs",
  order_surcharge: "Order surcharge",
  packaging_surcharge: "Packaging surcharge",
  pallet_surcharge: "Pallet surcharge",
  administration_costs: "Administration costs",
  transport_costs: "Transport costs",
  transport_costs_internal: "Transport costs Internal",
  maut_costs: "Maut costs",
  import_costs: "Import costs",
  costs: "Costs",
  other: "Other",
  purchasing_rounding_differences: "Purchasing rounding differences",
  price_differences: "Price differences",
  external_transport: "External transport",
};

export const INVOICE_VAT_SCENARIO_LABELS: Record<InvoiceVatScenario, string> = {
  purchase_domestically: "Purchase domestically",
  domestic_purchase_vat_shifted: "Domestic purchase VAT shifted",
  purchase_within_eu_with_reverse_charge: "Purchase within EU with reverse charge",
  purchase_outside_eu_with_reverse_charge: "Purchase outside the EU with reverse charge",
  domestic_sales: "Domestic sales",
  sales_within_eu_with_reverse_charge: "Sales within EU with reverse charge",
  sales_outside_eu_with_reverse_charge: "Sales outside the EU with a reverse charge",
};

export const INVOICE_PAYMENT_TERM_LABELS: Record<InvoicePaymentTerm, string> = {
  prepayment: "Prepayment",
  cash: "Cash",
  within_7_days_after_invoice_date: "Within 7 days after invoice date",
  within_8_days_from_date_of_invoice: "Within 8 days from date of invoice",
  within_10_days_from_date_of_invoice: "Within 10 days from date of invoice",
  within_14_days_from_date_of_invoice: "Within 14 days from date of invoice",
  within_21_days_after_invoice_date: "Within 21 days after invoice date",
  within_30_days_from_date_of_invoice: "Within 30 days from date of invoice",
  within_30_days_end_of_month: "Within 30 days end of month",
  within_45_days_from_date_of_invoice: "Within 45 days from date of invoice",
  within_60_days_from_date_of_invoice: "Within 60 days from date of invoice",
  within_90_days_after_invoice_date: "Within 90 days after invoice date",
  prepayment_minus1pct_discount: "Prepayment -1% Discount",
  within_8_days_minus1pct_30_days_net: "Within 8 days -1%, 30 days net",
  within_8_days_minus1_5pct_30_days_net: "Within 8 days -1,5%, 30 days net",
  within_8_days_minus2pct_30_days_net: "Within 8 days -2%, 30 days net",
  "5pct_prepayment_balance_cad": "5% Prepayment, balance CAD",
  "10pct_prepayment_balance_cad": "10% Prepayment, balance CAD",
  "15pct_prepayment_balance_cad": "15% Prepayment, balance CAD",
  "20pct_prepayment_balance_cad": "20% Prepayment, balance CAD",
  "25pct_prepayment_balance_cad": "25% Prepayment, balance CAD",
  "30pct_prepayment_balance_cad": "30% Prepayment, balance CAD",
  "50pct_prepayment_balance_cad": "50% Prepayment, balance CAD",
  cash_against_documents: "Cash against documents",
  lc_at_sight: "L/C at sight",
  within_10_days_1_5pct_30_days_net: "Within 10 days 1.5% 30 days Net",
  within_14_days_minus2pct_30_days_net: "Within 14 days -2%, 30 days net",
  within_10_days_minus1pct_30_days_net: "Within 10 days -1.0%, 30 days Net",
  within_14_days_minus1pct_30_days_net: "Within 14 days -1.0%. 30 days net",
  within_14_days_minus3pct_30_days_net: "Within 14 days -3.0%, 30 days net",
  within_10_days_minus3pct_30_days_net: "Within 10 days -3.0%. 30 days Net",
  lc_120_days: "L/C 120 days",
  "20pct_prepayment_rest_before_shipping": "20% Prepayment, Rest Before Shipping",
  "25pct_prepayment_rest_before_shipping": "25% Prepayment, Rest Before Shipping",
  "20pct_advance_payment_remainder_copy_bl": "20% advance payment, remainder copy BL",
  "30pct_advance_payment_remainder_copy_bl": "30% advance payment, remainder copy BL",
  "5pct_prepayment_balance_30_days_copy_bl": "5% Prepayment, balance 30 days copy BL",
  "50pct_in_advance_remainder_14_days_after_arrival_at_port": "50% in advance, remainder 14 days after arrival at port",
  "5pct_prepayment_balance_60_days_copy_bl": "5% Prepayment, balance 60 days copy BL",
  "50pct_prepayment_remaining_15_days_after_shipment": "50% Prepayment, Remaining 15 days after shipment",
  prepayment_minus2pct_discount: "Prepayment -2% Discount",
  lc_180_days: "L/C 180 days",
  lc_90_days: "L/C 90 days",
  to_be_determined: "To be determined",
  immediately_after_receipt_of_goods: "Immediately after receipt of goods",
  payment_in_settlement: "Payment in settlement",
  direct_debit: "Direct Debit",
};

export const PRODUCT_SHAPE_LABELS: Record<ProductShape, string> = {
  bar_steel: "Bar Steel",
  coil: "Coil",
  piece_article: "Piece Article",
  sheet: "Sheet",
  tube: "Tube",
  beam_steel: "Beam Steel",
  profile: "Profile",
};

export const ARTICLE_GROUP_LABELS: Record<ArticleGroup, string> = {
  ck304: "CK304",
  ck316: "CK316",
  ck430: "CK430",
  ckm304: "CKM304",
  pdiva: "PDIVA",
  pk304: "PK304",
  pta2_5: "PTA2,5",
  pta3: "PTA3",
  pta3_5: "PTA3,5",
  pta5: "PTA5",
  pw304: "PW304",
  pw316: "PW316",
  pw430: "PW430",
};

export const REVENUE_GROUP_LABELS: Record<RevenueGroup, string> = {
  ss_304: "SS 304",
  ss_316: "SS 316",
  ss_321: "SS 321",
  ss_430: "SS 430",
  high_alloys: "High Alloys",
  aluminium: "Aluminium",
  steel: "Steel",
  roestvast_nl: "Roestvast.nl",
  foil_consumption_and_sales: "Foil consumption and sales",
  sales_residual_material: "Sales residual material",
  other_pallets_etc: "Other (Pallets etc)",
  other_products: "Other products",
  decoiling: "Decoiling",
  grinding_foiling: "Grinding/Foiling",
  cutting: "Cutting",
  lasering: "Lasering",
  other_processing: "Other processing",
  freight_costs: "Freight costs",
  freight_costs_external: "Freight costs external",
  credit_notes_yet_to_be_received: "Credit notes yet to be received",
  vat_credit_restriction_creditor: "VAT credit restriction creditor",
  price_differences: "Price differences",
  other_allowances: "Other allowances",
  eu_import_duties: "EU Import duties",
  revenue_asia_vs_eu_material: "Revenue Asia vs. EU material",
  import_costs: "Import costs",
};

export const SALES_UNIT_LABELS: Record<SalesUnit, string> = {
  HK: "One hundred kilograms",
  HM: "One hundred meters",
  HS: "One hundred pieces",
  KG: "Kilogram",
  M1: "Meter",
  M2: "Square meters",
  MM: "Millimeter",
  ST: "Pieces",
  TN: "Tonnage",
};

export const VAT_CODE_LABELS: Record<VatCode, string> = {
  vat_0: "VAT 0%",
  vat_low_9: "VAT Low 9%",
  vat_high_21: "VAT High 21%",
  vat_middle_12: "VAT Middle 12%",
};

export const CERTIFICAAT_LABELS: Record<CertificaatOption, string> = {
  en10204_2_1: "2.1 Certificate (EN10204-2.1)",
  en10204_3_1: "3.1 Certificate (EN10204-3.1)",
};

export const STOCK_MODE_LABELS: Record<StockMode, string> = {
  multiplier: "Times average monthly consumption",
  fixed_value: "Fixed value",
};

export const LEAD_TIME_METHOD_LABELS: Record<LeadTimeMethod, string> = {
  manually: "Manually",
  automatic_maximum: "Automatic (Maximum)",
  automatic_average: "Automatic (Average)",
};

export const STOCK_LABEL_TYPE_LABELS: Record<StockLabelType, string> = {
  label: "Label",
  sticker: "Sticker",
};

export const STOCK_LABEL_PRINTING_LABELS: Record<StockLabelPrintingOption, string> = {
  per_line_bundle: "Per line/bundle",
  per_bundle: "Per bundle or per",
  amount_per_line: "Amount (per line)",
};

export const CUSTOMER_LABEL_OPTION_LABELS: Record<CustomerLabelOption, string> = {
  csv_file: "CSV file",
  line_label: "Line Label",
  no_customer_label: "No Customer Label",
  sticker_per_collo: "Sticker per collo",
  sticker_per_line: "Sticker per line",
  sticker_per_piece: "Sticker per piece",
};

export const PURCHASING_UNIT_LABELS: Record<PurchasingUnit, string> = {
  HS: "One hundred pieces",
  ST: "Pieces",
};

export const DELIVERY_TIME_UNIT_LABELS: Record<DeliveryTimeUnit, string> = {
  months: "Months",
  weeks: "Weeks",
  working_days: "Working Days",
};

export const PROCESSED_OPTION_LABELS: Record<ProcessedOption, string> = {
  D: "Decoilen",
  SL: "Grinding",
  K: "ShearCut",
  LSR: "Laser",
  DUP: "Duplo",
  NG: "Brushing",
  BF: "Blue Foil",
  L: "Laser Foil",
  F: "UV Foil",
  FV: "Remove Foil",
  ANO: "Anodizing",
  BEI: "Pickling",
  COA: "Coating",
  SIC: "Embossing",
  PER: "Perforate",
  KNT: "Kanten",
  POL: "Polished",
  PON: "Punching",
  SLI: "Slitting",
  WAL: "Rolling",
  STP: "Stempelen",
  Z: "Zagen",
};

export const CE_STANDARD_LABELS: Record<CeStandard, string> = {
  en_10255: "EN 10255",
  en_10219_1: "EN 10219-1",
  en_10210_1: "EN 10210-1",
  en_10025_1: "EN 10025-1",
};

export const PRODUCT_QUALITY_STANDARD_LABELS: Record<ProductQualityStandard, string> = {
  en_10025_2: "EN 10025-2",
  en_10219_1: "EN 10219-1",
};

export const FEATURES_QUALITY_LABELS: Record<FeaturesQuality, string> = {
  "115CrV3": "115CrV3",
  "11SMn30+C/SH": "11SMn30+C/SH",
  "11SMnPb30+C/SH": "11SMnPb30+C/SH",
  "300-serie": "300-serie",
  "301": "EN 1.4310",
  "303": "EN 1.4305",
  "304": "EN 1.4301",
  "3041D": "EN 1.4301 1D",
  "3042B": "EN 1.4301 2B",
  "3042BB": "EN 1.4301 2BB",
  "3042D": "EN 1.4301 2D",
  "3042E": "EN 1.4301 2E",
  "3044N": "EN 1.4301 4N",
  "304BA": "EN 1.4301 BA",
  "304DECO": "EN 1.4301 DECO",
  "304DIV": "EN 1.4301 Diversen",
  "304L": "EN 1.4307",
  "304L1D": "EN 1.4307 1D",
  "304L2B": "EN 1.4307 2B",
  "304L2BB": "EN 1.4307 2BB",
  "304L2D": "EN 1.4307 2D",
  "304L2E": "EN 1.4307 2E",
  "304L4N": "EN 1.4307 4N",
  "304LBA": "EN 1.4307 BA",
  "304LNO4": "EN 1.4307 No4",
  "304LSB": "EN 1.4307 SB",
  "304POL": "EN 1.4301 Gepoljst",
  "304SB": "EN 1.4301 SB",
  "304-serie": "304-serie",
  "309": "EN 1.4828",
  "3092B": "EN 1.4828 2B",
  "3092BB": "EN 1.4828 2BB",
  "309BA": "EN 1.4828 BA",
  "309H2B": "EN 1.4828 H2B",
  "310": "EN 1.4841",
  "3102B": "EN 1.4841 2B",
  "3102BB": "EN 1.4841 2BB",
  "310S1D": "EN 1.4845 1D",
  "310SWGW": "EN 1.4845 WGW",
  "316": "EN 1.4401",
  "3161D": "EN 1.4401 1D",
  "3162B": "EN 1.4401 2B",
  "316BA": "EN 1.4401 BA",
  "316L": "EN 1.4404",
  "316L1D": "EN 1.4404 1D",
  "316L2B": "EN 1.4404 2B",
  "316L2D": "EN 1.4404 2D",
  "316L2E": "EN 1.4404 2E",
  "316LBA": "EN 1.4404 BA",
  "316LWGW": "EN 1.4404 Warmgewalst",
  "316-serie": "316-serie",
  "316T": "EN 1.4571",
  "316T1D": "EN 1.4571 1D",
  "316T2B": "EN 1.4571 2B",
  "316T2D": "EN 1.4571 2D",
  "316T2E": "EN 1.4571 2E",
  "316TBA": "EN 1.4571 BA",
  "316TWGW": "EN 1.4571 Warmgewalst",
  "321": "EN 1.4541",
  "3211D": "EN 1.4541 1D",
  "3212B": "EN 1.4541 2B",
  "321WGW": "EN 1.4541 Warmgewalst",
  "34CrNiMo6+QT": "34CrNiMo6+QT",
  "40031D": "EN 1.4003 1D",
  "400-serie": "400-serie",
  "409": "EN 1.4512",
  "4092B": "EN 1.4512 2B",
  "410S": "EN 1.4000",
  "410S2B": "EN 1.4000 2B",
  "42CrMoS4+QT": "42CrMoS4+QT",
  "42MnV7": "42MnV7",
  "430": "EN 1.4016",
  "4301D": "EN 1.4016 1D",
  "4302B": "EN 1.4016 2B",
  "4302BB": "EN 1.4016 2BB",
  "4304N": "EN 1.4016 4N",
  "430AF/SB": "EN 1.4016 AF/SB",
  "430BA": "EN 1.4016 BA",
  "430SB": "EN 1.4016 SB",
  "431": "EN 1.4057",
  "439": "EN 1.4510",
  "4392B": "EN 1.4510 2B",
  "439BA": "EN 1.4510 BA",
  "441": "EN 1.4509",
  "4412B": "EN 1.4509 2B",
  "4412D": "EN 1.4509 2D",
  "441BA": "EN 1.4509 BA",
  "444": "EN 1.4521",
  "4442B": "EN 1.4521 2B",
  "4442D": "EN 1.4521 2D",
  "444BA": "EN 1.4521 BA",
  "4510Ti BA": "1.4510Ti BA",
  "4513": "EN 1.4513 2B",
  "48351D": "EN 1.4835 1D",
  "A1050": "EN AW 1050",
  "A1050H111": "EN AW 1050 H111",
  "A1050H22": "EN AW 1050 H22",
  "A1050H24": "EN AW 1050 H24",
  "A105N": "A105N",
  "A106 Grade B": "A106 Grade B",
  "A234 Grade WPB": "A234 Grade WPB",
  "A3103": "EN AW 3103",
  "A3103 H14": "EN AW 3103 H14",
  "A5005": "EN AW 5005",
  "A5005H111": "EN AW 5005 H111",
  "A5005H14": "EN AW 5005 H14",
  "A5005H22": "EN AW 5005 H22",
  "A5005H24": "EN AW 5005 H24",
  "A5083": "EN AW-5083",
  "A5083H111": "EN AW-5083 H111",
  "A5083H22": "EN AW-5083 H22",
  "A5083H24": "EN AW-5083 H24",
  "A5754": "EN AW 5754",
  "A5754H111": "EN AW 5754 H111",
  "A5754H22": "EN AW 5754 H22",
  "A5754H24": "EN AW 5754 H24",
  "A5754O2TR": "EN AW 5754 O2 TR",
  "A5754O5TR": "EN AW 5754 O5 TR",
  "A6082": "EN AW 6082",
  "A6082T6": "EN AW 6082 T6",
  "AlCuBiPb": "EN AW 2011 - 28ST",
  "AlCuMgPb": "EN AW 2007",
  "AlMg4.5Mn0.7": "EN AW 5083",
  "AlMgSi0.5": "EN AW 6060 - 50ST",
  "AlMgSi1": "EN AW 6082 - 51ST",
  "Alu": "Alu",
  "B500A-HKN": "B500A-HKN",
  "B500B-HWL": "B500B-HWL",
  "C15R": "C15R",
  "C22": "C22",
  "C35+C/SH": "C35+C/SH",
  "C35R": "C35R",
  "C45": "C45",
  "C45+C": "C45+C",
  "C45+C/SH": "C45+C/SH",
  "C45+N": "C45+N",
  "C45+SL": "C45+SL",
  "C60R": "C60R",
  "C85S": "C85S",
  "DC01": "DC01",
  "DC01+ZE25/25APC": "DC01+ZE25/25APC",
  "DC01-Am": "DC01-Am",
  "DX51D+Z275MAC": "DX51D+Z275MAC",
  "E195": "E195",
  "E220": "E220",
  "E-Cu": "E-Cu",
  "HA-serie": "HA-serie",
  "Laserpress 240": "Laserpress 240",
  "Ms58": "Ms58",
  "Ms63": "Ms63",
  "P195T": "P195T",
  "P235GH": "P235GH",
  "P235TR1": "P235TR1",
  "P250GH": "P250GH",
  "Rg12": "Rg12",
  "Rg7": "Rg7",
  "S195T": "S195T",
};

export const PURCHASE_INVOICE_BLOCK_REASON_LABELS: Record<PurchaseInvoiceBlockReason, string> = {
  price_mismatch: "Price Mismatch",
  awaiting_goods_receipt: "Awaiting Goods Receipt",
  awaiting_approval: "Awaiting Approval",
  duplicate: "Duplicate",
  disputed: "Disputed",
  other: "Other",
};

export const PURCHASE_INVOICE_FISCAL_BASE_LABELS: Record<PurchaseInvoiceFiscalBase, string> = {
  booking_date: "Booking Date",
  document_date: "Document Date",
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  eur: "Euro",
  usd: "Dollar",
  gbp: "Pond",
  hkd: "HK-Dollar",
};
