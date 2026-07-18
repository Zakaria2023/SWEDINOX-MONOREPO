"use client";

import {
  ContractForProjectOption,
  ContractListItem,
} from "@/app/(dashboard)/contracts/actions";
import { ProductGroupOption } from "@/app/(dashboard)/product-groups/actions";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import { InsertCompanies } from "@/db/schema/companies";
import { todayDateString } from "@/lib/helpers";
import {
  addressCategories,
  AddressCategory,
  communicationSettingDocumentTypes,
  communicationSettingShapes,
  communicationSettingTypes,
  companyLangs,
  CompanyRole,
  companyRoles,
  ContactCategory,
  ContractableRole,
  contractableRoles,
  currencies,
  Currency,
  InvoicePaymentTerm,
  invoicePaymentTerms,
} from "@/lib/enums";
import {
  COMMON_TEXT,
  COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS,
  COMMUNICATION_SETTING_SHAPE_LABELS,
  COMMUNICATION_SETTING_TYPE_LABELS,
  COMPANY_LANGUAGE_LABELS,
  CURRENCY_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
} from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  CommSettingInput,
  CompanyActionResult,
  CompanyContactInput,
  CompanyContractInput,
  CompanyCounterOrderInput,
  CompanyCustomerStockInput,
  CompanyFollowUpInput,
  CompanyOption,
  CompanyProcessingInput,
  CompanyProductInput,
  CompanyPurchaseOrderInput,
  CompanyQuoteInput,
  CompanyReturnOrderInput,
  CompanyTextInput,
  createCompany,
  CustomerProjectInput,
  CustomerSalesInput,
  DebtorCompanyOption,
  VisitReportInput,
} from "./actions";
import {
  AddressFormValues,
  CommunicationSettingFormValues,
  commSettingSchema,
  CompanyFormValues,
  contactDialogSchema,
  ContactDialogValues,
  contractSelectionSchema,
  ContractSelectionValues,
  counterOrderDialogSchema,
  CounterOrderDialogValues,
  createCompanySchema,
  customerProductDialogSchema,
  CustomerProductDialogValues,
  customerStockDialogSchema,
  CustomerStockDialogValues,
  DEFAULT_ADDRESS,
  DEFAULT_COMM_SETTING,
  DEFAULT_CONTACT,
  DEFAULT_CONTRACT_SELECTION,
  DEFAULT_COUNTER_ORDER,
  DEFAULT_CUSTOMER_PRODUCT,
  DEFAULT_CUSTOMER_STOCK,
  DEFAULT_PRODUCT,
  DEFAULT_PURCHASE_ORDER,
  DEFAULT_QUOTE,
  DEFAULT_RETURN_ORDER,
  DEFAULT_TEXT,
  DEFAULT_VISIT_REPORT,
  productDialogSchema,
  ProductDialogValues,
  purchaseOrderDialogSchema,
  PurchaseOrderDialogValues,
  quoteDialogSchema,
  QuoteDialogValues,
  returnOrderDialogSchema,
  ReturnOrderDialogValues,
  textDialogSchema,
  TextDialogValues,
  USAGE_CATEGORY_FIELDS,
  visitReportDialogSchema,
  VisitReportDialogValues,
} from "./validation";

const AGENT_ALLOWED = new Set<CompanyRole>(["agent", "other", "internal"]);
const PURCHASING_ORG_ALLOWED = new Set<CompanyRole>([
  "purchasing_org",
  "other",
]);

const getDisabledRoles = (selected: CompanyRole[]): Set<CompanyRole> => {
  const disabled = new Set<CompanyRole>();
  if (selected.includes("customer")) disabled.add("prospect");
  if (selected.includes("prospect")) disabled.add("customer");
  if (selected.includes("agent")) {
    for (const r of companyRoles) {
      if (!AGENT_ALLOWED.has(r)) disabled.add(r);
    }
  }
  if (selected.includes("purchasing_org")) {
    for (const r of companyRoles) {
      if (!PURCHASING_ORG_ALLOWED.has(r)) disabled.add(r);
    }
  }
  if (selected.some((r) => !AGENT_ALLOWED.has(r))) disabled.add("agent");
  if (selected.some((r) => !PURCHASING_ORG_ALLOWED.has(r)))
    disabled.add("purchasing_org");
  return disabled;
};

const isContractableRole = (role: CompanyRole): role is ContractableRole =>
  (contractableRoles as readonly string[]).includes(role);

const getDefaultContractRole = (
  roles: ContractableRole[],
): ContractSelectionValues["role"] =>
  roles.length === 1 ? roles[0] : ("" as ContractSelectionValues["role"]);

const mapAddress = (address: CompanyFormValues["address"]) => ({
  altName: address.altName || undefined,
  poBox: address.poBox,
  streetAndNo: address.streetAndNo || undefined,
  postalCode: address.postalCode || undefined,
  country: address.country || undefined,
  city: address.city || undefined,
  region: address.region || undefined,
  house: address.house || undefined,
  telephone: address.telephone || undefined,
  fax: address.fax || undefined,
  email: address.email || undefined,
  website: address.website || undefined,
  billingAttention: address.billingAttention || undefined,
  billingAttentionAdditional: address.billingAttentionAdditional || undefined,
  gln: address.gln || undefined,
  peppolId: address.peppolId || undefined,
  sequenceNumber: address.sequenceNumber
    ? Number(address.sequenceNumber)
    : undefined,
  category: address.category,
  needCrane: address.needCrane,
  canopyRequired: address.canopyRequired,
  bundleSeparately: address.bundleSeparately,
  addressComplete: address.addressComplete,
  specialTransport: address.specialTransport,
  availableAt: address.availableAt || undefined,
  unloadingStartTime: address.unloadingStartTime || undefined,
  unloadingEndTime: address.unloadingEndTime || undefined,
  maxLength: address.maxLength || undefined,
  maxBundleWeight: address.maxBundleWeight || undefined,
  loadingInstructions: address.loadingInstructions || undefined,
});

const projectSchema = z.object({
  projectName: z.string().optional(),
  endDate: z.string().optional(),
  revenue: z.string().optional(),
  contractUuid: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

const DEFAULT_PROJECT: ProjectFormValues = {
  projectName: "",
  endDate: "",
  revenue: "",
  contractUuid: "",
};

type UseCompanySubmitParams = {
  availableContracts: ContractListItem[];
  projectContracts: ContractForProjectOption[];
  textCategories: TextCategoryOption[];
  debtorCompanies: DebtorCompanyOption[];
  purchaseOrgCompanies: DebtorCompanyOption[];
  productGroups: ProductGroupOption[];
  availableProducts: ProductOption[];
  suppliers: CompanyOption[];
  currentUserName?: string;
};

export const useCompanySubmit = ({
  availableContracts,
  projectContracts,
  textCategories,
  debtorCompanies,
  purchaseOrgCompanies,
  productGroups,
  availableProducts,
  suppliers,
  currentUserName,
}: UseCompanySubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<CompanyActionResult>({});

  const [isFirstAddressDialogOpen, setIsFirstAddressDialogOpen] =
    useState(false);
  const [isAdditionalAddressDialogOpen, setIsAdditionalAddressDialogOpen] =
    useState(false);
  const [additionalAddresses, setAdditionalAddresses] = useState<
    AddressFormValues[]
  >([]);
  const [isCommSettingDialogOpen, setIsCommSettingDialogOpen] = useState(false);
  const [communicationSettings, setCommunicationSettings] = useState<
    CommSettingInput[]
  >([]);
  const [selectedCommType, setSelectedCommType] = useState("");
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [contracts, setContracts] = useState<CompanyContractInput[]>([]);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [contacts, setContacts] = useState<CompanyContactInput[]>([]);
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const [texts, setTexts] = useState<CompanyTextInput[]>([]);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [projects, setProjects] = useState<CustomerProjectInput[]>([]);
  const [isCounterOrderDialogOpen, setIsCounterOrderDialogOpen] =
    useState(false);
  const [counterOrders, setCounterOrders] = useState<
    CompanyCounterOrderInput[]
  >([]);
  const [editingCounterOrderIndex, setEditingCounterOrderIndex] = useState<
    number | null
  >(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [products, setProducts] = useState<CompanyProductInput[]>([]);
  const [pickedProduct, setPickedProduct] = useState<ProductOption | null>(
    null,
  );
  const [isCustomerProductDialogOpen, setIsCustomerProductDialogOpen] =
    useState(false);
  const [isCustomerProductPickerOpen, setIsCustomerProductPickerOpen] =
    useState(false);
  const [customerProducts, setCustomerProducts] = useState<
    CompanyProductInput[]
  >([]);
  const [pickedCustomerProduct, setPickedCustomerProduct] =
    useState<ProductOption | null>(null);
  const [isCustomerStockDialogOpen, setIsCustomerStockDialogOpen] =
    useState(false);
  const [isCustomerStockPickerOpen, setIsCustomerStockPickerOpen] =
    useState(false);
  const [customerStock, setCustomerStock] = useState<
    CompanyCustomerStockInput[]
  >([]);
  const [pickedCustomerStockProduct, setPickedCustomerStockProduct] =
    useState<ProductOption | null>(null);
  const [isVisitReportDialogOpen, setIsVisitReportDialogOpen] = useState(false);
  const [visitReports, setVisitReports] = useState<VisitReportInput[]>([]);
  const [editingVisitReportIndex, setEditingVisitReportIndex] = useState<
    number | null
  >(null);
  const [isPurchaseOrderDialogOpen, setIsPurchaseOrderDialogOpen] =
    useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<
    CompanyPurchaseOrderInput[]
  >([]);
  const [editingPurchaseOrderIndex, setEditingPurchaseOrderIndex] = useState<
    number | null
  >(null);
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [quotes, setQuotes] = useState<CompanyQuoteInput[]>([]);
  const [editingQuoteIndex, setEditingQuoteIndex] = useState<number | null>(
    null,
  );
  const [isReturnOrderDialogOpen, setIsReturnOrderDialogOpen] =
    useState(false);
  const [returnOrders, setReturnOrders] = useState<CompanyReturnOrderInput[]>(
    [],
  );
  const [editingReturnOrderIndex, setEditingReturnOrderIndex] = useState<
    number | null
  >(null);
  const [followUps, setFollowUps] = useState<CompanyFollowUpInput[]>([]);
  const [processings, setProcessings] = useState<CompanyProcessingInput[]>([]);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(createCompanySchema()),
    defaultValues: {
      companyName: "",
      correspName: "",
      remarks: "",
      lang: "",
      roles: [],
      searchCode1: "",
      searchCode2: "",
      searchCode3: "",
      documents: [],
      debtorCompanyUuid: "",
      iban: "",
      bic: "",
      bankAccount: "",
      postbankAccount: "",
      purchaseOrgCompanyUuid: "",
      memberNumberPurchaseOrg: "",
      calculateVat: true,
      reminder: true,
      collectInvoicesInMandate: false,
      insuranceValidUntil: "",
      creditLimitInsurance: "",
      creditLimit: "",
      creditLimitUninsured: "",
      creditLimitUninsuredDate: "",
      paymentTerms: "",
      differentPaymentTermsExWorks: "",
      journalCode: undefined,
      vatNumber: "",
      cocNumber: "",
      currency: "",
      isBlocked: false,
      blockedByNote: "",
      invoicingMethod: "per_delivery",
      collectiveInvoicing: false,
      invoicePackagingAtZeroPrice: false,
      printCommodityCode: false,
      invoiceFrequency: "daily",
      invoicePrintEnabled: false,
      invoicePrintCount: 1,
      invoiceEmailEnabled: false,
      invoiceEmailTo: "",
      printEmailZeroValueInvoices: false,
      sendXmlWithInvoice: false,
      industry: "",
      classification: "",
      visitFrequency: "0",
      callFrequencyPerYear: "0",
      targetDateNextVisit: "",
      visitReason: "",
      potentialAnnualRevenue: "0.00",
      targetAnnualRevenue: "0.00",
      potentialAnnualSales: "0.000",
      targetAnnualSales: "0.000",
      numberOfEmployees: "0",
      visitPlanning: Array.from({ length: 12 }, () => ({
        call: false,
        visit: false,
      })),
      address: {
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
      },
    },
  });

  const [salesData, setSalesData] = useState<CustomerSalesInput | null>(null);

  const additionalForm = useForm<CompanyFormValues>({
    resolver: zodResolver(createCompanySchema()),
    defaultValues: {
      companyName: "",
      correspName: "",
      remarks: "",
      lang: "",
      roles: [],
      searchCode1: "",
      searchCode2: "",
      searchCode3: "",
      address: { ...DEFAULT_ADDRESS, category: [] },
    },
  });

  const commSettingForm = useForm<CommunicationSettingFormValues>({
    resolver: zodResolver(commSettingSchema),
    defaultValues: DEFAULT_COMM_SETTING,
  });

  const contractSelectionForm = useForm<ContractSelectionValues>({
    resolver: zodResolver(contractSelectionSchema),
    defaultValues: DEFAULT_CONTRACT_SELECTION,
  });

  const contactForm = useForm<ContactDialogValues>({
    resolver: zodResolver(contactDialogSchema),
    defaultValues: DEFAULT_CONTACT,
  });

  const textForm = useForm<TextDialogValues>({
    resolver: zodResolver(textDialogSchema),
    defaultValues: DEFAULT_TEXT,
  });

  const productForm = useForm<ProductDialogValues>({
    resolver: zodResolver(productDialogSchema),
    defaultValues: DEFAULT_PRODUCT,
  });

  const customerProductForm = useForm<CustomerProductDialogValues>({
    resolver: zodResolver(customerProductDialogSchema),
    defaultValues: DEFAULT_CUSTOMER_PRODUCT,
  });

  const customerStockForm = useForm<CustomerStockDialogValues>({
    resolver: zodResolver(customerStockDialogSchema),
    defaultValues: DEFAULT_CUSTOMER_STOCK,
  });

  const projectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: DEFAULT_PROJECT,
  });

  const counterOrderForm = useForm<CounterOrderDialogValues>({
    resolver: zodResolver(counterOrderDialogSchema),
    defaultValues: DEFAULT_COUNTER_ORDER,
  });

  const visitReportForm = useForm<VisitReportDialogValues>({
    resolver: zodResolver(visitReportDialogSchema),
    defaultValues: DEFAULT_VISIT_REPORT,
  });

  const purchaseOrderForm = useForm<PurchaseOrderDialogValues>({
    resolver: zodResolver(purchaseOrderDialogSchema),
    defaultValues: DEFAULT_PURCHASE_ORDER,
  });

  const quoteForm = useForm<QuoteDialogValues>({
    resolver: zodResolver(quoteDialogSchema),
    defaultValues: DEFAULT_QUOTE,
  });

  const returnOrderForm = useForm<ReturnOrderDialogValues>({
    resolver: zodResolver(returnOrderDialogSchema),
    defaultValues: DEFAULT_RETURN_ORDER,
  });

  const addressValues = form.watch("address");
  const selectedRoles: CompanyRole[] = form.watch("roles") ?? [];
  const disabledRoles = getDisabledRoles(selectedRoles);
  const activeContractableRoles = selectedRoles.filter(isContractableRole);

  const usedCategories = new Set<AddressCategory>([
    ...(addressValues.category ?? []),
    ...additionalAddresses.flatMap((a) => a.category),
  ]);
  const availableForNext: AddressCategory[] = [
    ...addressCategories.filter(
      (c) => c !== "delivery" && !usedCategories.has(c),
    ),
    "delivery",
  ];

  const hasFirstAddress = !!(
    addressValues.streetAndNo ||
    addressValues.city ||
    addressValues.altName ||
    addressValues.postalCode
  );

  const langOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...companyLangs.map((lang) => ({
      value: lang,
      label: COMPANY_LANGUAGE_LABELS[lang],
    })),
  ];

  const documentTypeOptions = [
    { value: "", label: COMMON_TEXT.selectOption },
    ...communicationSettingDocumentTypes.map((documentType) => ({
      value: documentType,
      label: COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS[documentType],
    })),
  ];

  const communicationTypeOptions = [
    { value: "", label: COMMON_TEXT.selectOption },
    ...communicationSettingTypes.map((communicationType) => ({
      value: communicationType,
      label: COMMUNICATION_SETTING_TYPE_LABELS[communicationType],
    })),
  ];

  const shapeOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...communicationSettingShapes.map((shape) => ({
      value: shape,
      label: COMMUNICATION_SETTING_SHAPE_LABELS[shape],
    })),
  ];

  const paymentTermOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...invoicePaymentTerms.map((t) => ({
      value: t,
      label: INVOICE_PAYMENT_TERM_LABELS[t as InvoicePaymentTerm],
    })),
  ];

  const currencyOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...currencies.map((c) => ({
      value: c,
      label: CURRENCY_LABELS[c as Currency],
    })),
  ];

  const debtorCompanyOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...debtorCompanies.map((c) => ({ value: c.uuid, label: c.companyName })),
  ];

  const purchaseOrgOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...purchaseOrgCompanies.map((c) => ({
      value: c.uuid,
      label: c.companyName,
    })),
  ];

  // Supplier dropdown for the Processing grid — the label leads with the
  // supplier code (searchCode1) since that's the "Supplier code" column.
  const supplierOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...suppliers.map((s) => ({
      value: s.uuid,
      label: s.searchCode1
        ? `${s.searchCode1} — ${s.companyName}`
        : s.companyName,
    })),
  ];

  const resetAdditionalForm = () => {
    additionalForm.reset({
      companyName: "",
      correspName: "",
      remarks: "",
      lang: "",
      roles: [],
      searchCode1: "",
      searchCode2: "",
      searchCode3: "",
      address: { ...DEFAULT_ADDRESS, category: [] },
    });
  };

  const addressLabel = (address: {
    streetAndNo?: string;
    city?: string;
    altName?: string;
  }) =>
    [address.streetAndNo, address.city].filter(Boolean).join(", ") ||
    address.altName ||
    "Address";

  const commSettingLabel = (setting: CommSettingInput) =>
    [
      COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS[setting.documentType],
      COMMUNICATION_SETTING_TYPE_LABELS[setting.communicationType],
    ].join(" - ");

  // ── Address handlers ─────────────────────────────────────────────────────────

  const handleAdditionalAddressOpenChange = (open: boolean) => {
    if (!open) resetAdditionalForm();
    setIsAdditionalAddressDialogOpen(open);
  };

  const handleCancelFirstAddress = () => setIsFirstAddressDialogOpen(false);

  const handleCancelAdditionalAddress = () => {
    resetAdditionalForm();
    setIsAdditionalAddressDialogOpen(false);
  };

  const handleSaveFirstAddress = async () => {
    if (await form.trigger("address")) setIsFirstAddressDialogOpen(false);
  };

  const handleSaveAdditionalAddress = async () => {
    if (!(await additionalForm.trigger("address"))) return;
    const values = additionalForm.getValues("address");
    setAdditionalAddresses((prev) => [...prev, values]);
    resetAdditionalForm();
    setIsAdditionalAddressDialogOpen(false);
  };

  const removeAdditionalAddress = (index: number) =>
    setAdditionalAddresses((prev) => prev.filter((_, i) => i !== index));

  // ── Communication setting handlers ───────────────────────────────────────────

  const handleCommSettingOpenChange = (open: boolean) => {
    if (!open) {
      commSettingForm.reset(DEFAULT_COMM_SETTING);
      setSelectedCommType("");
    }
    setIsCommSettingDialogOpen(open);
  };

  const handleOpenCommSetting = () => {
    commSettingForm.reset(DEFAULT_COMM_SETTING);
    setSelectedCommType("");
    setIsCommSettingDialogOpen(true);
  };

  const handleCancelCommSetting = () => {
    commSettingForm.reset(DEFAULT_COMM_SETTING);
    setSelectedCommType("");
    setIsCommSettingDialogOpen(false);
  };

  const handleSaveCommSetting = commSettingForm.handleSubmit((values) => {
    setCommunicationSettings((prev) => [
      ...prev,
      {
        documentType: values.documentType as CommSettingInput["documentType"],
        communicationType:
          values.communicationType as CommSettingInput["communicationType"],
        shape: (values.shape || undefined) as CommSettingInput["shape"],
        email:
          values.communicationType === "email"
            ? values.email || undefined
            : undefined,
        fax:
          values.communicationType === "fax"
            ? values.fax || undefined
            : undefined,
      },
    ]);
    commSettingForm.reset(DEFAULT_COMM_SETTING);
    setSelectedCommType("");
    setIsCommSettingDialogOpen(false);
  });

  const removeCommSetting = (index: number) =>
    setCommunicationSettings((prev) => prev.filter((_, i) => i !== index));

  // ── Contract handlers ────────────────────────────────────────────────────────

  const handleContractOpenChange = (open: boolean) => {
    if (!open) contractSelectionForm.reset(DEFAULT_CONTRACT_SELECTION);
    else
      contractSelectionForm.reset({
        contractUuid: "",
        role: getDefaultContractRole(activeContractableRoles),
      });
    setIsContractDialogOpen(open);
  };

  const handleOpenContract = () => {
    contractSelectionForm.reset({
      contractUuid: "",
      role: getDefaultContractRole(activeContractableRoles),
    });
    setIsContractDialogOpen(true);
  };

  const handleCancelContract = () => {
    contractSelectionForm.reset(DEFAULT_CONTRACT_SELECTION);
    setIsContractDialogOpen(false);
  };

  const handleSaveContract = contractSelectionForm.handleSubmit((values) => {
    const selected = availableContracts.find(
      (c) => c.uuid === values.contractUuid,
    );
    if (!selected) return;
    setContracts((prev) => [
      ...prev,
      {
        role: values.role,
        code: selected.code,
        contractType: selected.contractType,
        description: selected.description,
        contractGroupUuid: selected.contractGroupUuid ?? undefined,
        quicklyChangeOrder: selected.quicklyChangeOrder ?? undefined,
        hasPriceDate: selected.hasPriceDate ?? false,
        priceDate: selected.priceDate ?? undefined,
        linkToNewCustomer: selected.linkToNewCustomer ?? false,
        searchCode1: selected.searchCode1 ?? undefined,
        searchCode2: selected.searchCode2 ?? undefined,
        searchCode3: selected.searchCode3 ?? undefined,
        websiteSorting: selected.websiteSorting ?? 10,
        hideOnWebsite: selected.hideOnWebsite ?? false,
      },
    ]);
    contractSelectionForm.reset(DEFAULT_CONTRACT_SELECTION);
    setIsContractDialogOpen(false);
  });

  const removeContract = (index: number) =>
    setContracts((prev) => prev.filter((_, i) => i !== index));

  // ── Contact handlers ─────────────────────────────────────────────────────────

  const handleContactOpenChange = (open: boolean) => {
    if (!open) contactForm.reset(DEFAULT_CONTACT);
    setIsContactDialogOpen(open);
  };

  const handleOpenContact = () => {
    contactForm.reset(DEFAULT_CONTACT);
    setIsContactDialogOpen(true);
  };

  const handleCancelContact = () => {
    contactForm.reset(DEFAULT_CONTACT);
    setIsContactDialogOpen(false);
  };

  const handleSaveContact = contactForm.handleSubmit((values) => {
    const companyValues = form.getValues();
    const isSupplier = selectedRoles.includes("supplier");
    const isCustomerOrProspect =
      selectedRoles.includes("customer") || selectedRoles.includes("prospect");

    setContacts((prev) => [
      ...prev,
      {
        salutation: (values.salutation ||
          undefined) as CompanyContactInput["salutation"],
        firstName: values.firstName || undefined,
        initials: values.initials || undefined,
        lastName: values.lastName || undefined,
        telephone: values.telephone || undefined,
        mobile: values.mobile || undefined,
        fax: values.fax || undefined,
        email: values.email || undefined,
        address: values.address || undefined,
        categoryAddition: values.categoryAddition || undefined,
        btwNumber: values.btwNumber || undefined,
        country: values.country || undefined,
        postal: values.postal || undefined,
        house: values.house || undefined,
        poBox: values.poBox,
        streetAndNo: values.streetAndNo || undefined,
        annex: values.annex || undefined,
        postalCode: values.postalCode || undefined,
        city: values.city || undefined,
        region: values.region || undefined,
        addressCountry: values.addressCountry || undefined,
        addressTelephone: values.addressTelephone || undefined,
        addressFax: values.addressFax || undefined,
        addressEmail: values.addressEmail || undefined,
        website: values.website || undefined,
        categories: values.categories as ContactCategory[],
        sequenceNumber: values.sequenceNumber,
        purchaser: undefined,
        searchCode1:
          isSupplier || isCustomerOrProspect
            ? companyValues.searchCode1 || undefined
            : undefined,
        searchCode2:
          isSupplier || isCustomerOrProspect
            ? companyValues.searchCode2 || undefined
            : undefined,
        searchCode3:
          isSupplier || isCustomerOrProspect
            ? companyValues.searchCode3 || undefined
            : undefined,
        revenueLastYear:
          isSupplier || isCustomerOrProspect ? "0.00" : undefined,
        revenueThisYear:
          isSupplier || isCustomerOrProspect ? "0.00" : undefined,
        isCustomer: selectedRoles.includes("customer"),
        isProspect: selectedRoles.includes("prospect"),
        isSupplier: selectedRoles.includes("supplier"),
        isProcessor: selectedRoles.includes("processor"),
        isTransporter: selectedRoles.includes("transporter"),
        isAgent: selectedRoles.includes("agent"),
        isOther: selectedRoles.includes("other"),
        visitStreetAndNo: undefined,
        visitPostalCode: undefined,
        visitCity: undefined,
        visitCountry: undefined,
        visitTelephone: undefined,
        visitFax: undefined,
        accountManager: undefined,
        representative: undefined,
        customerGroup: undefined,
        industryCode: undefined,
        industry: undefined,
        classificationCode: undefined,
        classification: undefined,
        creditLimit: undefined,
        competitors: undefined,
        customerRegionCode: undefined,
        customerRegion: undefined,
        targetYearRevenue: isCustomerOrProspect ? "0.00" : undefined,
        targetAnnualSales: isCustomerOrProspect ? "0.00" : undefined,
      },
    ]);
    contactForm.reset(DEFAULT_CONTACT);
    setIsContactDialogOpen(false);
  });

  const toggleContactCategory = (category: ContactCategory) => {
    const current = contactForm.getValues("categories") as ContactCategory[];
    contactForm.setValue(
      "categories",
      current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category],
    );
  };

  // Removing a contact shifts the indices of everything after it, so any
  // visit report referencing one of those contacts needs its contactIndex
  // shifted too (or cleared, if it pointed at the removed contact).
  const removeContact = (index: number) => {
    setContacts((prev) => prev.filter((_, i) => i !== index));
    setVisitReports((prev) =>
      prev.map((report) => {
        if (report.contactIndex == null) return report;
        if (report.contactIndex === index) {
          return {
            ...report,
            contactIndex: undefined,
            representative: undefined,
          };
        }
        return report.contactIndex > index
          ? { ...report, contactIndex: report.contactIndex - 1 }
          : report;
      }),
    );
  };

  // ── Text handlers ────────────────────────────────────────────────────────────

  const handleTextOpenChange = (open: boolean) => {
    if (!open) textForm.reset(DEFAULT_TEXT);
    setIsTextDialogOpen(open);
  };

  const handleOpenText = () => {
    textForm.reset(DEFAULT_TEXT);
    setIsTextDialogOpen(true);
  };

  const handleCancelText = () => {
    textForm.reset(DEFAULT_TEXT);
    setIsTextDialogOpen(false);
  };

  const handleCategorySelect = (uuid: string) => {
    textForm.setValue("textCategoryUuid", uuid);
    const cat = textCategories.find((c) => c.uuid === uuid);
    if (cat) {
      const enabled = new Set(cat.usageCategoriesJson ?? []);
      USAGE_CATEGORY_FIELDS.forEach(({ key, field }) => {
        textForm.setValue(field, enabled.has(key));
      });
    }
  };

  const handleSaveText = textForm.handleSubmit((values) => {
    const categoryName =
      textCategories.find((c) => c.uuid === values.textCategoryUuid)?.name ??
      "";
    setTexts((prev) => [
      ...prev,
      {
        textCategoryUuid: values.textCategoryUuid || undefined,
        title: categoryName,
        textBlock: values.textBlock,
        visitReport: values.visitReport,
        purchaseQuoteRequest: values.purchaseQuoteRequest,
        purchaseOrder: values.purchaseOrder,
        purchaseOrderToolTip: values.purchaseOrderToolTip,
        purchaseReturnOrder: values.purchaseReturnOrder,
        salesQuote: values.salesQuote,
        salesOrder: values.salesOrder,
        salesOrderToolTip: values.salesOrderToolTip,
        salesInvoice: values.salesInvoice,
        warehouseOrder: values.warehouseOrder,
        productionOrder: values.productionOrder,
        loadlist: values.loadlist,
        waybill: values.waybill,
        rideList: values.rideList,
        customerLabel: values.customerLabel,
        transportPlanning: values.transportPlanning,
        websiteInAdvance: values.websiteInAdvance,
        websiteAfter: values.websiteAfter,
      },
    ]);
    textForm.reset(DEFAULT_TEXT);
    setIsTextDialogOpen(false);
  });

  const removeText = (index: number) =>
    setTexts((prev) => prev.filter((_, i) => i !== index));

  // ── Project handlers ───────────────────────────────────────────────────────

  const handleProjectOpenChange = (open: boolean) => {
    if (!open) projectForm.reset(DEFAULT_PROJECT);
    setIsProjectDialogOpen(open);
  };

  const handleOpenProject = () => {
    projectForm.reset(DEFAULT_PROJECT);
    setIsProjectDialogOpen(true);
  };

  const handleCancelProject = () => {
    projectForm.reset(DEFAULT_PROJECT);
    setIsProjectDialogOpen(false);
  };

  const handleSaveProject = projectForm.handleSubmit((values) => {
    const today = todayDateString();
    setProjects((prev) => [
      ...prev,
      {
        projectName: values.projectName || undefined,
        startingDate: today,
        endDate: values.endDate || undefined,
        revenue: values.revenue || undefined,
        contractUuid: values.contractUuid || undefined,
        daysInSystem: 0,
      },
    ]);
    projectForm.reset(DEFAULT_PROJECT);
    setIsProjectDialogOpen(false);
  });

  const removeProject = (index: number) =>
    setProjects((prev) => prev.filter((_, i) => i !== index));

  // ── Counter order handlers ───────────────────────────────────────────────────

  const mapCounterOrder = (
    values: CounterOrderDialogValues,
  ): CompanyCounterOrderInput => ({
    orderDate: values.orderDate || undefined,
    deliveryDate: values.deliveryDate || undefined,
    status: values.status,
    priority: values.priority,
    orderMethod: (values.orderMethod ||
      undefined) as CompanyCounterOrderInput["orderMethod"],
    seller: values.seller || undefined,
    customerRef: values.customerRef || undefined,
    ourReference: values.ourReference || undefined,
    deliveryTerms: (values.deliveryTerms ||
      undefined) as CompanyCounterOrderInput["deliveryTerms"],
    handlingBlocked: values.handlingBlocked,
    printPickingSlips: values.printPickingSlips,
    isPickup: values.isPickup,
    isIncidental: values.isIncidental,
    isOverlengte: values.isOverlengte,
    amountExVat: values.amountExVat || "0.00",
    weightKg: values.weightKg || "0.000",
    gainPercent: values.gainPercent || "0.00",
    remarks: values.remarks || undefined,
  });

  const handleCounterOrderOpenChange = (open: boolean) => {
    if (!open) {
      counterOrderForm.reset(DEFAULT_COUNTER_ORDER);
      setEditingCounterOrderIndex(null);
    }
    setIsCounterOrderDialogOpen(open);
  };

  const handleOpenCounterOrder = () => {
    setEditingCounterOrderIndex(null);
    counterOrderForm.reset({
      ...DEFAULT_COUNTER_ORDER,
      orderDate: todayDateString(),
    });
    setIsCounterOrderDialogOpen(true);
  };

  const handleEditCounterOrder = (index: number) => {
    const order = counterOrders[index];
    if (!order) {
      return;
    }
    setEditingCounterOrderIndex(index);
    counterOrderForm.reset({
      customerRef: order.customerRef ?? "",
      ourReference: order.ourReference ?? "",
      orderMethod: order.orderMethod ?? "",
      seller: order.seller ?? "",
      status: order.status ?? "open",
      priority: order.priority ?? "normal",
      orderDate: order.orderDate ?? "",
      deliveryDate: order.deliveryDate ?? "",
      deliveryTerms: order.deliveryTerms ?? "",
      handlingBlocked: order.handlingBlocked ?? false,
      printPickingSlips: order.printPickingSlips ?? true,
      isPickup: order.isPickup ?? false,
      isIncidental: order.isIncidental ?? false,
      isOverlengte: order.isOverlengte ?? false,
      amountExVat: order.amountExVat ?? "0.00",
      weightKg: order.weightKg ?? "0.000",
      gainPercent: order.gainPercent ?? "0.00",
      remarks: order.remarks ?? "",
    });
    setIsCounterOrderDialogOpen(true);
  };

  const handleCancelCounterOrder = () => {
    counterOrderForm.reset(DEFAULT_COUNTER_ORDER);
    setEditingCounterOrderIndex(null);
    setIsCounterOrderDialogOpen(false);
  };

  const handleSaveCounterOrder = counterOrderForm.handleSubmit((values) => {
    const entry = mapCounterOrder(values);
    setCounterOrders((prev) =>
      editingCounterOrderIndex === null
        ? [...prev, entry]
        : prev.map((order, i) =>
            i === editingCounterOrderIndex ? entry : order,
          ),
    );
    counterOrderForm.reset(DEFAULT_COUNTER_ORDER);
    setEditingCounterOrderIndex(null);
    setIsCounterOrderDialogOpen(false);
  });

  const removeCounterOrder = (index: number) =>
    setCounterOrders((prev) => prev.filter((_, i) => i !== index));

  // ── Product handlers ─────────────────────────────────────────────────────────

  const handleProductOpenChange = (open: boolean) => {
    if (!open) {
      productForm.reset(DEFAULT_PRODUCT);
      setPickedProduct(null);
    }
    setIsProductDialogOpen(open);
  };

  const handleOpenProduct = () => {
    productForm.reset(DEFAULT_PRODUCT);
    setPickedProduct(null);
    setIsProductDialogOpen(true);
  };

  const handleCancelProduct = () => {
    productForm.reset(DEFAULT_PRODUCT);
    setPickedProduct(null);
    setIsProductDialogOpen(false);
  };

  const handleOpenProductPicker = () => setIsProductPickerOpen(true);

  const handleCancelProductPicker = () => setIsProductPickerOpen(false);

  const handlePickProduct = (product: ProductOption) => {
    setPickedProduct(product);
    productForm.setValue("productUuid", product.uuid);
    setIsProductPickerOpen(false);
  };

  const handleSaveProduct = productForm.handleSubmit((values) => {
    if (!pickedProduct) {
      return;
    }

    setProducts((prev) => [
      ...prev,
      {
        // Copied from the picked catalog product — this creates the
        // company's own product record rather than referencing the
        // catalog product directly (same pattern as Contracts, which are
        // copied per company from a selected template).
        productCode: pickedProduct.productCode,
        name: pickedProduct.name,
        productGroupUuid: pickedProduct.productGroupUuid ?? undefined,
        preferred: values.preferred,
        ean: values.ean || undefined,
        externalProductCode: values.externalProductCode || undefined,
        editing: values.editing || undefined,
        deliveryTime: values.deliveryTime
          ? Number(values.deliveryTime)
          : undefined,
        deliveryTimeUnit: values.deliveryTimeUnit || undefined,
        minOrderQty: values.minOrderQty || undefined,
        minOrderQtyUnit: values.minOrderQtyUnit || undefined,
        orderSeries: values.orderSeries
          ? Number(values.orderSeries)
          : undefined,
        orderSeriesUnit: values.orderSeriesUnit || undefined,
      },
    ]);
    productForm.reset(DEFAULT_PRODUCT);
    setPickedProduct(null);
    setIsProductDialogOpen(false);
  });

  const removeProduct = (index: number) =>
    setProducts((prev) => prev.filter((_, i) => i !== index));

  // ── Customer product handlers ────────────────────────────────────────────────

  const handleCustomerProductOpenChange = (open: boolean) => {
    if (!open) {
      customerProductForm.reset(DEFAULT_CUSTOMER_PRODUCT);
      setPickedCustomerProduct(null);
    }
    setIsCustomerProductDialogOpen(open);
  };

  const handleOpenCustomerProduct = () => {
    customerProductForm.reset(DEFAULT_CUSTOMER_PRODUCT);
    setPickedCustomerProduct(null);
    setIsCustomerProductDialogOpen(true);
  };

  const handleCancelCustomerProduct = () => {
    customerProductForm.reset(DEFAULT_CUSTOMER_PRODUCT);
    setPickedCustomerProduct(null);
    setIsCustomerProductDialogOpen(false);
  };

  const handleOpenCustomerProductPicker = () =>
    setIsCustomerProductPickerOpen(true);

  const handleCancelCustomerProductPicker = () =>
    setIsCustomerProductPickerOpen(false);

  const handlePickCustomerProduct = (product: ProductOption) => {
    setPickedCustomerProduct(product);
    customerProductForm.setValue("productUuid", product.uuid);
    setIsCustomerProductPickerOpen(false);
  };

  const handleSaveCustomerProduct = customerProductForm.handleSubmit(
    (values) => {
      if (!pickedCustomerProduct) return;
      setCustomerProducts((prev) => [
        ...prev,
        {
          // Copied from the picked catalog product, same as the general
          // Products section — creates the company's own product record.
          productCode: pickedCustomerProduct.productCode,
          name: pickedCustomerProduct.name,
          productGroupUuid: pickedCustomerProduct.productGroupUuid ?? undefined,
          showOnWebsite: values.showOnWebsite,
        },
      ]);
      customerProductForm.reset(DEFAULT_CUSTOMER_PRODUCT);
      setPickedCustomerProduct(null);
      setIsCustomerProductDialogOpen(false);
    },
  );

  const removeCustomerProduct = (index: number) =>
    setCustomerProducts((prev) => prev.filter((_, i) => i !== index));

  // ── Customer stock handlers ──────────────────────────────────────────────────

  const handleCustomerStockOpenChange = (open: boolean) => {
    if (!open) {
      customerStockForm.reset(DEFAULT_CUSTOMER_STOCK);
      setPickedCustomerStockProduct(null);
    }
    setIsCustomerStockDialogOpen(open);
  };

  const handleOpenCustomerStock = () => {
    customerStockForm.reset(DEFAULT_CUSTOMER_STOCK);
    setPickedCustomerStockProduct(null);
    setIsCustomerStockDialogOpen(true);
  };

  const handleCancelCustomerStock = () => {
    customerStockForm.reset(DEFAULT_CUSTOMER_STOCK);
    setPickedCustomerStockProduct(null);
    setIsCustomerStockDialogOpen(false);
  };

  const handleOpenCustomerStockPicker = () =>
    setIsCustomerStockPickerOpen(true);

  const handleCancelCustomerStockPicker = () =>
    setIsCustomerStockPickerOpen(false);

  const handlePickCustomerStockProduct = (product: ProductOption) => {
    setPickedCustomerStockProduct(product);
    customerStockForm.setValue("productUuid", product.uuid);
    setIsCustomerStockPickerOpen(false);
  };

  const handleSaveCustomerStock = customerStockForm.handleSubmit((values) => {
    if (!pickedCustomerStockProduct) {
      return;
    }
    setCustomerStock((prev) => [
      ...prev,
      {
        location: values.location || undefined,
        productUuid: pickedCustomerStockProduct.uuid,
        // Snapshotted so the stock grid stays readable even if the catalog
        // product is renamed later.
        productCode: pickedCustomerStockProduct.productCode,
        productName: pickedCustomerStockProduct.name,
        quantity: values.quantity || "0.000",
        reason: values.reason,
        description: values.description || undefined,
      },
    ]);
    customerStockForm.reset(DEFAULT_CUSTOMER_STOCK);
    setPickedCustomerStockProduct(null);
    setIsCustomerStockDialogOpen(false);
  });

  const removeCustomerStock = (index: number) =>
    setCustomerStock((prev) => prev.filter((_, i) => i !== index));

  // ── Visit report handlers ────────────────────────────────────────────────────

  const contactLabel = (contact: CompanyContactInput) =>
    [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
    contact.email ||
    "Contact";

  // When exactly one contact exists it becomes the default; with none the
  // field stays empty (the dialog disables it and prompts to add a contact).
  const defaultContactIndex = () => (contacts.length === 1 ? "0" : "");

  const handleVisitReportOpenChange = (open: boolean) => {
    if (!open) {
      visitReportForm.reset(DEFAULT_VISIT_REPORT);
      setEditingVisitReportIndex(null);
    }
    setIsVisitReportDialogOpen(open);
  };

  const handleOpenVisitReport = () => {
    setEditingVisitReportIndex(null);
    visitReportForm.reset({
      ...DEFAULT_VISIT_REPORT,
      contactIndex: defaultContactIndex(),
    });
    setIsVisitReportDialogOpen(true);
  };

  const handleEditVisitReport = (index: number) => {
    const report = visitReports[index];
    if (!report) return;
    setEditingVisitReportIndex(index);
    visitReportForm.reset({
      visitDate: report.visitDate ?? "",
      visitTime: report.visitTime ?? "",
      contactMethod: report.contactMethod ?? "",
      hasTakenPlace: report.hasTakenPlace ?? false,
      visitReason: report.visitReason ?? "",
      contactIndex:
        report.contactIndex != null ? String(report.contactIndex) : "",
    });
    setIsVisitReportDialogOpen(true);
  };

  const handleCancelVisitReport = () => {
    visitReportForm.reset(DEFAULT_VISIT_REPORT);
    setEditingVisitReportIndex(null);
    setIsVisitReportDialogOpen(false);
  };

  const handleSaveVisitReport = visitReportForm.handleSubmit((values) => {
    const contactIndex =
      values.contactIndex !== undefined && values.contactIndex !== ""
        ? Number(values.contactIndex)
        : undefined;
    const contact =
      contactIndex !== undefined ? contacts[contactIndex] : undefined;
    const entry: VisitReportInput = {
      visitDate: values.visitDate || undefined,
      visitTime: values.visitTime || undefined,
      contactMethod: (values.contactMethod ||
        undefined) as VisitReportInput["contactMethod"],
      hasTakenPlace: values.hasTakenPlace,
      visitReason: (values.visitReason ||
        undefined) as VisitReportInput["visitReason"],
      contactIndex,
      representative: contact ? contactLabel(contact) : undefined,
    };
    setVisitReports((prev) =>
      editingVisitReportIndex === null
        ? [...prev, entry]
        : prev.map((report, i) =>
            i === editingVisitReportIndex ? entry : report,
          ),
    );
    visitReportForm.reset(DEFAULT_VISIT_REPORT);
    setEditingVisitReportIndex(null);
    setIsVisitReportDialogOpen(false);
  });

  const removeVisitReport = (index: number) =>
    setVisitReports((prev) => prev.filter((_, i) => i !== index));

  // ── Purchase order handlers ──────────────────────────────────────────────────

  const mapPurchaseOrder = (
    values: PurchaseOrderDialogValues,
  ): CompanyPurchaseOrderInput => ({
    status: values.status,
    purchaseOrderType: (values.purchaseOrderType ||
      undefined) as CompanyPurchaseOrderInput["purchaseOrderType"],
    forOrder: values.forOrder || undefined,
    orderDate: values.orderDate || undefined,
    deliveryDate: values.deliveryDate
      ? new Date(values.deliveryDate)
      : undefined,
    amount: values.amount || "0.00",
    weightKg: values.weightKg || "0.000",
    confirmationReference: values.confirmationReference || undefined,
    confirmationDate: values.confirmationDate || undefined,
    copiedFrom: values.copiedFrom || undefined,
    internalReference: values.internalReference || undefined,
    reference: values.reference || undefined,
    inkoper: values.inkoper || undefined,
    purchaserInitials: values.purchaserInitials || undefined,
    isPrinted: values.isPrinted,
    isMailed: values.isMailed,
    arrangeTransport: values.arrangeTransport,
    pickupDropoffCdPurchases: values.pickupDropoffCdPurchases,
    isOverlengte: values.isOverlengte,
    remarks: values.remarks || undefined,
  });

  const handlePurchaseOrderOpenChange = (open: boolean) => {
    if (!open) {
      purchaseOrderForm.reset(DEFAULT_PURCHASE_ORDER);
      setEditingPurchaseOrderIndex(null);
    }
    setIsPurchaseOrderDialogOpen(open);
  };

  const handleOpenPurchaseOrder = () => {
    setEditingPurchaseOrderIndex(null);
    purchaseOrderForm.reset({
      ...DEFAULT_PURCHASE_ORDER,
      orderDate: todayDateString(),
    });
    setIsPurchaseOrderDialogOpen(true);
  };

  const handleEditPurchaseOrder = (index: number) => {
    const order = purchaseOrders[index];
    if (!order) return;
    setEditingPurchaseOrderIndex(index);
    purchaseOrderForm.reset({
      status: order.status ?? "open",
      purchaseOrderType: order.purchaseOrderType ?? "",
      forOrder: order.forOrder ?? "",
      orderDate: order.orderDate ?? "",
      deliveryDate: order.deliveryDate
        ? new Date(order.deliveryDate).toISOString().split("T")[0]
        : "",
      amount: order.amount ?? "0.00",
      weightKg: order.weightKg ?? "0.000",
      confirmationReference: order.confirmationReference ?? "",
      confirmationDate: order.confirmationDate ?? "",
      copiedFrom: order.copiedFrom ?? "",
      internalReference: order.internalReference ?? "",
      reference: order.reference ?? "",
      inkoper: order.inkoper ?? "",
      purchaserInitials: order.purchaserInitials ?? "",
      isPrinted: order.isPrinted ?? false,
      isMailed: order.isMailed ?? false,
      arrangeTransport: order.arrangeTransport ?? false,
      pickupDropoffCdPurchases: order.pickupDropoffCdPurchases ?? false,
      isOverlengte: order.isOverlengte ?? false,
      remarks: order.remarks ?? "",
    });
    setIsPurchaseOrderDialogOpen(true);
  };

  const handleCancelPurchaseOrder = () => {
    purchaseOrderForm.reset(DEFAULT_PURCHASE_ORDER);
    setEditingPurchaseOrderIndex(null);
    setIsPurchaseOrderDialogOpen(false);
  };

  const handleSavePurchaseOrder = purchaseOrderForm.handleSubmit((values) => {
    const entry = mapPurchaseOrder(values);
    setPurchaseOrders((prev) =>
      editingPurchaseOrderIndex === null
        ? [...prev, entry]
        : prev.map((order, i) =>
            i === editingPurchaseOrderIndex ? entry : order,
          ),
    );
    purchaseOrderForm.reset(DEFAULT_PURCHASE_ORDER);
    setEditingPurchaseOrderIndex(null);
    setIsPurchaseOrderDialogOpen(false);
  });

  const removePurchaseOrder = (index: number) =>
    setPurchaseOrders((prev) => prev.filter((_, i) => i !== index));

  // ── Quote handlers ───────────────────────────────────────────────────────────

  const mapQuote = (values: QuoteDialogValues): CompanyQuoteInput => ({
    customerRef: values.customerRef || undefined,
    ourReference: values.ourReference || undefined,
    requestMethod: (values.requestMethod ||
      undefined) as CompanyQuoteInput["requestMethod"],
    seller: values.seller || undefined,
    quoteDate: values.quoteDate ? new Date(values.quoteDate) : undefined,
    decisionDate: values.decisionDate
      ? new Date(values.decisionDate)
      : undefined,
    priceDate: values.priceDate ? new Date(values.priceDate) : undefined,
    validUntil: values.validUntil ? new Date(values.validUntil) : undefined,
    validityPeriodDays: values.validityPeriodDays
      ? Number(values.validityPeriodDays)
      : undefined,
    weightType: (values.weightType ||
      undefined) as CompanyQuoteInput["weightType"],
    deliveryTerms: (values.deliveryTerms ||
      undefined) as CompanyQuoteInput["deliveryTerms"],
    paymentTerms: (values.paymentTerms ||
      undefined) as CompanyQuoteInput["paymentTerms"],
    isPickup: values.isPickup,
    isIncidental: values.isIncidental,
    isConsignment: values.isConsignment,
    isOverlengte: values.isOverlengte,
    handlingBlocked: values.handlingBlocked,
    totalWeightKg: values.totalWeightKg || "0.00",
    totalExclVat: values.totalExclVat || "0.00",
    remarks: values.remarks || undefined,
  });

  const handleQuoteOpenChange = (open: boolean) => {
    if (!open) {
      quoteForm.reset(DEFAULT_QUOTE);
      setEditingQuoteIndex(null);
    }
    setIsQuoteDialogOpen(open);
  };

  const handleOpenQuote = () => {
    setEditingQuoteIndex(null);
    quoteForm.reset({ ...DEFAULT_QUOTE, quoteDate: todayDateString() });
    setIsQuoteDialogOpen(true);
  };

  const handleEditQuote = (index: number) => {
    const quote = quotes[index];
    if (!quote) {
      return;
    }
    setEditingQuoteIndex(index);
    quoteForm.reset({
      customerRef: quote.customerRef ?? "",
      ourReference: quote.ourReference ?? "",
      requestMethod: quote.requestMethod ?? "",
      seller: quote.seller ?? "",
      quoteDate: quote.quoteDate
        ? new Date(quote.quoteDate).toISOString().split("T")[0]
        : "",
      decisionDate: quote.decisionDate
        ? new Date(quote.decisionDate).toISOString().split("T")[0]
        : "",
      priceDate: quote.priceDate
        ? new Date(quote.priceDate).toISOString().split("T")[0]
        : "",
      validUntil: quote.validUntil
        ? new Date(quote.validUntil).toISOString().split("T")[0]
        : "",
      validityPeriodDays:
        quote.validityPeriodDays != null
          ? String(quote.validityPeriodDays)
          : "",
      weightType: quote.weightType ?? "",
      deliveryTerms: quote.deliveryTerms ?? "",
      paymentTerms: quote.paymentTerms ?? "",
      isPickup: quote.isPickup ?? false,
      isIncidental: quote.isIncidental ?? false,
      isConsignment: quote.isConsignment ?? false,
      isOverlengte: quote.isOverlengte ?? false,
      handlingBlocked: quote.handlingBlocked ?? false,
      totalWeightKg: quote.totalWeightKg ?? "0.00",
      totalExclVat: quote.totalExclVat ?? "0.00",
      remarks: quote.remarks ?? "",
    });
    setIsQuoteDialogOpen(true);
  };

  const handleCancelQuote = () => {
    quoteForm.reset(DEFAULT_QUOTE);
    setEditingQuoteIndex(null);
    setIsQuoteDialogOpen(false);
  };

  const handleSaveQuote = quoteForm.handleSubmit((values) => {
    const entry = mapQuote(values);
    setQuotes((prev) =>
      editingQuoteIndex === null
        ? [...prev, entry]
        : prev.map((quote, i) => (i === editingQuoteIndex ? entry : quote)),
    );
    quoteForm.reset(DEFAULT_QUOTE);
    setEditingQuoteIndex(null);
    setIsQuoteDialogOpen(false);
  });

  const removeQuote = (index: number) =>
    setQuotes((prev) => prev.filter((_, i) => i !== index));

  // ── Return order handlers ────────────────────────────────────────────────────

  const mapReturnOrder = (
    values: ReturnOrderDialogValues,
  ): CompanyReturnOrderInput => ({
    orderReference: values.orderReference || undefined,
    customerRef: values.customerRef || undefined,
    ourReference: values.ourReference || undefined,
    status: values.status,
    orderDate: values.orderDate || undefined,
    complaintRef: values.complaintRef || undefined,
    returnReason: values.returnReason,
    totalWeightKg: values.totalWeightKg || "0.00",
    totalExclVat: values.totalExclVat || "0.00",
    handlingBlocked: values.handlingBlocked,
    remarks: values.remarks || undefined,
  });

  const handleReturnOrderOpenChange = (open: boolean) => {
    if (!open) {
      returnOrderForm.reset(DEFAULT_RETURN_ORDER);
      setEditingReturnOrderIndex(null);
    }
    setIsReturnOrderDialogOpen(open);
  };

  const handleOpenReturnOrder = () => {
    setEditingReturnOrderIndex(null);
    returnOrderForm.reset({
      ...DEFAULT_RETURN_ORDER,
      orderDate: todayDateString(),
    });
    setIsReturnOrderDialogOpen(true);
  };

  const handleEditReturnOrder = (index: number) => {
    const order = returnOrders[index];
    if (!order) {
      return;
    }
    setEditingReturnOrderIndex(index);
    returnOrderForm.reset({
      orderReference: order.orderReference ?? "",
      customerRef: order.customerRef ?? "",
      ourReference: order.ourReference ?? "",
      status: order.status ?? "open",
      orderDate: order.orderDate ?? "",
      complaintRef: order.complaintRef ?? "",
      returnReason: order.returnReason ?? ("" as ReturnOrderDialogValues["returnReason"]),
      totalWeightKg: order.totalWeightKg ?? "0.00",
      totalExclVat: order.totalExclVat ?? "0.00",
      handlingBlocked: order.handlingBlocked ?? false,
      remarks: order.remarks ?? "",
    });
    setIsReturnOrderDialogOpen(true);
  };

  const handleCancelReturnOrder = () => {
    returnOrderForm.reset(DEFAULT_RETURN_ORDER);
    setEditingReturnOrderIndex(null);
    setIsReturnOrderDialogOpen(false);
  };

  const handleSaveReturnOrder = returnOrderForm.handleSubmit((values) => {
    const entry = mapReturnOrder(values);
    setReturnOrders((prev) =>
      editingReturnOrderIndex === null
        ? [...prev, entry]
        : prev.map((order, i) =>
            i === editingReturnOrderIndex ? entry : order,
          ),
    );
    returnOrderForm.reset(DEFAULT_RETURN_ORDER);
    setEditingReturnOrderIndex(null);
    setIsReturnOrderDialogOpen(false);
  });

  const removeReturnOrder = (index: number) =>
    setReturnOrders((prev) => prev.filter((_, i) => i !== index));

  // ── Follow-up handlers (inline grid) ─────────────────────────────────────────

  // "New" appends a row with the date and "by" auto-filled; the contact person,
  // text and completed flag are edited inline in the grid.
  const addFollowUp = () =>
    setFollowUps((prev) => [
      ...prev,
      {
        date: todayDateString(),
        by: currentUserName ?? undefined,
        contactPerson: "",
        text: "",
        completed: false,
      },
    ]);

  const updateFollowUp = (
    index: number,
    patch: Partial<CompanyFollowUpInput>,
  ) =>
    setFollowUps((prev) =>
      prev.map((followUp, i) =>
        i === index ? { ...followUp, ...patch } : followUp,
      ),
    );

  const removeFollowUp = (index: number) =>
    setFollowUps((prev) => prev.filter((_, i) => i !== index));

  // ── Processing handlers (inline grid) ────────────────────────────────────────

  // "New" appends a blank processing row; every column is edited inline.
  const addProcessing = () =>
    setProcessings((prev) => [
      ...prev,
      {
        editing: undefined,
        preference: false,
        supplierUuid: undefined,
        deliveryTime: 0,
        deliveryTimeUnit: undefined,
        processorLocation: undefined,
      },
    ]);

  const updateProcessing = (
    index: number,
    patch: Partial<CompanyProcessingInput>,
  ) =>
    setProcessings((prev) =>
      prev.map((processing, i) =>
        i === index ? { ...processing, ...patch } : processing,
      ),
    );

  const removeProcessing = (index: number) =>
    setProcessings((prev) => prev.filter((_, i) => i !== index));

  // ── Role handler ─────────────────────────────────────────────────────────────

  const toggleRole = (role: CompanyRole) => {
    const isSelected = selectedRoles.includes(role);
    if (!isSelected && disabledRoles.has(role)) return;

    const nextRoles = isSelected
      ? selectedRoles.filter((r) => r !== role)
      : [...selectedRoles, role];

    form.setValue("roles", nextRoles);

    if (!isSelected || !isContractableRole(role)) return;

    const nextContractableRoles = nextRoles.filter(isContractableRole);
    const allowedRoles = new Set(nextContractableRoles);

    setContracts((prev) => {
      const nextContracts = prev.filter((contract) => {
        const contractRole = contract.role;
        return contractRole != null && allowedRoles.has(contractRole);
      });
      return nextContracts.length === prev.length ? prev : nextContracts;
    });

    if (nextContractableRoles.length === 0) {
      contractSelectionForm.reset(DEFAULT_CONTRACT_SELECTION);
      setIsContractDialogOpen(false);
      return;
    }

    const currentDialogRole = contractSelectionForm.getValues("role");
    const nextDialogRole = getDefaultContractRole(nextContractableRoles);

    if (
      currentDialogRole !== nextDialogRole &&
      (!currentDialogRole ||
        !allowedRoles.has(currentDialogRole) ||
        nextContractableRoles.length === 1)
    ) {
      contractSelectionForm.setValue("role", nextDialogRole);
    }
  };

  // ── Main submit ──────────────────────────────────────────────────────────────

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const {
        companyName,
        correspName,
        remarks,
        lang,
        roles,
        searchCode1,
        searchCode2,
        searchCode3,
        documents,
        address,
        debtorCompanyUuid,
        iban,
        bic,
        bankAccount,
        postbankAccount,
        purchaseOrgCompanyUuid,
        memberNumberPurchaseOrg,
        calculateVat,
        reminder,
        collectInvoicesInMandate,
        insuranceValidUntil,
        creditLimitInsurance,
        creditLimit,
        creditLimitUninsured,
        creditLimitUninsuredDate,
        paymentTerms,
        differentPaymentTermsExWorks,
        journalCode,
        vatNumber,
        cocNumber,
        currency,
        isBlocked,
        blockedByNote,
      } = values;
      const isCustomerOrProspect =
        roles?.includes("customer") || roles?.includes("prospect");
      const allAddresses = [address, ...additionalAddresses].map(mapAddress);
      const allProducts = [...products, ...customerProducts];
      // If a visit report was added before any contact existed, back-fill the
      // sole contact so a single-contact company links automatically.
      const resolvedVisitReports = visitReports.map((report) => {
        if (report.contactIndex != null || contacts.length !== 1) return report;
        return {
          ...report,
          contactIndex: 0,
          representative: report.representative ?? contactLabel(contacts[0]),
        };
      });
      const result = await createCompany(
        {
          companyName,
          correspName: correspName || undefined,
          remarks: remarks || undefined,
          lang: lang || undefined,
          searchCode1: searchCode1 || undefined,
          searchCode2: searchCode2 || undefined,
          searchCode3: searchCode3 || undefined,
          roles: (roles ?? []) as CompanyRole[],
          documents: documents.length > 0 ? documents : undefined,
          ...(salesData ?? {}),
          debtorCompanyUuid: debtorCompanyUuid || undefined,
          iban: iban || undefined,
          bic: bic || undefined,
          bankAccount: bankAccount || undefined,
          postbankAccount: postbankAccount || undefined,
          purchaseOrgCompanyUuid: isCustomerOrProspect
            ? purchaseOrgCompanyUuid || undefined
            : undefined,
          memberNumberPurchaseOrg: isCustomerOrProspect
            ? memberNumberPurchaseOrg || undefined
            : undefined,
          calculateVat,
          reminder,
          collectInvoicesInMandate,
          insuranceValidUntil: insuranceValidUntil
            ? new Date(insuranceValidUntil)
            : null,
          creditLimitInsurance: creditLimitInsurance
            ? String(creditLimitInsurance)
            : undefined,
          creditLimit: creditLimit ? String(creditLimit) : undefined,
          creditLimitUninsured: creditLimitUninsured
            ? String(creditLimitUninsured)
            : undefined,
          creditLimitUninsuredDate: creditLimitUninsuredDate
            ? new Date(creditLimitUninsuredDate)
            : null,
          paymentTerms: paymentTerms || undefined,
          differentPaymentTermsExWorks:
            differentPaymentTermsExWorks || undefined,
          journalCode: journalCode ?? undefined,
          vatNumber: vatNumber || undefined,
          cocNumber: cocNumber || undefined,
          currency: (currency || undefined) as InsertCompanies["currency"],
          blockedByNote: blockedByNote || undefined,
          invoicingMethod: (values.invoicingMethod ||
            undefined) as InsertCompanies["invoicingMethod"],
          collectiveInvoicing: values.collectiveInvoicing,
          invoicePackagingAtZeroPrice: values.invoicePackagingAtZeroPrice,
          printCommodityCode: values.printCommodityCode,
          invoiceFrequency: values.invoiceFrequency,
          invoicePrintEnabled: values.invoicePrintEnabled,
          invoicePrintCount: values.invoicePrintCount,
          invoiceEmailEnabled: values.invoiceEmailEnabled,
          invoiceEmailTo: values.invoiceEmailTo || undefined,
          printEmailZeroValueInvoices: values.printEmailZeroValueInvoices,
          sendXmlWithInvoice: values.sendXmlWithInvoice,
          industry: values.industry || undefined,
          classification: (values.classification ||
            undefined) as InsertCompanies["classification"],
          visitFrequency: values.visitFrequency
            ? Number(values.visitFrequency)
            : undefined,
          callFrequencyPerYear: values.callFrequencyPerYear
            ? Number(values.callFrequencyPerYear)
            : undefined,
          targetDateNextVisit: values.targetDateNextVisit
            ? new Date(values.targetDateNextVisit)
            : null,
          visitReason: (values.visitReason ||
            undefined) as InsertCompanies["visitReason"],
          potentialAnnualRevenue: values.potentialAnnualRevenue
            ? String(values.potentialAnnualRevenue)
            : undefined,
          targetAnnualRevenue: values.targetAnnualRevenue
            ? String(values.targetAnnualRevenue)
            : undefined,
          potentialAnnualSales: values.potentialAnnualSales
            ? String(values.potentialAnnualSales)
            : undefined,
          targetAnnualSales: values.targetAnnualSales
            ? String(values.targetAnnualSales)
            : undefined,
          numberOfEmployees: values.numberOfEmployees
            ? Number(values.numberOfEmployees)
            : undefined,
          visitPlanning: values.visitPlanning,
        },
        isBlocked,
        allAddresses,
        communicationSettings,
        contracts,
        contacts,
        texts,
        projects,
        counterOrders,
        allProducts,
        resolvedVisitReports,
        purchaseOrders,
        quotes,
        followUps,
        returnOrders,
        processings,
        customerStock,
      );
      setState(result);
      if (result.success) router.push("/companies");
    });
  });

  return {
    form,
    isPending,
    onSubmit,
    state,

    selectedRoles,
    disabledRoles,
    activeContractableRoles,
    hasFirstAddress,
    addressValues,
    availableForNext,

    langOptions,
    documentTypeOptions,
    communicationTypeOptions,
    shapeOptions,
    paymentTermOptions,
    currencyOptions,
    debtorCompanyOptions,
    purchaseOrgOptions,

    additionalForm,
    additionalAddresses,
    isFirstAddressDialogOpen,
    setIsFirstAddressDialogOpen,
    isAdditionalAddressDialogOpen,
    handleAdditionalAddressOpenChange,
    handleCancelFirstAddress,
    handleCancelAdditionalAddress,
    handleSaveFirstAddress,
    handleSaveAdditionalAddress,
    removeAdditionalAddress,
    addressLabel,

    commSettingForm,
    communicationSettings,
    selectedCommType,
    setSelectedCommType,
    isCommSettingDialogOpen,
    handleCommSettingOpenChange,
    handleOpenCommSetting,
    handleCancelCommSetting,
    handleSaveCommSetting,
    removeCommSetting,
    commSettingLabel,

    contractSelectionForm,
    contracts,
    isContractDialogOpen,
    handleContractOpenChange,
    handleOpenContract,
    handleCancelContract,
    handleSaveContract,
    removeContract,

    contactForm,
    contacts,
    isContactDialogOpen,
    handleContactOpenChange,
    handleOpenContact,
    handleCancelContact,
    handleSaveContact,
    toggleContactCategory,
    removeContact,

    textForm,
    texts,
    isTextDialogOpen,
    handleTextOpenChange,
    handleOpenText,
    handleCancelText,
    handleSaveText,
    handleCategorySelect,
    removeText,

    projectForm,
    projects,
    isProjectDialogOpen,
    handleProjectOpenChange,
    handleOpenProject,
    handleCancelProject,
    handleSaveProject,
    removeProject,

    counterOrderForm,
    counterOrders,
    isCounterOrderDialogOpen,
    isEditingCounterOrder: editingCounterOrderIndex !== null,
    handleCounterOrderOpenChange,
    handleOpenCounterOrder,
    handleEditCounterOrder,
    handleCancelCounterOrder,
    handleSaveCounterOrder,
    removeCounterOrder,

    productForm,
    products,
    isProductDialogOpen,
    isProductPickerOpen,
    setIsProductPickerOpen,
    pickedProduct,
    handleProductOpenChange,
    handleOpenProduct,
    handleCancelProduct,
    handleSaveProduct,
    handleOpenProductPicker,
    handleCancelProductPicker,
    handlePickProduct,
    removeProduct,
    productGroups,
    availableProducts,

    customerProductForm,
    customerProducts,
    isCustomerProductDialogOpen,
    isCustomerProductPickerOpen,
    setIsCustomerProductPickerOpen,
    pickedCustomerProduct,
    handleCustomerProductOpenChange,
    handleOpenCustomerProduct,
    handleCancelCustomerProduct,
    handleSaveCustomerProduct,
    handleOpenCustomerProductPicker,
    handleCancelCustomerProductPicker,
    handlePickCustomerProduct,
    removeCustomerProduct,

    customerStockForm,
    customerStock,
    isCustomerStockDialogOpen,
    isCustomerStockPickerOpen,
    setIsCustomerStockPickerOpen,
    pickedCustomerStockProduct,
    handleCustomerStockOpenChange,
    handleOpenCustomerStock,
    handleCancelCustomerStock,
    handleSaveCustomerStock,
    handleOpenCustomerStockPicker,
    handleCancelCustomerStockPicker,
    handlePickCustomerStockProduct,
    removeCustomerStock,

    visitReportForm,
    visitReports,
    isVisitReportDialogOpen,
    isEditingVisitReport: editingVisitReportIndex !== null,
    handleVisitReportOpenChange,
    handleOpenVisitReport,
    handleEditVisitReport,
    handleCancelVisitReport,
    handleSaveVisitReport,
    removeVisitReport,

    purchaseOrderForm,
    purchaseOrders,
    isPurchaseOrderDialogOpen,
    isEditingPurchaseOrder: editingPurchaseOrderIndex !== null,
    handlePurchaseOrderOpenChange,
    handleOpenPurchaseOrder,
    handleEditPurchaseOrder,
    handleCancelPurchaseOrder,
    handleSavePurchaseOrder,
    removePurchaseOrder,

    quoteForm,
    quotes,
    isQuoteDialogOpen,
    isEditingQuote: editingQuoteIndex !== null,
    handleQuoteOpenChange,
    handleOpenQuote,
    handleEditQuote,
    handleCancelQuote,
    handleSaveQuote,
    removeQuote,

    returnOrderForm,
    returnOrders,
    isReturnOrderDialogOpen,
    isEditingReturnOrder: editingReturnOrderIndex !== null,
    handleReturnOrderOpenChange,
    handleOpenReturnOrder,
    handleEditReturnOrder,
    handleCancelReturnOrder,
    handleSaveReturnOrder,
    removeReturnOrder,

    followUps,
    addFollowUp,
    updateFollowUp,
    removeFollowUp,

    processings,
    addProcessing,
    updateProcessing,
    removeProcessing,
    supplierOptions,

    toggleRole,

    salesData,
    setSalesData,

    availableContracts,
    projectContracts,
    textCategories,
  };
};
