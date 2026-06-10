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

export const companyDocumentTypes = [
  "contract",
  "certificate",
  "invoice",
  "tax_document",
  "identity_document",
  "bank_document",
  "legal_document",
  "other",
] as const satisfies readonly string[];

export type CompanyDocumentType = (typeof companyDocumentTypes)[number];

export const companyRoleTypes = [
  "customer",
  "supplier",
  "prospect",
  "creditor",
  "debtor",
  "processor",
  "transporter",
  "agent",
  "other",
] as const satisfies readonly string[];

export type CompanyRoleType = (typeof companyRoleTypes)[number];

export const paymentTermTypes = [
  "cash",
  "net_7",
  "net_14",
  "net_30",
  "net_45",
  "net_60",
  "advance_payment",
  "custom",
] as const satisfies readonly string[];

export type PaymentTermType = (typeof paymentTermTypes)[number];

export const invoiceDeliveryMethods = [
  "email",
  "print",
  "portal",
  "edi",
  "manual",
] as const satisfies readonly string[];

export type InvoiceDeliveryMethod =
  (typeof invoiceDeliveryMethods)[number];

export const locationTypes = [
  "pick",
  "bulk",
  "production",
  "scrap",
  "loading",
  "inspection",
  "putaway",
  "sorting",
  "processor",
  "pickup",
  "call_off",
] as const satisfies readonly string[];

export type LocationType = (typeof locationTypes)[number];

export const locationAdoptPositions = [
  "next",
  "below",
] as const satisfies readonly string[];

export type LocationAdoptPosition =
  (typeof locationAdoptPositions)[number];

export const contactSalutations = [
  "mr",
  "mrs",
  "ms",
  "dr",
  "engineer",
  "professor",
] as const satisfies readonly string[];

export type ContactSalutation = (typeof contactSalutations)[number];
