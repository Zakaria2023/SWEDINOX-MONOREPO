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
  DevTheorWt,
  EdiOption,
  GroupLinesByDescription,
  MiscellaneousOption,
  OrderOption,
  PrintProductCodes,
  QuoteOption,
  QuoteOrderInvoiceOption,
  QuoteOrderOption,
  SalesRepresentative,
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

export const SALES_REPRESENTATIVE_LABELS: Record<SalesRepresentative, string> = {
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

export const GROUP_LINES_BY_DESCRIPTION_LABELS: Record<GroupLinesByDescription, string> = {
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

export const MISCELLANEOUS_OPTION_LABELS: Record<MiscellaneousOption, string> = {
  occasional_customer: "Occasional customer",
  customer_has_login_code: "Customer has login code for website",
  bill_of_ladings_per_order: "Bill of ladings per order",
  vrachtbrieven_afdrukken: "Vrachtbrieven afdrukken",
  consignment_customer: "Consignment customer",
  neutral_labels: "Neutral labels",
  label_per_sawed_piece: "Label per sawed piece",
};

export const QUOTE_ORDER_OPTION_LABELS: Record<QuoteOrderOption, string> = {
  reference_required: "Reference required",
  complete_delivery: "Complete delivery",
  round_weight_per_piece_up: "Round weight per piece up",
  certificaat: "Certificaat",
  overlengte: "Overlengte",
  default_pickup: "Default pickup",
};

export const QUOTE_ORDER_INVOICE_OPTION_LABELS: Record<QuoteOrderInvoiceOption, string> = {
  do_not_print_prices: "Do not print prices",
  total_amount_per_line: "Total amount per line",
  condensing_options: "Condensing options",
  include_option_prices_in_material_prices: "Include option prices in material prices",
};

export const ORDER_OPTION_LABELS: Record<OrderOption, string> = {
  net_prices_only: "Net prices only",
  scrap_surcharge_separately: "Scrap surcharge separately",
  no_commercial_blocking: "No commercial blocking",
  no_financial_blockage: "No financial blockage",
  call_off_quantities_on_call_off_confirmation: "Call-off quantities on call-off confirmation",
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
