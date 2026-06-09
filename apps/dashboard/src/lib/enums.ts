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
