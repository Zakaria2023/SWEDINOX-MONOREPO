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
