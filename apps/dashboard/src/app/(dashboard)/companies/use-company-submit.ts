"use client";

import {
  ContractForProjectOption,
  ContractListItem,
} from "@/app/(dashboard)/contracts/actions";
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
  CompanyPurchaseOrderInput,
  CompanyTextInput,
  createCompany,
  CustomerProjectInput,
  CustomerSalesInput,
  DebtorCompanyOption,
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
  createCompanySchema,
  DEFAULT_ADDRESS,
  DEFAULT_COMM_SETTING,
  DEFAULT_CONTACT,
  DEFAULT_CONTRACT_SELECTION,
  DEFAULT_PURCHASE_ORDER,
  DEFAULT_TEXT,
  purchaseOrderDialogSchema,
  PurchaseOrderDialogValues,
  textDialogSchema,
  TextDialogValues,
  USAGE_CATEGORY_FIELDS,
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
};

export const useCompanySubmit = ({
  availableContracts,
  projectContracts,
  textCategories,
  debtorCompanies,
  purchaseOrgCompanies,
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
  const [isPurchaseOrderDialogOpen, setIsPurchaseOrderDialogOpen] =
    useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<
    CompanyPurchaseOrderInput[]
  >([]);
  const [editingPurchaseOrderIndex, setEditingPurchaseOrderIndex] = useState<
    number | null
  >(null);

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

  const projectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: DEFAULT_PROJECT,
  });

  const purchaseOrderForm = useForm<PurchaseOrderDialogValues>({
    resolver: zodResolver(purchaseOrderDialogSchema),
    defaultValues: DEFAULT_PURCHASE_ORDER,
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

  const removeContact = (index: number) =>
    setContacts((prev) => prev.filter((_, i) => i !== index));

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
        },
        isBlocked,
        allAddresses,
        communicationSettings,
        contracts,
        contacts,
        texts,
        projects,
        purchaseOrders,
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

    toggleRole,

    salesData,
    setSalesData,

    availableContracts,
    projectContracts,
    textCategories,
  };
};
