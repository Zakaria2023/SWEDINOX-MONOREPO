import type {
  AddressCategory,
  AvailableAt,
  CommunicationSettingDocumentType,
  CommunicationSettingShape,
  CommunicationSettingType,
  MachineCapacityUnit,
  MachineLoadingType,
  MachineOptionType,
  MachineProductionType,
  CompanyLang,
  CompanyRole,
  ContactCategory,
  ContactSalutation,
  ContractableRole,
  ContractType,
  InvoicePaymentTerm,
  InvoiceSurchargeDescription,
  InvoiceVatScenario,
  TextUsageCategory,
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

export const MACHINE_OPTION_LABELS: Record<MachineOptionType, string> = {
  decoilen: "Decoilen",
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
  kanten: "Kanten",
  polished: "Polished",
  punching: "Punching",
  slitting: "Slitting",
  rolling: "Rolling",
  stempelen: "Stempelen",
  zagen: "Zagen",
};

export const MACHINE_PRODUCTION_LABELS: Record<MachineProductionType, string> = {
  decoiler: "Decoiler",
  interne_wzh: "Interne wzh",
  knip: "Knip",
  laser_1: "Laser 1",
  laser_2: "Laser 2",
  slijpen_folien: "Slijpen/Folien",
};

export const MACHINE_LOADING_LABELS: Record<MachineLoadingType, string> = {
  load: "Load",
};

export const MACHINE_CAPACITY_UNIT_CODES: Record<MachineCapacityUnit, string> = {
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
  regel: "Regel",
  st: "ST",
  tn: "TN",
};

export const MACHINE_CAPACITY_UNIT_LABELS: Record<MachineCapacityUnit, string> = {
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
  regel: "Line",
  st: "Pieces",
  tn: "Tonnage",
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
