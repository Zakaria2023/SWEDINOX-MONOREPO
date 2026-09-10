import {
  AddressCategory,
  AgeingBucket,
  ArticleGroup,
  AvailableAt,
  CeStandard,
  CertificaatOption,
  CommunicationSettingDocumentType,
  CountStockBasis,
  CustomerLabelOption,
  DeliveryTimeUnit,
  DispatchStrategy,
  MaterialFamily,
  MaterialSurfaceFinish,
  RevenueGroupKind,
  SurchargeBasis,
  PriceTierBase,
  ProductDimensionShape,
  StockLabelBreakdown,
  CommunicationSettingShape,
  CommunicationSettingType,
  CounterOrderPriority,
  CounterOrderStatus,
  MachineCapacityUnit,
  ProcessingEditing,
  MachineLoadingType,
  MachineOptionType,
  MachineProductionType,
  ProductionCapacityStatus,
  SawingLayoutFetchStatus,
  SawingStatus,
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
  CustomerGroup,
  CustomerStockReason,
  CompanyClassification,
  DevTheorWt,
  EdiOption,
  FeaturesQuality,
  GroupLinesByDescription,
  MiscellaneousOption,
  OrderOption,
  PrintProductCodes,
  QuoteOption,
  QuoteOrderInvoiceOption,
  QuoteOrderOption,
  SalesRepresentative,
  InvoiceFrequency,
  InvoicePaymentTerm,
  InvoiceSurchargeDescription,
  InvoiceDocumentType,
  InvoiceVatScenario,
  LedgerAccountType,
  InvoicingMethod,
  ProcessedOption,
  ProductQualityStandard,
  PurchaseInvoiceBlockReason,
  PurchaseInvoiceFiscalBase,
  PurchaseOrderStatus,
  PurchasingUnit,
  RevenueGroup,
  SalesUnit,
  VatCode,
  LeadTimeMethod,
  ProductShape,
  StockLabelPrintingOption,
  StockLabelType,
  StockMode,
  SfnCounterpartyRole,
  OrderSourceType,
  OrderType,
  ReservationStatus,
  ReservationType,
  StockUnit,
  StockMovementReason,
  StockMovementType,
  StockStatus,
  TextUsageCategory,
  VisitReportCategory,
  VisitReportContactMethod,
  VisitReportReason,
  WarehouseAddress,
  WarehouseBlockReason,
  WarehouseCountStockType,
  WarehouseLoadingLocation,
  WarehouseLocationType,
  WarehouseProductType,
  WarehouseTransportRegion,
  WarehouseType,
  TransportMode,
  ReminderStage,
  ReturnOrderReason,
  ReturnOrderStatus,
  OrderDeblockType,
  PurchaseReturnOrderReason,
  OrderMethod,
  OrderStatus,
  OrderItemStatus,
  OrderLineStatus,
  DeliveryStatus,
  DeliveryTerm,
  TransporterCountry,
  TransporterPriceUnit,
  OrderWeightType,
  PaymentMethod,
  PurchaseCompanyType,
  PurchaseQuoteStatus,
  PurchaseRequestStatus,
  PurchaseOrderType,
  ComplaintType,
  ComplaintCategory,
  ComplaintReport,
  ComplaintStatus,
  ComplaintCause,
  ComplaintSolution,
  StickerPerPickWorkorderType,
  PrinterName,
  PrinterEntry,
  CountWorkorderMethod,
  WorkorderReleaseMethod,
  WorkorderPrintMethod,
  WorkorderSlipType,
  WorkorderProcessingMethod,
  WorkOrderStatus,
  WarehouseWorkOrderType,
  TripStatus,
  ReceiptStatus,
  PackagingType,
  RemainderCategory,
} from "@/lib/enums";

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
  allowances: "Allowances",
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

export const CONTRACT_SURCHARGE_PER_TYPE_LABELS: Record<
  ContractSurchargePerType,
  string
> = {
  order_line: "Order Line",
  group_product: "Group Product",
  product_group: "Product Group",
};

export const CONTRACT_DISCOUNT_BASED_ON_LABELS: Record<
  ContractDiscountBasedOnType,
  string
> = {
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

export const SALES_REPRESENTATIVE_LABELS: Record<SalesRepresentative, string> =
  {
    arian_bloks: "Arian Bloks",
    bnl: "BNL",
    cherice_van_rooyen: "Cherice van Rooyen",
    export: "Export",
    guy_mambourg: "Guy Mambourg",
    hego: "Hego",
  };

export const DEV_THEOR_WT_LABELS: Record<DevTheorWt, string> = {
  theoretical_weight: "Theoretical weight",
  trade_weight: "Trade weight",
  german_trade_weight: "German trade weight",
  weighed: "Weighed",
};

export const GROUP_LINES_BY_DESCRIPTION_LABELS: Record<
  GroupLinesByDescription,
  string
> = {
  order_of_order_lines: "Print in order of order lines, without titles",
  alphabetical_order: "Group by description, alphabetical order",
  lowest_order_line: "Group by description, order of lowest order line",
  print_group_titles: "Print group titles in order of order lines",
};

export const PRINT_PRODUCT_CODES_LABELS: Record<PrintProductCodes, string> = {
  do_not_print: "Do not print product code",
  print_easy2trade: "Print easy2trade product code",
  print_company: "Print company product code",
};

export const MISCELLANEOUS_OPTION_LABELS: Record<MiscellaneousOption, string> =
  {
    occasional_customer: "Occasional customer",
    customer_has_login_code: "Customer has login code for website",
    bill_of_ladings_per_order: "Bill of ladings per order",
    print_waybills: "Print waybills",
    consignment_customer: "Consignment customer",
    neutral_labels: "Neutral labels",
    label_per_sawed_piece: "Label per sawed piece",
  };

export const QUOTE_ORDER_OPTION_LABELS: Record<QuoteOrderOption, string> = {
  reference_required: "Reference required",
  complete_delivery: "Complete delivery",
  round_weight_per_piece_up: "Round weight per piece up",
  certificate: "Certificate",
  overlength: "Overlength",
  default_pickup: "Default pickup",
};

export const QUOTE_ORDER_INVOICE_OPTION_LABELS: Record<
  QuoteOrderInvoiceOption,
  string
> = {
  do_not_print_prices: "Do not print prices",
  total_amount_per_line: "Total amount per line",
  condensing_options: "Condensing options",
  include_option_prices_in_material_prices:
    "Include option prices in material prices",
};

export const ORDER_OPTION_LABELS: Record<OrderOption, string> = {
  net_prices_only: "Net prices only",
  scrap_surcharge_separately: "Scrap surcharge separately",
  no_commercial_blocking: "No commercial blocking",
  no_financial_blockage: "No financial blockage",
  call_off_quantities_on_call_off_confirmation:
    "Call-off quantities on call-off confirmation",
  backorders_on_order_confirmation: "Backorders on the order confirmation",
};

export const QUOTE_OPTION_LABELS: Record<QuoteOption, string> = {
  net_prices_only: "Net prices only",
  scrap_surcharge_separate: "Scrap surcharge separate",
  no_commercial_blocking: "No commercial blocking",
  no_financial_blockage: "No financial blockage",
  dont_show_at_all: "Don't show at all",
};

export const EDI_OPTION_LABELS: Record<EdiOption, string> = {
  product_features: "Product features",
  send_pdf: "Send PDF",
};

export const VISIT_REPORT_CONTACT_METHOD_LABELS: Record<
  VisitReportContactMethod,
  string
> = {
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

export const WAREHOUSE_TYPE_LABELS: Record<WarehouseType, string> = {
  warehouse: "Warehouse",
  location: "Location",
};

export const WAREHOUSE_ADDRESS_LABELS: Record<WarehouseAddress, string> = {
  hego_almere: "Bolderweg 10, 1332AT, Almere",
  port_of_rotterdam: "Wilhelminakade 909, 3072AP, Rotterdam",
  port_of_antwerp: "Zaha Hadidplein 1, 2030, Antwerp",
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

export const WAREHOUSE_COUNT_STOCK_TYPE_LABELS: Record<
  WarehouseCountStockType,
  string
> = {
  technical_stock: "Technical stock",
  available_stock: "Available stock",
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
  wait_for_call: "Wait for call",
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

export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  sea_transport: "Sea transport",
  rail_transport: "Rail transport",
  road_transport: "Road transport",
  air_transport: "Air transport",
  postal_shipments: "Postal shipments",
  fixed_transport_facilities: "Fixed transport facilities (pipelines)",
  inland_waterway_transport: "Inland waterway transport",
  own_power: "Own power",
};

export const RETURN_ORDER_REASON_LABELS: Record<ReturnOrderReason, string> = {
  wrong_delivery: "Wrong delivery",
  damaged_goods: "Damaged goods",
  quality_issue: "Quality issue",
  wrong_order: "Wrong order",
  excess_delivery: "Excess delivery",
  customer_changed_mind: "Customer changed mind",
  other: "Other",
};

export const ORDER_DEBLOCK_TYPE_LABELS: Record<OrderDeblockType, string> = {
  financial: "Financial",
  invoice: "Invoice",
  transport: "Transport",
  handling: "Handling",
};

export const PURCHASE_RETURN_ORDER_REASON_LABELS: Record<
  PurchaseReturnOrderReason,
  string
> = {
  damaged: "Damaged",
  wrong_quantity: "Wrong quantity",
  wrong_material_delivered: "Wrong material delivered",
  delivered_too_late: "Delivered too late",
  not_delivered: "Not delivered",
  transport_damage: "Transport damage",
  incorrect_delivery_address: "Incorrect delivery address",
};

export const RETURN_ORDER_STATUS_LABELS: Record<ReturnOrderStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  received: "Received",
  credited: "Credited",
  cancelled: "Cancelled",
};

export const MACHINE_OPTION_LABELS: Record<MachineOptionType, string> = {
  decoiling: "Decoiling",
  grinding: "Grinding",
  shear_cut: "ShearCut",
  laser: "Laser",
  duplo: "Duplo",
  brushing: "Brushing",
  blue_foil: "Blue Foil",
  laser_foil: "Laser Foil",
  uv_foil: "UV Foil",
  remove_foil: "Remove Foil",
  anodizing: "Anodizing",
  pickling: "Pickling",
  coating: "Coating",
  embossing: "Embossing",
  perforate: "Perforate",
  bending: "Bending",
  polished: "Polished",
  punching: "Punching",
  slitting: "Slitting",
  rolling: "Rolling",
  stamping: "Stamping",
  sawing: "Sawing",
};

export const MACHINE_PRODUCTION_LABELS: Record<MachineProductionType, string> =
  {
    decoiler: "Decoiler",
    internal_processing: "Internal processing",
    shearing: "Shearing",
    laser_1: "Laser 1",
    laser_2: "Laser 2",
    grinding_foiling: "Grinding/Foiling",
  };

export const MACHINE_LOADING_LABELS: Record<MachineLoadingType, string> = {
  load: "Load",
};

export const MACHINE_CAPACITY_UNIT_CODES: Record<MachineCapacityUnit, string> =
  {
    percent: "%",
    amount: "Amount",
    hk: "HK",
    hm: "HM",
    hs: "HS",
    kg: "KG",
    m1: "M1",
    m2: "M2",
    m3: "M3",
    mm: "MM",
    line: "Line",
    st: "ST",
    tn: "TN",
  };

export const MACHINE_CAPACITY_UNIT_LABELS: Record<MachineCapacityUnit, string> =
  {
    percent: "Percent",
    amount: "Amount",
    hk: "One hundred kilograms",
    hm: "One hundred meters",
    hs: "One hundred pieces",
    kg: "Kilogram",
    m1: "Meter",
    m2: "Square meters",
    m3: "Cubic meters",
    mm: "Millimeter",
    line: "Line",
    st: "Pieces",
    tn: "Tonnage",
  };

export const PROCESSING_EDITING_LABELS: Record<ProcessingEditing, string> = {
  stamping: "Stamping",
  polished: "Polished",
  paper_interleaving: "Paper interleaving",
  pickling: "Pickling",
  laser: "Laser",
  blue_foil: "Blue Foil",
  bending: "Bending",
  uv_foil: "UV Foil",
  rolling: "Rolling",
  anodizing: "Anodizing",
  slitting: "Slitting",
  brushing: "Brushing",
  remove_foil: "Remove Foil",
  certificate_2_1: "2.1 Certificate",
  sawing: "Sawing",
  coating: "Coating",
  punching: "Punching",
  grinding: "Grinding",
  decoiling: "Decoiling",
  duplo: "Duplo",
  embossing: "Embossing",
  shear_cut: "ShearCut",
  laser_foil: "Laser Foil",
  perforate: "Perforate",
  certificate_3_1: "3.1 Certificate",
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

export const INVOICE_SURCHARGE_DESCRIPTION_LABELS: Record<
  InvoiceSurchargeDescription,
  string
> = {
  project_discount: "Project discount",
  certificate_costs: "Certificate costs",
  cutting_surcharge: "Cutting surcharge",
  decoil_surcharge: "Decoil surcharge",
  order_surcharge: "Order surcharge",
  packaging_surcharge: "Packaging surcharge",
  pallet_surcharge: "Pallet surcharge",
  administration_costs: "Administration costs",
  transport_costs: "Transport costs",
  transport_costs_internal: "Transport costs Internal",
  maut_costs: "Maut costs",
  return_costs: "Return costs",
  import_costs: "Import costs",
  costs: "Costs",
  other: "Other",
  purchasing_rounding_differences: "Purchasing rounding differences",
  credit_notes_to_be_received_third_party:
    "Credit notes still to be received (3rd party)",
  credit_notes_to_be_received: "Credit notes still to be received",
  eu_import_duties: "EU Import duties",
  price_differences: "Price differences",
  price_differences_eu_non_eu: "Price differences EU - Non EU",
  external_transport: "External transport",
};

export const INVOICE_VAT_SCENARIO_LABELS: Record<InvoiceVatScenario, string> = {
  purchase_domestically: "Purchase domestically",
  domestic_purchase_vat_shifted: "Domestic purchase VAT shifted",
  purchase_within_eu_with_reverse_charge:
    "Purchase within EU with reverse charge",
  purchase_outside_eu_with_reverse_charge:
    "Purchase outside the EU with reverse charge",
  domestic_sales: "Domestic sales",
  sales_within_eu_with_reverse_charge: "Sales within EU with reverse charge",
  sales_outside_eu_with_reverse_charge:
    "Sales outside the EU with a reverse charge",
};

export const INVOICE_DOCUMENT_TYPE_LABELS: Record<InvoiceDocumentType, string> =
  {
    invoice: "Invoice",
    credit_note: "Credit note",
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
  "20pct_prepayment_rest_before_shipping":
    "20% Prepayment, Rest Before Shipping",
  "25pct_prepayment_rest_before_shipping":
    "25% Prepayment, Rest Before Shipping",
  "20pct_advance_payment_remainder_copy_bl":
    "20% advance payment, remainder copy BL",
  "30pct_advance_payment_remainder_copy_bl":
    "30% advance payment, remainder copy BL",
  "5pct_prepayment_balance_30_days_copy_bl":
    "5% Prepayment, balance 30 days copy BL",
  "50pct_in_advance_remainder_14_days_after_arrival_at_port":
    "50% in advance, remainder 14 days after arrival at port",
  "5pct_prepayment_balance_60_days_copy_bl":
    "5% Prepayment, balance 60 days copy BL",
  "50pct_prepayment_remaining_15_days_after_shipment":
    "50% Prepayment, Remaining 15 days after shipment",
  prepayment_minus2pct_discount: "Prepayment -2% Discount",
  lc_180_days: "L/C 180 days",
  lc_90_days: "L/C 90 days",
  to_be_determined: "To be determined",
  immediately_after_receipt_of_goods: "Immediately after receipt of goods",
  payment_in_settlement: "Payment in settlement",
  direct_debit: "Direct Debit",
};

export const INVOICING_METHOD_LABELS: Record<InvoicingMethod, string> = {
  per_delivery: "per delivery",
  per_order: "per Order",
  per_order_line: "per Order line",
};

export const INVOICE_FREQUENCY_LABELS: Record<InvoiceFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
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
  M3: "Cubic meters",
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

export const SFN_COUNTERPARTY_ROLE_LABELS: Record<SfnCounterpartyRole, string> =
  {
    producer: "Producer / mill",
    sfn_member: "SFN member",
    non_member: "Non-member",
  };

export const STOCK_UNIT_LABELS: Record<StockUnit, string> = {
  kg: "KG",
  st: "ST",
  m1: "M1",
  m2: "M2",
  m3: "M3",
  mm: "MM",
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  normal: "Normal",
  call_off: "Call-off",
  rush: "Rush",
};

export const ORDER_SOURCE_TYPE_LABELS: Record<OrderSourceType, string> = {
  stock: "Stk",
  stock_and_cross_dock: "Stk+CD",
  cross_dock: "CD",
};

export const RESERVATION_TYPE_LABELS: Record<ReservationType, string> = {
  sale: "Sale",
  purchase: "Purchase",
  scrap: "Scrap",
};

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  definitive: "Definitive",
  provisional: "Provisional",
  temporary: "Temporary",
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

export const STOCK_LABEL_PRINTING_LABELS: Record<
  StockLabelPrintingOption,
  string
> = {
  per_line_bundle: "Per line/bundle",
  per_bundle: "Per bundle or per",
  amount_per_line: "Amount (per line)",
};

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  pending: "Pending",
  received: "Received",
  cancelled: "Cancelled",
};

export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  in: "In",
  out: "Out",
};

export const LEDGER_ACCOUNT_TYPE_LABELS: Record<LedgerAccountType, string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expense",
};

export const STOCK_MOVEMENT_REASON_LABELS: Record<StockMovementReason, string> =
  {
    purchase_receipt: "Purchase Receipt",
    invoice_consumption: "Invoice Consumption",
    purchase_order_cancelled: "Purchase Order Cancelled",
    invoice_cancelled: "Invoice Cancelled",
    sale_consumption: "Sale Consumption",
    sale_invoice_cancelled: "Sale Invoice Cancelled",
    manual_correction: "Manual Correction",
    count_correction: "Count Correction",
    damaged: "Damaged / Written Off",
    production_input: "Production Input",
    production_output: "Production Output",
    production_remnant: "Production Remnant",
    sawing_waste: "Sawing Waste",
    sales_return: "Sales Return",
    purchase_return: "Purchase Return",
    warehouse_receipt: "Warehouse Receipt",
    warehouse_issue: "Warehouse Issue",
    warehouse_transfer: "Warehouse Transfer",
    warehouse_scrapped: "Scrapped",
    external_processing_return: "Returned from Processor",
    data_conversion: "Opening Balance (Conversion)",
  };

export const CUSTOMER_LABEL_OPTION_LABELS: Record<CustomerLabelOption, string> =
  {
    csv_file: "CSV file",
    line_label: "Line Label",
    no_customer_label: "No Customer Label",
    sticker_per_collo: "Sticker per collo",
    sticker_per_line: "Sticker per line",
    sticker_per_piece: "Sticker per piece",
  };

export const PURCHASING_UNIT_LABELS: Record<PurchasingUnit, string> = {
  HK: "One hundred kilograms",
  HM: "One hundred meters",
  HS: "One hundred pieces",
  KG: "Kilogram",
  M1: "Meter",
  MM: "Millimeter",
  ST: "Pieces",
  TN: "Tonnage",
};

export const DELIVERY_TIME_UNIT_LABELS: Record<DeliveryTimeUnit, string> = {
  months: "Months",
  weeks: "Weeks",
  working_days: "Working Days",
};

export const PROCESSED_OPTION_LABELS: Record<ProcessedOption, string> = {
  D: "Decoiling",
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
  KNT: "Bending",
  POL: "Polished",
  PON: "Punching",
  SLI: "Slitting",
  WAL: "Rolling",
  STP: "Stamping",
  Z: "Sawing",
};

export const CE_STANDARD_LABELS: Record<CeStandard, string> = {
  en_10255: "EN 10255",
  en_10219_1: "EN 10219-1",
  en_10210_1: "EN 10210-1",
  en_10025_1: "EN 10025-1",
};

export const PRODUCT_QUALITY_STANDARD_LABELS: Record<
  ProductQualityStandard,
  string
> = {
  en_10025_2: "EN 10025-2",
  en_10219_1: "EN 10219-1",
};

export const FEATURES_QUALITY_LABELS: Record<FeaturesQuality, string> = {
  "115CrV3": "115CrV3",
  "11SMn30+C/SH": "11SMn30+C/SH",
  "11SMnPb30+C/SH": "11SMnPb30+C/SH",
  "300-serie": "300 series",
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
  "304DIV": "EN 1.4301 Miscellaneous",
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
  "304POL": "EN 1.4301 Polished",
  "304SB": "EN 1.4301 SB",
  "304-serie": "304 series",
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
  "316LWGW": "EN 1.4404 Hot-rolled",
  "316-serie": "316 series",
  "316T": "EN 1.4571",
  "316T1D": "EN 1.4571 1D",
  "316T2B": "EN 1.4571 2B",
  "316T2D": "EN 1.4571 2D",
  "316T2E": "EN 1.4571 2E",
  "316TBA": "EN 1.4571 BA",
  "316TWGW": "EN 1.4571 Hot-rolled",
  "321": "EN 1.4541",
  "3211D": "EN 1.4541 1D",
  "3212B": "EN 1.4541 2B",
  "321WGW": "EN 1.4541 Hot-rolled",
  "34CrNiMo6+QT": "34CrNiMo6+QT",
  "40031D": "EN 1.4003 1D",
  "400-serie": "400 series",
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
  A1050: "EN AW 1050",
  A1050H111: "EN AW 1050 H111",
  A1050H22: "EN AW 1050 H22",
  A1050H24: "EN AW 1050 H24",
  A105N: "A105N",
  "A106 Grade B": "A106 Grade B",
  "A234 Grade WPB": "A234 Grade WPB",
  A3103: "EN AW 3103",
  "A3103 H14": "EN AW 3103 H14",
  A5005: "EN AW 5005",
  A5005H111: "EN AW 5005 H111",
  A5005H14: "EN AW 5005 H14",
  A5005H22: "EN AW 5005 H22",
  A5005H24: "EN AW 5005 H24",
  A5083: "EN AW-5083",
  A5083H111: "EN AW-5083 H111",
  A5083H22: "EN AW-5083 H22",
  A5083H24: "EN AW-5083 H24",
  A5754: "EN AW 5754",
  A5754H111: "EN AW 5754 H111",
  A5754H22: "EN AW 5754 H22",
  A5754H24: "EN AW 5754 H24",
  A5754O2TR: "EN AW 5754 O2 TR",
  A5754O5TR: "EN AW 5754 O5 TR",
  A6082: "EN AW 6082",
  A6082T6: "EN AW 6082 T6",
  AlCuBiPb: "EN AW 2011 - 28ST",
  AlCuMgPb: "EN AW 2007",
  "AlMg4.5Mn0.7": "EN AW 5083",
  "AlMgSi0.5": "EN AW 6060 - 50ST",
  AlMgSi1: "EN AW 6082 - 51ST",
  Alu: "Alu",
  "B500A-HKN": "B500A-HKN",
  "B500B-HWL": "B500B-HWL",
  C15R: "C15R",
  C22: "C22",
  "C35+C/SH": "C35+C/SH",
  C35R: "C35R",
  C45: "C45",
  "C45+C": "C45+C",
  "C45+C/SH": "C45+C/SH",
  "C45+N": "C45+N",
  "C45+SL": "C45+SL",
  C60R: "C60R",
  C85S: "C85S",
  DC01: "DC01",
  "DC01+ZE25/25APC": "DC01+ZE25/25APC",
  "DC01-Am": "DC01-Am",
  "DX51D+Z275MAC": "DX51D+Z275MAC",
  E195: "E195",
  E220: "E220",
  "E-Cu": "E-Cu",
  "HA-serie": "HA series",
  "Laserpress 240": "Laserpress 240",
  Ms58: "Ms58",
  Ms63: "Ms63",
  P195T: "P195T",
  P235GH: "P235GH",
  P235TR1: "P235TR1",
  P250GH: "P250GH",
  Rg12: "Rg12",
  Rg7: "Rg7",
  S195T: "S195T",
};

export const ORDER_METHOD_LABELS: Record<OrderMethod, string> = {
  telephone: "Telephone",
  email: "E-Mail",
  counter: "Counter",
  representative: "Representative",
  oral: "Oral",
  website: "Website",
  edi: "EDI",
  ai_read_email: "AI-read Email",
};

export const ORDER_LINE_STATUS_LABELS: Record<OrderLineStatus, string> = {
  provisional: "Provisional",
  in_progress: "In progress",
  released: "Released",
  checked: "Checked",
  partially_delivered: "Partially delivered",
  delivered: "Delivered",
  partially_invoiced: "Partially invoiced",
  invoiced: "Invoiced",
  cancelled: "Cancelled",
};

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  not_ready: "Not ready",
  ready: "Ready",
  released: "Released",
  delivered: "Delivered",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  open: "Open",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ORDER_ITEM_STATUS_LABELS: Record<OrderItemStatus, string> = {
  reserved: "Reserved",
  delivered: "Delivered",
  invoiced: "Invoiced",
  returned: "Returned",
  cancelled: "Cancelled",
};

export const DELIVERY_TERM_LABELS: Record<DeliveryTerm, string> = {
  exw: "(EXW) Ex works",
  fca: "(FCA) Free carrier",
  fob: "(FOB) Free on board",
  cfr: "(CFR) Cost and freight",
  cif: "(CIF) Cost, insurance and freight",
  cpt: "(CPT) Carriage paid to",
  cip: "(CIP) Carriage and insurance paid to",
  dap: "(DAP) Delivery at place",
  dpu: "(DPU) Delivered at Place Unloaded",
  ddp: "(DDP) Delivery duty paid",
};

export const ORDER_WEIGHT_TYPE_LABELS: Record<OrderWeightType, string> = {
  theoretical_weight: "Theoretical weight",
  trade_weight: "Trade weight",
  german_trade_weight: "German trade weight",
  weighed: "Weighed",
};

export const TRANSPORTER_PRICE_UNIT_LABELS: Record<
  TransporterPriceUnit,
  string
> = {
  amount: "Amount",
  per_km: "Per KM",
  per_kg: "Per KG",
  percentage: "Percentage",
};

export const TRANSPORTER_COUNTRY_LABELS: Record<TransporterCountry, string> = {
  A: "Austria",
  AE: "United Arab Emirates",
  AN: "Netherlands Antilles",
  AZ: "Azerbaijan",
  B: "Belgium",
  BAN: "Bangladesh",
  BE2: "BE2",
  BG: "Bulgaria",
  BR: "Brazil",
  BY: "Belarus",
  CDN: "Canada",
  CH: "Switzerland",
  CL: "Sri Lanka",
  CN: "China",
  CR: "Czech Republic",
  CW: "Curacao",
  CY: "Cyprus",
  CZ: "Czechia",
  D: "Germany",
  DK: "Denmark",
  E: "Spain",
  EE: "Estonia",
  ES2: "ES2",
  ET: "Egypt",
  F: "France",
  FIN: "Finland",
  FL: "Liechtenstein",
  GB: "United Kingdom",
  GB2: "GB2",
  GE: "Georgia",
  GR: "Greece",
  H: "Hungary",
  HEG: "HEG",
  HK: "Hong Kong",
  I: "Italy",
  IND: "India",
  IR: "Iran",
  IRL: "Ireland",
  KR: "South Korea",
  KRO: "Croatia",
  L: "Luxembourg",
  LT: "Lithuania",
  LV: "Latvia",
  MA: "Morocco",
  MAL: "Malaysia",
  MK: "Macedonia",
  NL: "Netherlands",
  NO: "Norway",
  P: "Portugal",
  PK: "Pakistan",
  PL: "Poland",
  RC: "Taiwan",
  RO: "Romania",
  ROK: "South Korea",
  RUS: "Russia",
  S: "Sweden",
  SGP: "Singapore",
  SK: "Slovakia",
  SLO: "Slovenia",
  SME: "Suriname",
  SRB: "Serbia",
  SVN: "SVN",
  SYR: "Syria",
  TR: "Turkey",
  UA: "Ukraine",
  uk: "UK",
  USA: "USA",
  VN: "Vietnam",
  ZA: "South Africa",
};

export const COUNTER_ORDER_STATUS_LABELS: Record<CounterOrderStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  delivered: "Delivered",
  invoiced: "Invoiced",
  cancelled: "Cancelled",
};

export const COUNTER_ORDER_PRIORITY_LABELS: Record<
  CounterOrderPriority,
  string
> = {
  normal: "Normal",
  rush: "Rush",
};

export const PURCHASE_ORDER_TYPE_LABELS: Record<PurchaseOrderType, string> = {
  materials: "Materials",
  processing: "Processing",
  customer_materials: "Customer Materials",
};

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> =
  {
    provisional: "Provisional",
    open: "Open",
    confirmed: "Confirmed",
    pre_notified: "Pre-notified",
    completed: "Completed",
    cancelled: "Cancelled",
  };

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Bank transfer",
  direct_debit: "Direct debit",
  cash: "Cash",
  card: "Card",
  offset: "Offset",
};

export const PURCHASE_REQUEST_STATUS_LABELS: Record<
  PurchaseRequestStatus,
  string
> = {
  draft: "Draft",
  sent: "Sent",
  quoted: "Quoted",
  awarded: "Awarded",
  cancelled: "Cancelled",
};

export const PURCHASE_QUOTE_STATUS_LABELS: Record<PurchaseQuoteStatus, string> =
  {
    open: "Open",
    received: "Received",
    awarded: "Awarded",
    lost: "Lost",
    expired: "Expired",
  };

export const PURCHASE_COMPANY_TYPE_LABELS: Record<PurchaseCompanyType, string> =
  {
    supplier: "Supplier",
    agent: "Agent",
  };

export const CUSTOMER_GROUP_LABELS: Record<CustomerGroup, string> = {
  warehouse_staff: "Warehouse Staff",
  regional_trade: "Regional Trade",
  commission_external: "Commission (External)",
  maritime: "Maritime",
  food_industry: "Food Industry",
  agricultural: "Agricultural",
  water_purification: "Water Purification",
  dealer: "Dealer",
  equipment_manufacturing_external: "Equipment Manufacturing (External)",
  contract_work_external: "Contract Work (External)",
  construction: "Construction",
  building: "Building",
  user_external: "User (External)",
  tank_construction: "Tank Construction",
  equipment_manufacturing: "Equipment Manufacturing",
  service: "Service",
  contract_work_internal: "Contract Work (Internal)",
  cutting_company: "Cutting Company",
  trade_external: "Trade (External)",
  end_user: "End User",
  consultancies: "Consultancies",
  aluminium_processing: "Aluminium Processing",
  auto_bicycle_garage: "Auto, Bicycle & Garage",
  trailer_construction: "Trailer Construction",
  tree_nurseries: "Tree Nurseries",
  construction_contracting: "Construction & Contracting",
  flower_growers: "Flower Growers",
  building_materials_trade: "Building Materials Trade",
  reinforcing_steel_bending: "Reinforcing Steel Bending",
  camping_recreation: "Camping & Recreation",
  caravan_camping_articles: "Caravan & Camping Articles",
  bodywork_light: "Bodywork (Light)",
  construction_companies_light: "Construction Companies (Light)",
  construction_companies_heavy: "Construction Companies (Heavy)",
  container_construction: "Container Construction",
  cooperatives: "Cooperatives",
  cultural_environmental_tech: "Cultural & Environmental Tech",
  hvac_sanitary_air: "HVAC, Sanitary & Air",
  roofing: "Roofing",
  defense: "Defense",
  animal_parks: "Animal Parks",
  miscellaneous: "Miscellaneous",
  electrotechnical: "Electrotechnical",
  consumer_goods_manufacturers: "Consumer Goods Manufacturers",
  various_manufacturers: "Various Manufacturers",
  mink_farmers: "Mink Farmers",
  government: "Government",
  tool_makers: "Tool Makers",
  technical_trading: "Technical Trading",
  various_trading: "Various Trading",
  fencing_industry: "Fencing Industry",
  wood_industry_carpentry: "Wood Industry & Carpentry",
  purchasing_combinations: "Purchasing Combinations",
  installation_companies: "Installation Companies",
  refrigeration_technology: "Refrigeration Technology",
  agriculture_livestock: "Agriculture & Livestock",
  agricultural_mechanization: "Agricultural Mechanization",
  welding_companies: "Welding Companies",
  contracting_companies: "Contracting Companies",
  contract_sawing: "Contract Sawing",
  machine_factories: "Machine Factories",
  warehouse_fitters: "Warehouse Fitters",
  market_stand_tent: "Market, Stand & Tent",
  metal_furniture: "Metal Furniture",
  assembly_companies: "Assembly Companies",
  utilities: "Utilities",
  private_individuals: "Private Individuals",
  pipeline_companies: "Pipeline Companies",
  sheet_metal_processing: "Sheet Metal Processing",
  stainless_steel_processing: "Stainless Steel Processing",
  gabion_baskets: "Gabion Baskets",
  schools_training: "Schools & Training",
  shipbuilding: "Shipbuilding",
  smithies: "Smithies",
  social_employment: "Social Employment",
  steel_trade: "Steel Trade",
  stable_construction: "Stable Construction",
  blasting_coating: "Blasting & Coating",
  transport_companies: "Transport Companies",
  rental_companies: "Rental Companies",
  horticulture: "Horticulture",
  garden_centers: "Garden Centers",
  road_water_construction: "Road & Water Construction",
  hardware_stores: "Hardware Stores",
  care_homes: "Care Homes",
};

export const COMPANY_CLASSIFICATION_LABELS: Record<
  CompanyClassification,
  string
> = {
  A: "Major customer",
  B: "Medium customer",
  C: "Small customer",
};

export const VISIT_REPORT_CATEGORY_LABELS: Record<VisitReportCategory, string> =
  {
    wishing_next_visit: "Wishing you next visit",
    following_complaint: "Following a complaint",
    acquisition: "Acquisition",
  };

export const COMPLAINT_TYPE_LABELS: Record<ComplaintType, string> = {
  counter_order: "Counter order",
  general: "General",
  order: "Order",
  purchase_order: "Purchase order",
  purchase_quote: "Purchase quote",
  quote: "Quote",
  return_order: "Return Order",
};

export const COMPLAINT_CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  damaged: "Damaged",
  wrong_price_calculated: "Wrong price calculated",
  wrong_quantity: "Wrong quantity",
  wrong_material_delivered: "Wrong material delivered",
  delivered_too_late: "Delivered too late",
  transport_damage: "Transport damage",
  incorrect_delivery_address: "Incorrect delivery address",
};

export const COMPLAINT_REPORT_LABELS: Record<ComplaintReport, string> = {
  telephone: "Telephone",
  email: "E-Mail",
  counter: "Counter",
  representative: "Representative",
  oral: "Oral",
  website: "Website",
  edi: "EDI",
  ai_read_email: "AI-read Email",
};

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  new: "New",
  in_progress: "In progress",
  on_hold: "On hold",
  done: "Done",
};

export const COMPLAINT_CAUSE_LABELS: Record<ComplaintCause, string> = {
  warehouse: "Warehouse",
  production: "Production",
  purchasing: "Purchasing",
  sale: "Sale",
  transportation: "Transportation",
  customer: "Customer",
  supplier: "Supplier",
  processor: "Processor",
};

export const COMPLAINT_SOLUTION_LABELS: Record<ComplaintSolution, string> = {
  collect_goods_back_credit: "Collect goods back + credit",
  return_goods_credit_redeliver: "Return goods + credit + redeliver",
  price_correction: "Price correction",
  subsequent_delivery: "Subsequent delivery",
  complaint_rejected: "Complaint rejected",
  material_retained_correct_delivery: "Material is retained + correct delivery",
};

export const STICKER_PER_PICK_WORKORDER_LABELS: Record<
  StickerPerPickWorkorderType,
  string
> = {
  no_customer_label: "No Customer Label",
  sticker_per_workorder_600dpi: "Sticker per workorder (600dpi)",
  sticker_per_workorder_line_600dpi: "Sticker per workorder line (600dpi)",
};

export const PRINTER_NAME_LABELS: Record<PrinterName, string> = {
  microsoft_print_to_pdf_8_redirected: "Microsoft Print to PDF (8 redirected)",
  onenote_desktop_8_redirected: "OneNote (Desktop) (8 redirected)",
  send_to_onenote_16: "Send to OneNote 16",
  sales_black: "Sales black",
  sales_color: "Sales color",
  sato_cl4nx_203dpi: "SATO CL4NX 203dpi",
  sato_cl408e_logistics: "SATO CL408e - Logistics",
  onenote_desktop: "OneNote (Desktop)",
  microsoft_print_to_pdf: "Microsoft Print to PDF",
  logistics_black: "Logistics black",
  logistics_color: "Logistics color",
  administration_black: "Administration black",
  administration_color: "Administration color",
};

export const PRINTER_ENTRY_LABELS: Record<PrinterEntry, string> = {
  select_automatically: "Select automatically",
  manual_feed: "Manual feed",
  tray_1: "Tray 1",
  tray_2: "Tray 2",
  tray_3: "Tray 3",
  tray_4: "Tray 4",
  tray_5: "Tray 5",
};

export const COUNT_WORKORDER_METHOD_LABELS: Record<
  CountWorkorderMethod,
  string
> = {
  counting_locations: "Counting Locations",
  products_counting: "Products Counting",
};

export const WORKORDER_RELEASE_METHOD_LABELS: Record<
  WorkorderReleaseMethod,
  string
> = {
  direct: "Direct",
  according_to_schedule: "According to Schedule",
  manual: "Manual",
};

export const WORKORDER_PRINT_METHOD_LABELS: Record<
  WorkorderPrintMethod,
  string
> = {
  manual: "Manual",
  automatic: "Automatic",
  do_not_print: "Do Not Print",
};

export const WORKORDER_SLIP_TYPE_LABELS: Record<WorkorderSlipType, string> = {
  a4_landscape: "A4 Landscape",
  a4_portrait: "A4 Portrait",
  label: "Label",
  label_via_csv: "Label (via CSV file)",
};

export const WORKORDER_PROCESSING_METHOD_LABELS: Record<
  WorkorderProcessingMethod,
  string
> = {
  order_picking: "Order Picking",
};

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  new: "New",
  scheduled: "Scheduled",
  loading_list: "Loading list",
  loaded: "Loaded",
  loading_done: "Loading done",
  in_transit: "In transit",
  completed: "Completed",
};

export const RECEIPT_STATUS_LABELS: Record<ReceiptStatus, string> = {
  new: "New",
  released: "Released",
  workorders_created: "Workorders created",
  partially_received: "Partially received",
  received: "Received",
  invoiced: "Invoiced",
  expired: "Expired",
};

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  new: "New",
  released: "Released",
  ready: "Ready",
  approved: "Approved",
};

export const WAREHOUSE_WORK_ORDER_TYPE_LABELS: Record<
  WarehouseWorkOrderType,
  string
> = {
  arranging: "Arranging",
  counting_location: "Counting (Location)",
  counting_product: "Counting (Product)",
  fetching: "Fetching",
  picking: "Picking",
  pick_up: "Pick-up",
  relocating: "Relocating",
  restocking: "Restocking",
  scrapping: "Scrapping",
  transferring: "Transferring",
  unloading: "Unloading",
};

export const REMAINDER_CATEGORY_LABELS: Record<RemainderCategory, string> = {
  remnant: "Remnant",
  scrap: "Scrap",
};

export const PACKAGING_TYPE_LABELS: Record<PackagingType, string> = {
  p2m: "Pallet 2m",
  p2_5m: "Pallet 2.5m",
  p3m: "Pallet 3m",
  p4m: "Pallet 4m",
  euro: "Euro pallet",
  coil: "Coil",
  bundles: "Bundle(s)",
  colli: "Colli",
};

export const PURCHASE_INVOICE_BLOCK_REASON_LABELS: Record<
  PurchaseInvoiceBlockReason,
  string
> = {
  price_mismatch: "Price Mismatch",
  awaiting_goods_receipt: "Awaiting Goods Receipt",
  awaiting_approval: "Awaiting Approval",
  duplicate: "Duplicate",
  disputed: "Disputed",
  other: "Other",
};

export const PURCHASE_INVOICE_FISCAL_BASE_LABELS: Record<
  PurchaseInvoiceFiscalBase,
  string
> = {
  booking_date: "Booking Date",
  document_date: "Document Date",
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  eur: "Euro",
  usd: "Dollar",
  gbp: "Pound",
  hkd: "HK-Dollar",
};

export const CUSTOMER_STOCK_REASON_LABELS: Record<CustomerStockReason, string> =
  {
    initial_stock: "Initial stock",
    correction: "Correction",
    counting_difference: "Counting difference",
    damaged: "Damaged",
    return_from_customer: "Return from customer",
    transfer: "Transfer",
    other: "Other",
  };

export const PRODUCTION_CAPACITY_STATUS_LABELS: Record<
  ProductionCapacityStatus,
  string
> = {
  ok: "OK",
  warning: "Warning",
  full: "Full",
};

export const SAWING_LAYOUT_FETCH_STATUS_LABELS: Record<
  SawingLayoutFetchStatus,
  string
> = {
  new: "New",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const SAWING_STATUS_LABELS: Record<SawingStatus, string> = {
  new: "New",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PRODUCT_DIMENSION_SHAPE_LABELS: Record<
  ProductDimensionShape,
  string
> = {
  round: "Round",
  square: "Square",
  flat: "Flat",
  rectangular: "Rectangular",
  hexagonal: "Hexagonal",
  octagonal: "Octagonal",
  tube_round: "Tube — round",
  tube_square: "Tube — square",
  tube_rectangular: "Tube — rectangular",
  sheet: "Sheet",
  plate: "Plate",
  beam: "Beam",
  angle: "Angle",
};

export const DISPATCH_STRATEGY_LABELS: Record<DispatchStrategy, string> = {
  lifo: "LIFO",
  fifo: "FIFO",
};

export const PRICE_TIER_BASE_LABELS: Record<PriceTierBase, string> = {
  order_line: "Order line",
  group_product: "Group product",
  product_group: "Product group",
};

export const STOCK_LABEL_BREAKDOWN_LABELS: Record<StockLabelBreakdown, string> =
  {
    per_line_bundle: "Per line / bundle",
    per_bundle: "Per bundle",
    amount_per_line: "Amount (per line)",
  };

export const COUNT_STOCK_BASIS_LABELS: Record<CountStockBasis, string> = {
  technical: "Technical stock",
  available: "Available stock",
};

export const AGEING_BUCKET_LABELS: Record<AgeingBucket, string> = {
  not_due: "Not yet due",
  days_1_30: "1 – 30 days",
  days_31_60: "31 – 60 days",
  days_61_90: "61 – 90 days",
  days_over_90: "Over 90 days",
};

export const REMINDER_STAGE_LABELS: Record<ReminderStage, string> = {
  first: "First reminder",
  second: "Second reminder",
  final: "Final notice",
};

export const MATERIAL_FAMILY_LABELS: Record<MaterialFamily, string> = {
  stainless_austenitic: "Stainless — austenitic",
  stainless_ferritic: "Stainless — ferritic",
  stainless_martensitic: "Stainless — martensitic",
  stainless_heat_resistant: "Stainless — heat resistant",
  carbon_steel: "Carbon steel",
  quenched_tempered_steel: "Quenched and tempered steel",
  free_cutting_steel: "Free-cutting steel",
  tool_steel: "Tool steel",
  reinforcement_steel: "Reinforcement steel",
  coated_steel: "Coated steel",
  aluminium: "Aluminium",
  brass: "Brass",
  bronze: "Bronze",
  copper: "Copper",
};

export const MATERIAL_SURFACE_FINISH_LABELS: Record<
  MaterialSurfaceFinish,
  string
> = {
  mill: "Mill finish",
  hot_rolled_pickled: "Hot rolled, pickled (1D)",
  hot_rolled_plate: "Hot rolled plate (WGW)",
  cold_rolled_dull: "Cold rolled, dull (2D)",
  cold_rolled_bright: "Cold rolled, bright (2B)",
  cold_rolled_extra_bright: "Cold rolled, extra bright (2BB)",
  cold_rolled_descaled: "Cold rolled, descaled (2E)",
  bright_annealed: "Bright annealed (BA)",
  ground: "Ground (4N)",
  brushed: "Brushed (SB)",
  polished: "Polished",
  decorative: "Decorative",
  mixed: "Mixed finishes",
  annealed: "Annealed",
  strain_hardened: "Strain hardened",
  heat_treated: "Heat treated",
  cold_drawn: "Cold drawn",
  stress_relieved: "Stress relieved",
  electro_galvanised: "Electro-galvanised",
  hot_dip_galvanised: "Hot-dip galvanised",
};

export const SURCHARGE_BASIS_LABELS: Record<SurchargeBasis, string> = {
  fixed: "Flat amount",
  percentage: "% of the goods value",
  per_kg: "Per kilogram",
  per_line: "Per line",
  per_pallet: "Per pallet",
  per_certificate: "Per certificate",
};

export const REVENUE_GROUP_KIND_LABELS: Record<RevenueGroupKind, string> = {
  material: "Material",
  processing: "Processing",
  freight: "Freight",
  allowance: "Allowance",
  adjustment: "Adjustment",
  other: "Other",
};
