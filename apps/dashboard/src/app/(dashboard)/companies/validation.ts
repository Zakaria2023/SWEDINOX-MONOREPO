import {
  addressCategories,
  availableAtOptions,
  companyLangs,
  companyRoles,
  contactSalutations,
  contractableRoles,
  currencies,
  invoicePaymentTerms,
  type ContractableRole,
  type TextUsageCategory,
} from "@/lib/enums";
import { VALIDATION_MESSAGES } from "@/lib/validation-messages";
import { z } from "zod";

const createOptionalEmailSchema = () =>
  z.union([
    z.email({ error: VALIDATION_MESSAGES.invalidEmailAddress }),
    z.literal(""),
    z.undefined(),
  ]);

const createOptionalUrlSchema = () =>
  z.union([
    z.url({ error: VALIDATION_MESSAGES.invalidWebsiteUrl }),
    z.literal(""),
    z.undefined(),
  ]);

export const createAddressSchema = () =>
  z.object({
    altName: z.string().optional(),
    poBox: z.boolean().optional(),
    streetAndNo: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    house: z.string().optional(),
    telephone: z.string().optional(),
    fax: z.string().optional(),
    email: createOptionalEmailSchema(),
    website: createOptionalUrlSchema(),
    billingAttention: z.string().optional(),
    billingAttentionAdditional: z.string().optional(),
    gln: z.union([
      z.string().max(13, VALIDATION_MESSAGES.glnTooLong),
      z.literal(""),
      z.undefined(),
    ]),
    peppolId: z.union([
      z.string().regex(/^\d{4}:.+$/, VALIDATION_MESSAGES.peppolFormat),
      z.literal(""),
      z.undefined(),
    ]),
    sequenceNumber: z.string().optional(),
    category: z
      .array(z.enum(addressCategories))
      .min(1, VALIDATION_MESSAGES.atLeastOneCategory),
    needCrane: z.boolean().optional(),
    canopyRequired: z.boolean().optional(),
    bundleSeparately: z.boolean().optional(),
    addressComplete: z.boolean().optional(),
    specialTransport: z.boolean().optional(),
    availableAt: z.union([
      z.enum(availableAtOptions),
      z.literal(""),
      z.undefined(),
    ]),
    unloadingStartTime: z.union([z.string(), z.literal(""), z.undefined()]),
    unloadingEndTime: z.union([z.string(), z.literal(""), z.undefined()]),
    maxLength: z.string().optional(),
    maxBundleWeight: z.string().optional(),
    loadingInstructions: z.string().optional(),
  });

export const DEFAULT_ADDRESS: CompanyFormValues["address"] = {
  category: [],
  poBox: false,
  needCrane: false,
  canopyRequired: false,
  bundleSeparately: false,
  addressComplete: false,
  specialTransport: false,
  altName: "",
  streetAndNo: "",
  postalCode: "",
  country: "",
  city: "",
  region: "",
  house: "",
  telephone: "",
  fax: "",
  email: "",
  website: "",
  billingAttention: "",
  billingAttentionAdditional: "",
  gln: "",
  peppolId: "",
  sequenceNumber: "",
  availableAt: "",
  unloadingStartTime: "",
  unloadingEndTime: "",
  maxLength: "",
  maxBundleWeight: "",
  loadingInstructions: "",
};

export const createCompanySchema = () =>
  z.object({
    companyName: z.string().min(1, VALIDATION_MESSAGES.companyNameRequired),
    correspName: z.string().optional(),
    remarks: z.string().optional(),
    lang: z.union([z.enum(companyLangs), z.literal(""), z.undefined()]),
    roles: z.array(z.enum(companyRoles)),
    searchCode1: z.string().optional(),
    searchCode2: z.string().optional(),
    searchCode3: z.string().optional(),
    address: createAddressSchema(),
    documents: z.array(z.object({ id: z.string(), fileName: z.string() })),
    // Debtor fields
    debtorCompanyUuid: z.string().optional(),
    iban: z.string().optional(),
    bic: z.string().optional(),
    bankAccount: z.string().optional(),
    postbankAccount: z.string().optional(),
    purchaseOrgCompanyUuid: z.string().optional(),
    memberNumberPurchaseOrg: z.string().optional(),
    calculateVat: z.boolean(),
    reminder: z.boolean(),
    collectInvoicesInMandate: z.boolean(),
    insuranceValidUntil: z.string().optional(),
    creditLimitInsurance: z.string().optional(),
    creditLimit: z.string().optional(),
    creditLimitUninsured: z.string().optional(),
    creditLimitUninsuredDate: z.string().optional(),
    paymentTerms: z.union([z.enum(invoicePaymentTerms), z.literal(""), z.undefined()]),
    differentPaymentTermsExWorks: z.union([z.enum(invoicePaymentTerms), z.literal(""), z.undefined()]),
    journalCode: z.coerce.number().int().optional(),
    vatNumber: z.string().optional(),
    cocNumber: z.string().optional(),
    currency: z.union([z.enum(currencies), z.literal(""), z.undefined()]),
    blocked: z.boolean(),
    blockedByNote: z.string().optional(),
  });

export type AddressFormValues = z.infer<ReturnType<typeof createAddressSchema>>;
export type CompanyFormValues = z.infer<ReturnType<typeof createCompanySchema>>;

// ── Communication Setting ────────────────────────────────────────────────────

export const commSettingSchema = z.object({
  documentType: z.string().min(1),
  communicationType: z.string().min(1),
  shape: z.string().optional(),
  email: z.string().optional(),
  fax: z.string().optional(),
});

export type CommSettingFormValues = z.infer<typeof commSettingSchema>;

export const DEFAULT_COMM_SETTING: CommSettingFormValues = {
  documentType: "",
  communicationType: "",
  shape: "",
  email: "",
  fax: "",
};

// ── Contract Selection ───────────────────────────────────────────────────────

export const contractSelectionSchema = z.object({
  contractUuid: z.string().min(1, "Please select a contract"),
  role: z.enum(contractableRoles, { error: "Role is required" }),
});

export type ContractSelectionValues = z.infer<typeof contractSelectionSchema>;

export const DEFAULT_CONTRACT_SELECTION: ContractSelectionValues = {
  contractUuid: "",
  role: "" as ContractableRole,
};

// ── Contact Dialog ───────────────────────────────────────────────────────────

export const contactDialogSchema = z.object({
  salutation: z.enum(contactSalutations).optional(),
  firstName: z.string().optional(),
  initials: z.string().optional(),
  lastName: z.string().optional(),
  telephone: z.string().optional(),
  mobile: z.string().optional(),
  fax: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  categoryAddition: z.string().optional(),
  btwNumber: z.string().optional(),
  country: z.string().optional(),
  postal: z.string().optional(),
  house: z.string().optional(),
  poBox: z.boolean(),
  streetAndNo: z.string().optional(),
  annex: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  addressCountry: z.string().optional(),
  addressTelephone: z.string().optional(),
  addressFax: z.string().optional(),
  addressEmail: z.string().optional(),
  website: z.string().optional(),
  categories: z.array(z.string()),
  sequenceNumber: z.number().int().min(1),
  purchaser: z.string().optional(),
  searchCode1: z.string().optional(),
  searchCode2: z.string().optional(),
  searchCode3: z.string().optional(),
  revenueLastYear: z.string().optional(),
  revenueThisYear: z.string().optional(),
});

export type ContactDialogValues = z.infer<typeof contactDialogSchema>;

export const DEFAULT_CONTACT: ContactDialogValues = {
  salutation: undefined,
  firstName: "",
  initials: "",
  lastName: "",
  telephone: "",
  mobile: "",
  fax: "",
  email: "",
  address: "",
  categoryAddition: "",
  btwNumber: "",
  country: "",
  postal: "",
  house: "",
  poBox: false,
  streetAndNo: "",
  annex: "",
  postalCode: "",
  city: "",
  region: "",
  addressCountry: "",
  addressTelephone: "",
  addressFax: "",
  addressEmail: "",
  website: "",
  categories: [],
  sequenceNumber: 1,
  purchaser: "",
  searchCode1: "",
  searchCode2: "",
  searchCode3: "",
  revenueLastYear: "",
  revenueThisYear: "",
};

// ── Text Dialog ──────────────────────────────────────────────────────────────

export const textDialogSchema = z.object({
  textCategoryUuid: z.string().min(1, "Please select a text category"),
  textBlock: z.string().min(1, "Text block is required"),
  visitReport: z.boolean(),
  purchaseQuoteRequest: z.boolean(),
  purchaseOrder: z.boolean(),
  purchaseOrderToolTip: z.boolean(),
  purchaseReturnOrder: z.boolean(),
  salesQuote: z.boolean(),
  salesOrder: z.boolean(),
  salesOrderToolTip: z.boolean(),
  salesInvoice: z.boolean(),
  warehouseOrder: z.boolean(),
  productionOrder: z.boolean(),
  loadlist: z.boolean(),
  waybill: z.boolean(),
  rideList: z.boolean(),
  customerLabel: z.boolean(),
  transportPlanning: z.boolean(),
  websiteInAdvance: z.boolean(),
  websiteAfter: z.boolean(),
});

export type TextDialogValues = z.infer<typeof textDialogSchema>;
export type TextBooleanField = keyof Omit<
  TextDialogValues,
  "textCategoryUuid" | "textBlock"
>;

export const USAGE_CATEGORY_FIELDS: Array<{
  key: TextUsageCategory;
  field: TextBooleanField;
}> = [
  { key: "visit_report", field: "visitReport" },
  { key: "purchase_quote_request", field: "purchaseQuoteRequest" },
  { key: "purchase_order", field: "purchaseOrder" },
  { key: "purchase_order_tool_tip", field: "purchaseOrderToolTip" },
  { key: "purchase_return_order", field: "purchaseReturnOrder" },
  { key: "sales_quote", field: "salesQuote" },
  { key: "sales_order", field: "salesOrder" },
  { key: "sales_order_tool_tip", field: "salesOrderToolTip" },
  { key: "sales_invoice", field: "salesInvoice" },
  { key: "warehouse_order", field: "warehouseOrder" },
  { key: "production_order", field: "productionOrder" },
  { key: "loadlist", field: "loadlist" },
  { key: "waybill", field: "waybill" },
  { key: "ride_list", field: "rideList" },
  { key: "customer_label", field: "customerLabel" },
  { key: "transport_planning", field: "transportPlanning" },
  { key: "website_in_advance", field: "websiteInAdvance" },
  { key: "website_after", field: "websiteAfter" },
];

export const DEFAULT_TEXT: TextDialogValues = {
  textCategoryUuid: "",
  textBlock: "",
  visitReport: false,
  purchaseQuoteRequest: false,
  purchaseOrder: false,
  purchaseOrderToolTip: false,
  purchaseReturnOrder: false,
  salesQuote: false,
  salesOrder: false,
  salesOrderToolTip: false,
  salesInvoice: false,
  warehouseOrder: false,
  productionOrder: false,
  loadlist: false,
  waybill: false,
  rideList: false,
  customerLabel: false,
  transportPlanning: false,
  websiteInAdvance: false,
  websiteAfter: false,
};
