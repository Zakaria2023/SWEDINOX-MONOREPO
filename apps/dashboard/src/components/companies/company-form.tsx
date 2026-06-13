"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, MessageSquare, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { CommSettingInput } from "@/app/(dashboard)/companies/actions";
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
  type AddressCategory,
  type CompanyRole,
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

export const CompanyForm = () => {
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

  const addressValues = watch("address");
  const selectedRoles: CompanyRole[] = watch("roles") ?? [];
  const disabledRoles = getDisabledRoles(selectedRoles);

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
        onSubmit={onSubmit(additionalAddresses, communicationSettings)}
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
    </>
  );
};
