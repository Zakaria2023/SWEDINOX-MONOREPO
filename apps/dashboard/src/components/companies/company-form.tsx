"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, MapPin, MessageSquare, Plus, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { CommSettingInput, CompanyContactInput, CompanyContractInput } from "@/app/(dashboard)/companies/actions";
import type { ContractListItem } from "@/app/(dashboard)/contracts/actions";
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
  contactCategories,
  contactSalutations,
  contractableRoles,
  type AddressCategory,
  type CompanyRole,
  type ContactCategory,
  type ContractableRole,
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
  CONTACT_CATEGORY_LABELS,
  CONTACT_SALUTATION_LABELS,
  CONTRACT_TYPE_LABELS,
  CONTRACTABLE_ROLE_LABELS,
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

const contactDialogSchema = z.object({
  salutation: z.string().optional(),
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

type ContactDialogValues = z.infer<typeof contactDialogSchema>;

const DEFAULT_CONTACT: ContactDialogValues = {
  salutation: "",
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

type CompanyFormProps = {
  availableContracts: ContractListItem[];
};

export const CompanyForm = ({ availableContracts }: CompanyFormProps) => {
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
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [contacts, setContacts] = useState<CompanyContactInput[]>([]);

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

  const contactForm = useForm<ContactDialogValues>({
    resolver: zodResolver(contactDialogSchema),
    defaultValues: DEFAULT_CONTACT,
  });

  const addressValues = watch("address");
  const selectedRoles: CompanyRole[] = watch("roles") ?? [];
  const disabledRoles = getDisabledRoles(selectedRoles);
  const activeContractableRoles = selectedRoles.filter((r): r is ContractableRole =>
    (contractableRoles as readonly string[]).includes(r),
  );

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

  const handleSaveContact = contactForm.handleSubmit((values) => {
    const companyValues = form.getValues();
    const isSupplier = selectedRoles.includes("supplier");
    const isCustomerOrProspect =
      selectedRoles.includes("customer") || selectedRoles.includes("prospect");

    setContacts((prev) => [
      ...prev,
      {
        salutation: (values.salutation || undefined) as CompanyContactInput["salutation"],
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
        searchCode1: (isSupplier || isCustomerOrProspect) ? (companyValues.searchCode1 || undefined) : undefined,
        searchCode2: (isSupplier || isCustomerOrProspect) ? (companyValues.searchCode2 || undefined) : undefined,
        searchCode3: (isSupplier || isCustomerOrProspect) ? (companyValues.searchCode3 || undefined) : undefined,
        revenueLastYear: (isSupplier || isCustomerOrProspect) ? "0.00" : undefined,
        revenueThisYear: (isSupplier || isCustomerOrProspect) ? "0.00" : undefined,
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
        onSubmit={onSubmit(additionalAddresses, communicationSettings, contracts, contacts)}
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

        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
            Contacts
          </h2>
          <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
            {contacts.map((contact, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2 text-sm">
                  <User className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-muted-foreground">
                    {[contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Contact"}
                  </span>
                  {contact.categories?.map((cat) => (
                    <span key={cat} className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      {CONTACT_CATEGORY_LABELS[cat]}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setContacts((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={isPending}
                >
                  <X className="size-4" />
                  <span className="sr-only">Remove contact</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                contactForm.reset(DEFAULT_CONTACT);
                setIsContactDialogOpen(true);
              }}
              className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              disabled={isPending}
            >
              <Plus className="size-4" />
              Add Contact
            </button>
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
        open={isContactDialogOpen}
        onOpenChange={(open) => {
          if (!open) contactForm.reset(DEFAULT_CONTACT);
          setIsContactDialogOpen(open);
        }}
      >
        <DialogContent className="flex h-[85dvh] max-w-3xl flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b bg-background px-6 py-5">
            <DialogTitle className="flex items-center gap-2">
              <User className="size-4" />
              Contact
            </DialogTitle>
            <DialogDescription>
              Add a contact person for this company.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSaveContact}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Contact Person</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <FormLabel htmlFor="co-salutation">Salutation</FormLabel>
                    <Controller
                      name="salutation"
                      control={contactForm.control}
                      render={({ field }) => (
                        <Select
                          id="co-salutation"
                          options={[
                            { value: "", label: COMMON_TEXT.emptyOption },
                            ...contactSalutations.map((s) => ({
                              value: s,
                              label: CONTACT_SALUTATION_LABELS[s],
                            })),
                          ]}
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          placeholder={COMMON_TEXT.emptyOption}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-firstName">First Name</FormLabel>
                    <Input id="co-firstName" {...contactForm.register("firstName")} />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-initials">Initials</FormLabel>
                    <Input id="co-initials" {...contactForm.register("initials")} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <FormLabel htmlFor="co-lastName">Last Name</FormLabel>
                    <Input id="co-lastName" {...contactForm.register("lastName")} />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-telephone">Telephone</FormLabel>
                    <Input id="co-telephone" {...contactForm.register("telephone")} />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-mobile">Mobile</FormLabel>
                    <Input id="co-mobile" {...contactForm.register("mobile")} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <FormLabel htmlFor="co-fax">Fax</FormLabel>
                    <Input id="co-fax" {...contactForm.register("fax")} />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-email">Email</FormLabel>
                    <Input id="co-email" type="email" {...contactForm.register("email")} />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-address">Address</FormLabel>
                    <Input id="co-address" {...contactForm.register("address")} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <FormLabel htmlFor="co-categoryAddition">Category Addition</FormLabel>
                    <Input id="co-categoryAddition" {...contactForm.register("categoryAddition")} />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-btwNumber">BTW Number</FormLabel>
                    <Input id="co-btwNumber" {...contactForm.register("btwNumber")} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Address</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <FormLabel htmlFor="co-country">Country</FormLabel>
                    <Input id="co-country" {...contactForm.register("country")} />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-postal">Postal</FormLabel>
                    <Input id="co-postal" {...contactForm.register("postal")} />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-house">House</FormLabel>
                    <Input id="co-house" {...contactForm.register("house")} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Controller
                    name="poBox"
                    control={contactForm.control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        id="co-poBox"
                        className="size-4 rounded border-border accent-primary"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <FormLabel htmlFor="co-poBox">PO Box</FormLabel>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <FormLabel htmlFor="co-streetAndNo">Street & No</FormLabel>
                    <Input id="co-streetAndNo" {...contactForm.register("streetAndNo")} />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-annex">Annex</FormLabel>
                    <Input id="co-annex" {...contactForm.register("annex")} />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-postalCode">Postal Code</FormLabel>
                    <Input id="co-postalCode" {...contactForm.register("postalCode")} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <FormLabel htmlFor="co-city">City</FormLabel>
                    <Input id="co-city" {...contactForm.register("city")} />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-region">Region</FormLabel>
                    <Input id="co-region" {...contactForm.register("region")} />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-addressCountry">Country</FormLabel>
                    <Input id="co-addressCountry" {...contactForm.register("addressCountry")} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <FormLabel htmlFor="co-addressTelephone">Telephone</FormLabel>
                    <Input id="co-addressTelephone" {...contactForm.register("addressTelephone")} />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-addressFax">Fax</FormLabel>
                    <Input id="co-addressFax" {...contactForm.register("addressFax")} />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-addressEmail">Email</FormLabel>
                    <Input id="co-addressEmail" type="email" {...contactForm.register("addressEmail")} />
                  </div>
                </div>
                <div>
                  <FormLabel htmlFor="co-website">Website</FormLabel>
                  <Input id="co-website" {...contactForm.register("website")} />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Categories</h3>
                <Controller
                  name="categories"
                  control={contactForm.control}
                  render={({ field }) => (
                    <div className="grid gap-2 sm:grid-cols-3">
                      {contactCategories.map((cat) => (
                        <label
                          key={cat}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 hover:bg-muted/40"
                        >
                          <input
                            type="checkbox"
                            className="size-4 rounded border-border accent-primary"
                            checked={(field.value as string[]).includes(cat)}
                            onChange={() => toggleContactCategory(cat)}
                          />
                          <span className="text-sm text-gray-700">
                            {CONTACT_CATEGORY_LABELS[cat]}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">Sequence Number</h3>
                <div className="w-32">
                  <Input
                    type="number"
                    min={1}
                    {...contactForm.register("sequenceNumber")}
                  />
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t bg-background px-6 py-4">
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    contactForm.reset(DEFAULT_CONTACT);
                    setIsContactDialogOpen(false);
                  }}
                >
                  {COMMON_TEXT.cancel}
                </Button>
                <Button type="submit">Add Contact</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
