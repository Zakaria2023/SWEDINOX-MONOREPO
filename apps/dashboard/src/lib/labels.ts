import type {
  AddressCategory,
  AvailableAt,
  CommunicationSettingDocumentType,
  CommunicationSettingShape,
  CommunicationSettingType,
  CompanyLang,
  CompanyRole,
  ContractableRole,
  ContractType,
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
  toeslagen: "Toeslagen",
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
