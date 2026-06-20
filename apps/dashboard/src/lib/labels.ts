import type {
  AddressCategory,
  AvailableAt,
  CommunicationSettingDocumentType,
  CommunicationSettingShape,
  CommunicationSettingType,
  CompanyLang,
  CompanyRole,
  ContactCategory,
  ContactSalutation,
  ContractableRole,
  ContractType,
  TextUsageCategory,
  WarehouseAddress,
  WarehouseBlockReason,
  WarehouseLoadingLocation,
  WarehouseLocationType,
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
