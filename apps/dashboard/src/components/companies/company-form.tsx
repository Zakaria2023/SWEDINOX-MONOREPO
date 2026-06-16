"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, MapPin, MessageSquare, Plus, ShoppingCart, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { CommSettingInput, CompanyContractInput, CustomerSalesInput } from "@/app/(dashboard)/companies/actions";
import type { ContractListItem } from "@/app/(dashboard)/contracts/actions";
import type { SelectCustomerGroups } from "@/db";
import {
  createCompanySchema,
  type AddressFormValues,
  type CompanyFormValues,
} from "@/app/(dashboard)/companies/validation";
import { useCompanySubmit } from "@/app/(dashboard)/companies/use-company-submit";
import { AddressForm } from "@/components/companies/address-form";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import {
  addressCategories,
  communicationSettingDocumentTypes,
  communicationSettingShapes,
  communicationSettingTypes,
  companyLangs,
  companyRoles,
  contractableRoles,
  devTheorWtOptions,
  ediOptions,
  groupLinesByDescriptionOptions,
  miscellaneousOptions,
  orderOptions,
  printProductCodesOptions,
  quoteOptions,
  quoteOrderInvoiceOptions,
  quoteOrderOptions,
  salesRepresentatives,
  type AddressCategory,
  type CompanyRole,
  type ContractableRole,
  type DevTheorWt,
  type EdiOption,
  type GroupLinesByDescription,
  type MiscellaneousOption,
  type OrderOption,
  type PrintProductCodes,
  type QuoteOption,
  type QuoteOrderInvoiceOption,
  type QuoteOrderOption,
  type SalesRepresentative,
} from "@/lib/enums";
import { cn } from "@/lib/helpers";
import {
  ADDRESS_CATEGORY_LABELS,
  COMMON_TEXT,
  COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS,
  COMMUNICATION_SETTING_SHAPE_LABELS,
  COMMUNICATION_SETTING_TYPE_LABELS,
  COMPANY_LANGUAGE_LABELS,
  COMPANY_ROLE_LABELS,
  CONTRACT_TYPE_LABELS,
  CONTRACTABLE_ROLE_LABELS,
  DEV_THEOR_WT_LABELS,
  EDI_OPTION_LABELS,
  GROUP_LINES_BY_DESCRIPTION_LABELS,
  MISCELLANEOUS_OPTION_LABELS,
  ORDER_OPTION_LABELS,
  PRINT_PRODUCT_CODES_LABELS,
  QUOTE_OPTION_LABELS,
  QUOTE_ORDER_INVOICE_OPTION_LABELS,
  QUOTE_ORDER_OPTION_LABELS,
  SALES_REPRESENTATIVE_LABELS,
} from "@/lib/labels";

const DEFAULT_ADDRESS: CompanyFormValues["address"] = {
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

const AGENT_ALLOWED = new Set<CompanyRole>(["agent", "other", "internal"]);
const PURCHASING_ORG_ALLOWED = new Set<CompanyRole>(["purchasing_org", "other"]);

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
  if (selected.some((r) => !PURCHASING_ORG_ALLOWED.has(r))) disabled.add("purchasing_org");

  return disabled;
};

const commSettingSchema = z.object({
  documentType: z.string().min(1),
  communicationType: z.string().min(1),
  shape: z.string().optional(),
  email: z.string().optional(),
  fax: z.string().optional(),
});

type CommSettingFormValues = z.infer<typeof commSettingSchema>;

const DEFAULT_COMM_SETTING: CommSettingFormValues = {
  documentType: "",
  communicationType: "",
  shape: "",
  email: "",
  fax: "",
};

const contractSelectionSchema = z.object({
  contractUuid: z.string().min(1, "Please select a contract"),
  role: z.enum(contractableRoles, { error: "Role is required" }),
});

type ContractSelectionValues = z.infer<typeof contractSelectionSchema>;

const DEFAULT_CONTRACT_SELECTION: ContractSelectionValues = {
  contractUuid: "",
  role: "" as ContractableRole,
};

const salesSchema = z.object({
  customerGroupUuid: z.string().optional(),
  representative: z.string().optional(),
  accountManager: z.string().optional(),
  region: z.string().optional(),
  memberOf: z.string().optional(),
  miscellaneousSettings: z.array(z.string()),
  deliveryCondition: z.string().optional(),
  devTheorWt: z.string().optional(),
  defTransport: z.string().optional(),
  quoteOrderSettings: z.array(z.string()),
  groupLinesByLongProductGroupDescription: z.string().optional(),
  printProductCodesOnOutgoingDocuments: z.string().optional(),
  quoteOrderInvoiceSettings: z.array(z.string()),
  orderSettings: z.array(z.string()),
  quoteSettings: z.array(z.string()),
  websiteQuoteMustBeApproved: z.boolean(),
  websiteQuoteApprovalAmount: z.string().optional(),
  releaseActionPrint: z.boolean(),
  releaseActionEmailEnabled: z.boolean(),
  releaseActionEmailTo: z.string().optional(),
  releaseActionFaxEnabled: z.boolean(),
  releaseActionFaxTo: z.string().optional(),
  actionPrint: z.boolean(),
  actionEmailEnabled: z.boolean(),
  actionEmailTo: z.string().optional(),
  actionFaxEnabled: z.boolean(),
  actionFaxTo: z.string().optional(),
  ediSettings: z.array(z.string()),
});

type SalesFormValues = z.infer<typeof salesSchema>;

const DEFAULT_SALES: SalesFormValues = {
  customerGroupUuid: "",
  representative: "",
  accountManager: "",
  region: "",
  memberOf: "",
  miscellaneousSettings: [],
  deliveryCondition: "",
  devTheorWt: "",
  defTransport: "",
  quoteOrderSettings: [],
  groupLinesByLongProductGroupDescription: "",
  printProductCodesOnOutgoingDocuments: "",
  quoteOrderInvoiceSettings: [],
  orderSettings: [],
  quoteSettings: [],
  websiteQuoteMustBeApproved: false,
  websiteQuoteApprovalAmount: "",
  releaseActionPrint: false,
  releaseActionEmailEnabled: false,
  releaseActionEmailTo: "",
  releaseActionFaxEnabled: false,
  releaseActionFaxTo: "",
  actionPrint: false,
  actionEmailEnabled: false,
  actionEmailTo: "",
  actionFaxEnabled: false,
  actionFaxTo: "",
  ediSettings: [],
};

type CompanyFormProps = {
  availableContracts: ContractListItem[];
  customerGroups: SelectCustomerGroups[];
};

export const CompanyForm = ({ availableContracts, customerGroups }: CompanyFormProps) => {
  const router = useRouter();
  const [isFirstAddressDialogOpen, setIsFirstAddressDialogOpen] =
    useState(false);
  const [isAdditionalAddressDialogOpen, setIsAdditionalAddressDialogOpen] =
    useState(false);
  const [additionalAddresses, setAdditionalAddresses] = useState<
    AddressFormValues[]
  >([]);
  const [isCommSettingDialogOpen, setIsCommSettingDialogOpen] =
    useState(false);
  const [communicationSettings, setCommunicationSettings] = useState<
    CommSettingInput[]
  >([]);
  const [selectedCommType, setSelectedCommType] = useState("");
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [contracts, setContracts] = useState<CompanyContractInput[]>([]);
  const [isSalesDialogOpen, setIsSalesDialogOpen] = useState(false);
  const [salesData, setSalesData] = useState<CustomerSalesInput | null>(null);

  const { form, isPending, onSubmit, state } = useCompanySubmit();
  const {
    control,
    register,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = form;

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

  const commSettingForm = useForm<CommSettingFormValues>({
    resolver: zodResolver(commSettingSchema),
    defaultValues: DEFAULT_COMM_SETTING,
  });

  const contractSelectionForm = useForm<ContractSelectionValues>({
    resolver: zodResolver(contractSelectionSchema),
    defaultValues: DEFAULT_CONTRACT_SELECTION,
  });

  const salesForm = useForm<SalesFormValues>({
    resolver: zodResolver(salesSchema),
    defaultValues: DEFAULT_SALES,
  });

  const addressValues = watch("address");
  const selectedRoles: CompanyRole[] = watch("roles") ?? [];
  const disabledRoles = getDisabledRoles(selectedRoles);
  const activeContractableRoles = selectedRoles.filter((r): r is ContractableRole =>
    (contractableRoles as readonly string[]).includes(r),
  );
  const isCustomerOrProspect =
    selectedRoles.includes("customer") || selectedRoles.includes("prospect");

  const usedCategories = new Set<AddressCategory>([
    ...(addressValues.category ?? []),
    ...additionalAddresses.flatMap((a) => a.category),
  ]);
  const NON_DELIVERY: AddressCategory[] = addressCategories.filter((c) => c !== "delivery");
  const availableForNext: AddressCategory[] = [
    ...NON_DELIVERY.filter((c) => !usedCategories.has(c)),
    "delivery",
  ];

  useEffect(() => {
    if (state.success) {
      router.push("/companies");
    }
  }, [router, state.success]);

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

  const handleSaveFirstAddress = async () => {
    if (await trigger("address")) {
      setIsFirstAddressDialogOpen(false);
    }
  };

  const handleSaveAdditionalAddress = async () => {
    if (!(await additionalForm.trigger("address"))) {
      return;
    }

    const values = additionalForm.getValues("address");
    setAdditionalAddresses((prev) => [...prev, values]);
    resetAdditionalForm();
    setIsAdditionalAddressDialogOpen(false);
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
            ? (values.email || undefined)
            : undefined,
        fax:
          values.communicationType === "fax"
            ? (values.fax || undefined)
            : undefined,
      },
    ]);

    commSettingForm.reset(DEFAULT_COMM_SETTING);
    setSelectedCommType("");
    setIsCommSettingDialogOpen(false);
  });

  const handleSaveContract = contractSelectionForm.handleSubmit((values) => {
    const selected = availableContracts.find((c) => c.uuid === values.contractUuid);
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

  const handleSaveSales = salesForm.handleSubmit((values) => {
    setSalesData({
      customerGroupUuid: values.customerGroupUuid || undefined,
      representative: (values.representative as SalesRepresentative) || undefined,
      accountManager: (values.accountManager as SalesRepresentative) || undefined,
      region: values.region || undefined,
      memberOf: values.memberOf || undefined,
      miscellaneousSettings: values.miscellaneousSettings as MiscellaneousOption[],
      deliveryCondition: values.deliveryCondition || undefined,
      devTheorWt: (values.devTheorWt as DevTheorWt) || undefined,
      defTransport: values.defTransport || undefined,
      quoteOrderSettings: values.quoteOrderSettings as QuoteOrderOption[],
      groupLinesByLongProductGroupDescription: (values.groupLinesByLongProductGroupDescription as GroupLinesByDescription) || undefined,
      printProductCodesOnOutgoingDocuments: (values.printProductCodesOnOutgoingDocuments as PrintProductCodes) || undefined,
      quoteOrderInvoiceSettings: values.quoteOrderInvoiceSettings as QuoteOrderInvoiceOption[],
      orderSettings: values.orderSettings as OrderOption[],
      quoteSettings: values.quoteSettings as QuoteOption[],
      websiteQuoteMustBeApproved: values.websiteQuoteMustBeApproved,
      websiteQuoteApprovalAmount: values.websiteQuoteApprovalAmount || undefined,
      releaseActionPrint: values.releaseActionPrint,
      releaseActionEmailEnabled: values.releaseActionEmailEnabled,
      releaseActionEmailTo: values.releaseActionEmailTo || undefined,
      releaseActionFaxEnabled: values.releaseActionFaxEnabled,
      releaseActionFaxTo: values.releaseActionFaxTo || undefined,
      actionPrint: values.actionPrint,
      actionEmailEnabled: values.actionEmailEnabled,
      actionEmailTo: values.actionEmailTo || undefined,
      actionFaxEnabled: values.actionFaxEnabled,
      actionFaxTo: values.actionFaxTo || undefined,
      ediSettings: values.ediSettings as EdiOption[],
    });
    setIsSalesDialogOpen(false);
  });

  const toggleSalesOption = (field: keyof SalesFormValues, value: string) => {
    const current = salesForm.getValues(field) as string[];
    salesForm.setValue(
      field as Parameters<typeof salesForm.setValue>[0],
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    );
  };

  const toggleRole = (role: CompanyRole) => {
    if (!selectedRoles.includes(role) && disabledRoles.has(role)) return;
    setValue(
      "roles",
      selectedRoles.includes(role)
        ? selectedRoles.filter((r) => r !== role)
        : [...selectedRoles, role],
    );
  };

  const commSettingLabel = (setting: CommSettingInput) =>
    [
      COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS[setting.documentType],
      COMMUNICATION_SETTING_TYPE_LABELS[setting.communicationType],
    ].join(" - ");

  return (
    <>
      <form
        onSubmit={onSubmit(additionalAddresses, communicationSettings, contracts, salesData)}
        className="space-y-8"
      >
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
            Company Details
          </h2>
          <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <FormLabel htmlFor="companyName" required>
                  Company Name
                </FormLabel>
                <Input
                  id="companyName"
                  {...register("companyName")}
                  aria-invalid={!!errors.companyName}
                  placeholder="Enter the company name"
                  disabled={isPending}
                />
                <FormFieldError message={errors.companyName?.message} />
              </div>

              <FormSelectField
                control={control}
                id="lang"
                name="lang"
                label="Language"
                options={langOptions}
                emptyValue=""
                disabled={isPending}
              />

              <div>
                <FormLabel htmlFor="correspName">Corresp. Name</FormLabel>
                <Input
                  id="correspName"
                  {...register("correspName")}
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <FormLabel htmlFor="remarks">Remarks</FormLabel>
              <textarea
                id="remarks"
                {...register("remarks")}
                rows={3}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
                placeholder="Any additional remarks..."
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              {hasFirstAddress ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <MapPin className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-muted-foreground">
                      {addressLabel(addressValues)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFirstAddressDialogOpen(true)}
                    className="shrink-0 text-xs text-primary hover:underline"
                    disabled={isPending}
                  >
                    {COMMON_TEXT.edit}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsFirstAddressDialogOpen(true)}
                  className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  disabled={isPending}
                >
                  <Plus className="size-4" />
                  Add Address
                </button>
              )}

              {additionalAddresses.map((address, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <MapPin className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-muted-foreground">
                      {addressLabel(address)}
                    </span>
                    {address.category.map((cat) => (
                      <span key={cat} className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                        {ADDRESS_CATEGORY_LABELS[cat]}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setAdditionalAddresses((prev) =>
                        prev.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={isPending}
                  >
                    <X className="size-4" />
                    <span className="sr-only">Remove address</span>
                  </button>
                </div>
              ))}

              {hasFirstAddress && (
                <button
                  type="button"
                  onClick={() => setIsAdditionalAddressDialogOpen(true)}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  disabled={isPending}
                >
                  <Plus className="size-4" />
                  Add Address
                </button>
              )}
            </div>

            <div className="space-y-2">
              {communicationSettings.map((setting, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-muted-foreground">
                      {commSettingLabel(setting)}
                    </span>
                    {setting.shape && (
                      <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                        {COMMUNICATION_SETTING_SHAPE_LABELS[setting.shape]}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCommunicationSettings((prev) =>
                        prev.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={isPending}
                  >
                    <X className="size-4" />
                    <span className="sr-only">
                      Remove communication setting
                    </span>
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  commSettingForm.reset(DEFAULT_COMM_SETTING);
                  setSelectedCommType("");
                  setIsCommSettingDialogOpen(true);
                }}
                className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                disabled={isPending}
              >
                <Plus className="size-4" />
                Add Communication Setting
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
            Roles
          </h2>
          <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {companyRoles.map((role) => {
              const isDisabled = isPending || disabledRoles.has(role);
              return (
                <label
                  key={role}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-colors",
                    isDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-muted/40",
                  )}
                >
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border accent-primary"
                    checked={selectedRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                    disabled={isDisabled}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {COMPANY_ROLE_LABELS[role]}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {activeContractableRoles.length > 0 && (
          <section className="space-y-4">
            <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
              Contracts
            </h2>
            <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
              {contracts.map((contract, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="font-mono font-medium text-foreground">
                      {contract.code}
                    </span>
                    {contract.contractType && (
                      <span className="text-muted-foreground">
                        {CONTRACT_TYPE_LABELS[contract.contractType]}
                      </span>
                    )}
                    {contract.description && (
                      <span className="truncate text-muted-foreground">
                        — {contract.description}
                      </span>
                    )}
                    {contract.role && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                        {CONTRACTABLE_ROLE_LABELS[contract.role]}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setContracts((prev) =>
                        prev.filter((_, i) => i !== index),
                      )
                    }
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={isPending}
                  >
                    <X className="size-4" />
                    <span className="sr-only">Remove contract</span>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  contractSelectionForm.reset({
                    contractUuid: "",
                    role: activeContractableRoles.length === 1
                      ? activeContractableRoles[0]
                      : ("" as ContractableRole),
                  });
                  setIsContractDialogOpen(true);
                }}
                className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                disabled={isPending}
              >
                <Plus className="size-4" />
                Add Contract
              </button>
            </div>
          </section>
        )}

        {isCustomerOrProspect && (
          <section className="space-y-4">
            <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
              Sales
            </h2>
            <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
              {salesData ? (
                <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <ShoppingCart className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-muted-foreground">
                      Sales settings configured
                    </span>
                    {salesData.representative && (
                      <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                        {SALES_REPRESENTATIVE_LABELS[salesData.representative]}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      salesForm.reset(DEFAULT_SALES);
                      setIsSalesDialogOpen(true);
                    }}
                    className="shrink-0 text-xs text-primary hover:underline"
                    disabled={isPending}
                  >
                    {COMMON_TEXT.edit}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    salesForm.reset(DEFAULT_SALES);
                    setIsSalesDialogOpen(true);
                  }}
                  className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  disabled={isPending}
                >
                  <Plus className="size-4" />
                  Configure Sales Settings
                </button>
              )}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
            Search Codes
          </h2>
          <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-3">
            <div>
              <FormLabel htmlFor="searchCode1">Search Code</FormLabel>
              <Input
                id="searchCode1"
                {...register("searchCode1")}
                disabled={isPending}
              />
            </div>
            <div>
              <FormLabel htmlFor="searchCode2">Search Code</FormLabel>
              <Input
                id="searchCode2"
                {...register("searchCode2")}
                disabled={isPending}
              />
            </div>
            <div>
              <FormLabel htmlFor="searchCode3">Search Code</FormLabel>
              <Input
                id="searchCode3"
                {...register("searchCode3")}
                disabled={isPending}
              />
            </div>
          </div>
        </section>

        <FormError>{state.error}</FormError>

        <FormActions
          isPending={isPending}
          onCancel={() => router.push("/companies")}
          submitLabel="Create Company"
        />
      </form>

      <Dialog
        open={isFirstAddressDialogOpen}
        onOpenChange={setIsFirstAddressDialogOpen}
      >
        <DialogContent className="flex h-[85dvh] max-w-3xl flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b bg-background px-6 py-5">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="size-4" />
              Address
            </DialogTitle>
            <DialogDescription>
              Fill in the address details for this company.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <AddressForm
              control={control}
              errors={errors.address}
              register={register}
              watch={watch}
            />
          </div>
          <div className="shrink-0 border-t bg-background px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFirstAddressDialogOpen(false)}
              >
                {COMMON_TEXT.cancel}
              </Button>
              <Button type="button" onClick={handleSaveFirstAddress}>
                Save Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAdditionalAddressDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetAdditionalForm();
          }

          setIsAdditionalAddressDialogOpen(open);
        }}
      >
        <DialogContent className="flex h-[85dvh] max-w-3xl flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b bg-background px-6 py-5">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="size-4" />
              Address
            </DialogTitle>
            <DialogDescription>
              Fill in the address details. Categories already assigned to another address are not available.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <AddressForm
              control={additionalForm.control}
              errors={additionalForm.formState.errors.address}
              register={additionalForm.register}
              watch={additionalForm.watch}
              availableCategories={availableForNext}
            />
          </div>
          <div className="shrink-0 border-t bg-background px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetAdditionalForm();
                  setIsAdditionalAddressDialogOpen(false);
                }}
              >
                {COMMON_TEXT.cancel}
              </Button>
              <Button type="button" onClick={handleSaveAdditionalAddress}>
                Save Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCommSettingDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            commSettingForm.reset(DEFAULT_COMM_SETTING);
            setSelectedCommType("");
          }

          setIsCommSettingDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="size-4" />
              Communication Setting
            </DialogTitle>
            <DialogDescription>
              Add a communication setting for this company.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSaveCommSetting}
            className="mt-2 space-y-4 px-6 pb-6"
          >
            <div>
              <FormLabel htmlFor="cs-documentType" required>
                Document Type
              </FormLabel>
              <Controller
                name="documentType"
                control={commSettingForm.control}
                render={({ field }) => (
                  <Select
                    id="cs-documentType"
                    options={documentTypeOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={COMMON_TEXT.selectOption}
                  />
                )}
              />
              <FormFieldError
                message={commSettingForm.formState.errors.documentType?.message}
              />
            </div>

            <div>
              <FormLabel htmlFor="cs-communicationType" required>
                Communication Type
              </FormLabel>
              <Controller
                name="communicationType"
                control={commSettingForm.control}
                render={({ field }) => (
                  <Select
                    id="cs-communicationType"
                    options={communicationTypeOptions}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedCommType(value);
                      commSettingForm.setValue("email", "");
                      commSettingForm.setValue("fax", "");
                    }}
                    placeholder={COMMON_TEXT.selectOption}
                  />
                )}
              />
              <FormFieldError
                message={
                  commSettingForm.formState.errors.communicationType?.message
                }
              />
            </div>

            <div>
              <FormLabel htmlFor="cs-shape">Shape</FormLabel>
              <Controller
                name="shape"
                control={commSettingForm.control}
                render={({ field }) => (
                  <Select
                    id="cs-shape"
                    options={shapeOptions}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder={COMMON_TEXT.emptyOption}
                  />
                )}
              />
            </div>

            {selectedCommType === "email" && (
              <div>
                <FormLabel htmlFor="cs-email">Email</FormLabel>
                <Input
                  id="cs-email"
                  type="email"
                  {...commSettingForm.register("email")}
                />
              </div>
            )}

            {selectedCommType === "fax" && (
              <div>
                <FormLabel htmlFor="cs-fax">Fax</FormLabel>
                <Input id="cs-fax" {...commSettingForm.register("fax")} />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  commSettingForm.reset(DEFAULT_COMM_SETTING);
                  setSelectedCommType("");
                  setIsCommSettingDialogOpen(false);
                }}
              >
                {COMMON_TEXT.cancel}
              </Button>
              <Button type="submit">Add Setting</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isContractDialogOpen}
        onOpenChange={(open) => {
          if (!open) contractSelectionForm.reset(DEFAULT_CONTRACT_SELECTION);
          else contractSelectionForm.reset({
            contractUuid: "",
            role: activeContractableRoles.length === 1
              ? activeContractableRoles[0]
              : ("" as ContractableRole),
          });
          setIsContractDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-4" />
              Add Contract
            </DialogTitle>
            <DialogDescription>
              Select an existing contract and assign a role for this company.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSaveContract}
            className="mt-2 space-y-4 px-6 pb-6"
          >
            <div>
              <FormLabel htmlFor="ct-contract" required>
                Contract
              </FormLabel>
              <Controller
                name="contractUuid"
                control={contractSelectionForm.control}
                render={({ field }) => (
                  <Select
                    id="ct-contract"
                    options={[
                      { value: "", label: COMMON_TEXT.selectOption },
                      ...availableContracts.map((c) => ({
                        value: c.uuid,
                        label: `${c.code}${c.description ? ` — ${c.description}` : ""}`,
                      })),
                    ]}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={COMMON_TEXT.selectOption}
                  />
                )}
              />
              <FormFieldError message={contractSelectionForm.formState.errors.contractUuid?.message} />
            </div>

            <div>
              <FormLabel htmlFor="ct-role" required>Role</FormLabel>
              {activeContractableRoles.length === 1 ? (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {CONTRACTABLE_ROLE_LABELS[activeContractableRoles[0]]}
                  </span>
                </div>
              ) : (
                <Controller
                  name="role"
                  control={contractSelectionForm.control}
                  render={({ field }) => (
                    <Select
                      id="ct-role"
                      options={[
                        { value: "", label: COMMON_TEXT.selectOption },
                        ...activeContractableRoles.map((r) => ({
                          value: r,
                          label: CONTRACTABLE_ROLE_LABELS[r],
                        })),
                      ]}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder={COMMON_TEXT.selectOption}
                    />
                  )}
                />
              )}
              <FormFieldError message={contractSelectionForm.formState.errors.role?.message} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  contractSelectionForm.reset(DEFAULT_CONTRACT_SELECTION);
                  setIsContractDialogOpen(false);
                }}
              >
                {COMMON_TEXT.cancel}
              </Button>
              <Button type="submit">Add Contract</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isSalesDialogOpen}
        onOpenChange={(open) => {
          if (!open) salesForm.reset(DEFAULT_SALES);
          setIsSalesDialogOpen(open);
        }}
      >
        <DialogContent className="flex h-[85dvh] max-w-3xl flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b bg-background px-6 py-5">
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="size-4" />
              Sales Settings
            </DialogTitle>
            <DialogDescription>
              Configure sales settings for this customer / prospect.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <form id="sales-form" onSubmit={handleSaveSales} className="space-y-6">

              {/* Commercial layout */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Commercial layout</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <FormLabel htmlFor="sl-customerGroup">Customer group</FormLabel>
                    <Controller
                      name="customerGroupUuid"
                      control={salesForm.control}
                      render={({ field }) => (
                        <Select
                          id="sl-customerGroup"
                          options={[
                            { value: "", label: COMMON_TEXT.emptyOption },
                            ...customerGroups.map((g) => ({ value: g.uuid, label: g.name })),
                          ]}
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          placeholder={COMMON_TEXT.emptyOption}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="sl-representative">Representative</FormLabel>
                    <Controller
                      name="representative"
                      control={salesForm.control}
                      render={({ field }) => (
                        <Select
                          id="sl-representative"
                          options={[
                            { value: "", label: COMMON_TEXT.emptyOption },
                            ...salesRepresentatives.map((r) => ({ value: r, label: SALES_REPRESENTATIVE_LABELS[r] })),
                          ]}
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          placeholder={COMMON_TEXT.emptyOption}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="sl-accountManager">Account manager</FormLabel>
                    <Controller
                      name="accountManager"
                      control={salesForm.control}
                      render={({ field }) => (
                        <Select
                          id="sl-accountManager"
                          options={[
                            { value: "", label: COMMON_TEXT.emptyOption },
                            ...salesRepresentatives.map((r) => ({ value: r, label: SALES_REPRESENTATIVE_LABELS[r] })),
                          ]}
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          placeholder={COMMON_TEXT.emptyOption}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="sl-region">Region</FormLabel>
                    <Input id="sl-region" {...salesForm.register("region")} />
                  </div>
                </div>
              </div>

              {/* Miscellaneous */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Miscellaneous</h3>
                <div>
                  <FormLabel htmlFor="sl-memberOf">Member of</FormLabel>
                  <Input id="sl-memberOf" {...salesForm.register("memberOf")} className="mb-3" />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {miscellaneousOptions.map((opt) => {
                    const checked = salesForm.watch("miscellaneousSettings").includes(opt);
                    return (
                      <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="size-4 rounded border-border accent-primary"
                          checked={checked}
                          onChange={() => toggleSalesOption("miscellaneousSettings", opt)}
                        />
                        {MISCELLANEOUS_OPTION_LABELS[opt]}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Quote/Order */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Quote/Order</h3>
                <div className="mb-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <FormLabel htmlFor="sl-deliveryCondition">Delivery condition</FormLabel>
                    <Input id="sl-deliveryCondition" {...salesForm.register("deliveryCondition")} />
                  </div>
                  <div>
                    <FormLabel htmlFor="sl-devTheorWt">Dev. Theor. Wt.</FormLabel>
                    <Controller
                      name="devTheorWt"
                      control={salesForm.control}
                      render={({ field }) => (
                        <Select
                          id="sl-devTheorWt"
                          options={[
                            { value: "", label: COMMON_TEXT.emptyOption },
                            ...devTheorWtOptions.map((o) => ({ value: o, label: DEV_THEOR_WT_LABELS[o] })),
                          ]}
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          placeholder={COMMON_TEXT.emptyOption}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="sl-defTransport">Def. transport</FormLabel>
                    <Input id="sl-defTransport" {...salesForm.register("defTransport")} />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {quoteOrderOptions.map((opt) => {
                    const checked = salesForm.watch("quoteOrderSettings").includes(opt);
                    return (
                      <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="size-4 rounded border-border accent-primary"
                          checked={checked}
                          onChange={() => toggleSalesOption("quoteOrderSettings", opt)}
                        />
                        {QUOTE_ORDER_OPTION_LABELS[opt]}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Quote/Order/Invoice */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Quote/Order/Invoice</h3>
                <div className="mb-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <FormLabel htmlFor="sl-groupLines">Group lines by long product group description</FormLabel>
                    <Controller
                      name="groupLinesByLongProductGroupDescription"
                      control={salesForm.control}
                      render={({ field }) => (
                        <Select
                          id="sl-groupLines"
                          options={[
                            { value: "", label: COMMON_TEXT.emptyOption },
                            ...groupLinesByDescriptionOptions.map((o) => ({ value: o, label: GROUP_LINES_BY_DESCRIPTION_LABELS[o] })),
                          ]}
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          placeholder={COMMON_TEXT.emptyOption}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="sl-printProductCodes">Print product codes on outgoing documents</FormLabel>
                    <Controller
                      name="printProductCodesOnOutgoingDocuments"
                      control={salesForm.control}
                      render={({ field }) => (
                        <Select
                          id="sl-printProductCodes"
                          options={[
                            { value: "", label: COMMON_TEXT.emptyOption },
                            ...printProductCodesOptions.map((o) => ({ value: o, label: PRINT_PRODUCT_CODES_LABELS[o] })),
                          ]}
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          placeholder={COMMON_TEXT.emptyOption}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {quoteOrderInvoiceOptions.map((opt) => {
                    const checked = salesForm.watch("quoteOrderInvoiceSettings").includes(opt);
                    return (
                      <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="size-4 rounded border-border accent-primary"
                          checked={checked}
                          onChange={() => toggleSalesOption("quoteOrderInvoiceSettings", opt)}
                        />
                        {QUOTE_ORDER_INVOICE_OPTION_LABELS[opt]}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Order & Quote */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-700">Order</h3>
                  <div className="space-y-2">
                    {orderOptions.map((opt) => {
                      const checked = salesForm.watch("orderSettings").includes(opt);
                      return (
                        <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="size-4 rounded border-border accent-primary"
                            checked={checked}
                            onChange={() => toggleSalesOption("orderSettings", opt)}
                          />
                          {ORDER_OPTION_LABELS[opt]}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-700">Quote</h3>
                  <div className="space-y-2">
                    {quoteOptions.map((opt) => {
                      const checked = salesForm.watch("quoteSettings").includes(opt);
                      return (
                        <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="size-4 rounded border-border accent-primary"
                            checked={checked}
                            onChange={() => toggleSalesOption("quoteSettings", opt)}
                          />
                          {QUOTE_OPTION_LABELS[opt]}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Website-quote */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Website-quote</h3>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border accent-primary"
                    {...salesForm.register("websiteQuoteMustBeApproved")}
                  />
                  Must be approved, but only if the quote amount is greater than:
                </label>
                {salesForm.watch("websiteQuoteMustBeApproved") && (
                  <div className="mt-2">
                    <Input
                      placeholder="e.g. 1000"
                      {...salesForm.register("websiteQuoteApprovalAmount")}
                    />
                  </div>
                )}
              </div>

              {/* Actions upon release */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-700">Actions upon release</h3>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" className="size-4 rounded border-border accent-primary" {...salesForm.register("releaseActionPrint")} />
                      Print
                    </label>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="size-4 rounded border-border accent-primary" {...salesForm.register("releaseActionEmailEnabled")} />
                      <span className="text-sm">E-mail to:</span>
                      <Input placeholder="Contact person" {...salesForm.register("releaseActionEmailTo")} className="h-7 text-xs" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="size-4 rounded border-border accent-primary" {...salesForm.register("releaseActionFaxEnabled")} />
                      <span className="text-sm">Fax to:</span>
                      <Input placeholder="Contact person" {...salesForm.register("releaseActionFaxTo")} className="h-7 text-xs" />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-700">Actions upon</h3>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" className="size-4 rounded border-border accent-primary" {...salesForm.register("actionPrint")} />
                      Print
                    </label>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="size-4 rounded border-border accent-primary" {...salesForm.register("actionEmailEnabled")} />
                      <span className="text-sm">E-mail to:</span>
                      <Input placeholder="Contact person" {...salesForm.register("actionEmailTo")} className="h-7 text-xs" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="size-4 rounded border-border accent-primary" {...salesForm.register("actionFaxEnabled")} />
                      <span className="text-sm">Fax to:</span>
                      <Input placeholder="Contact person" {...salesForm.register("actionFaxTo")} className="h-7 text-xs" />
                    </div>
                  </div>
                </div>
              </div>

              {/* EDI */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">EDI</h3>
                <div className="space-y-2">
                  {ediOptions.map((opt) => {
                    const checked = salesForm.watch("ediSettings").includes(opt);
                    return (
                      <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="size-4 rounded border-border accent-primary"
                          checked={checked}
                          onChange={() => toggleSalesOption("ediSettings", opt)}
                        />
                        {EDI_OPTION_LABELS[opt]}
                      </label>
                    );
                  })}
                </div>
              </div>

            </form>
          </div>

          <div className="shrink-0 border-t bg-background px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsSalesDialogOpen(false)}>
                {COMMON_TEXT.cancel}
              </Button>
              <Button type="submit" form="sales-form">
                Save Sales Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
