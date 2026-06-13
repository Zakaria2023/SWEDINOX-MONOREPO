"use client";

import { MapPin, MessageSquare, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { CommSettingInput, ContractOption } from "@/app/(dashboard)/companies/actions";
import {
  createCompanySchema,
  type AddressFormValues,
  type CompanyFormValues,
} from "@/app/(dashboard)/companies/validation";
import { useCompanySubmit } from "@/app/(dashboard)/companies/use-company-submit";
import {
  communicationSettingDocumentTypes,
  communicationSettingShapes,
  communicationSettingTypes,
} from "@/lib/enums";
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
import { companyLangs, companyRoles } from "@/lib/enums";

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

const commSettingSchema = z.object({
  documentType: z.string().min(1),
  communicationType: z.string().min(1),
  shape: z.string().optional(),
  contractUuid: z.string().optional(),
  email: z.string().optional(),
  fax: z.string().optional(),
});

type CommSettingFormValues = z.infer<typeof commSettingSchema>;

const DEFAULT_COMM_SETTING: CommSettingFormValues = {
  documentType: "",
  communicationType: "",
  shape: "",
  contractUuid: "",
  email: "",
  fax: "",
};

type CompanyFormProps = {
  contracts: ContractOption[];
};

export const CompanyForm = ({ contracts }: CompanyFormProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [isFirstAddressDialogOpen, setIsFirstAddressDialogOpen] = useState(false);
  const [isAdditionalAddressDialogOpen, setIsAdditionalAddressDialogOpen] = useState(false);
  const [additionalAddresses, setAdditionalAddresses] = useState<AddressFormValues[]>([]);
  const [isCommSettingDialogOpen, setIsCommSettingDialogOpen] = useState(false);
  const [communicationSettings, setCommunicationSettings] = useState<CommSettingInput[]>([]);
  const [useContractLink, setUseContractLink] = useState(false);
  const [selectedCommType, setSelectedCommType] = useState<string>("");

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
    resolver: zodResolver(createCompanySchema(t)),
    defaultValues: {
      companyName: "",
      correspName: "",
      remarks: "",
      lang: "",
      roles: [],
      searchCode1: "",
      searchCode2: "",
      searchCode3: "",
      address: { ...DEFAULT_ADDRESS, category: ["delivery"] },
    },
  });

  const commSettingForm = useForm<CommSettingFormValues>({
    resolver: zodResolver(commSettingSchema),
    defaultValues: DEFAULT_COMM_SETTING,
  });

  const addressValues = watch("address");
  const selectedRoles = watch("roles") ?? [];

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
    { value: "", label: t("common.empty-option") },
    ...companyLangs.map((lang) => ({
      value: lang,
      label: t(`company-form.languages.${lang}`),
    })),
  ];

  const documentTypeOptions = [
    { value: "", label: t("common.select-option") },
    ...communicationSettingDocumentTypes.map((dt) => ({
      value: dt,
      label: t(`communication-setting-form.document-type-options.${dt}`),
    })),
  ];

  const communicationTypeOptions = [
    { value: "", label: t("common.select-option") },
    ...communicationSettingTypes.map((ct) => ({
      value: ct,
      label: t(`communication-setting-form.communication-type-options.${ct}`),
    })),
  ];

  const shapeOptions = [
    { value: "", label: t("common.empty-option") },
    ...communicationSettingShapes.map((s) => ({
      value: s,
      label: t(`communication-setting-form.shape-options.${s}`),
    })),
  ];

  const contractOptions = [
    { value: "", label: t("common.empty-option") },
    ...contracts.map((c) => ({ value: c.uuid, label: c.description })),
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
      address: { ...DEFAULT_ADDRESS, category: ["delivery"] },
    });
  };

  const addressLabel = (address: { streetAndNo?: string; city?: string; altName?: string }) =>
    [address.streetAndNo, address.city].filter(Boolean).join(", ") ||
    address.altName ||
    t("company-form.address-fallback");

  const handleSaveFirstAddress = async () => {
    if (await trigger("address")) setIsFirstAddressDialogOpen(false);
  };

  const handleSaveAdditionalAddress = async () => {
    if (!(await additionalForm.trigger("address"))) return;
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
        communicationType: values.communicationType as CommSettingInput["communicationType"],
        shape: (values.shape || undefined) as CommSettingInput["shape"],
        contractUuid: useContractLink ? (values.contractUuid || undefined) : undefined,
        email: !useContractLink && values.communicationType === "email" ? (values.email || undefined) : undefined,
        fax: !useContractLink && values.communicationType === "fax" ? (values.fax || undefined) : undefined,
      },
    ]);
    commSettingForm.reset(DEFAULT_COMM_SETTING);
    setUseContractLink(false);
    setSelectedCommType("");
    setIsCommSettingDialogOpen(false);
  });

  const toggleRole = (role: string) => {
    const current = selectedRoles;
    setValue(
      "roles",
      current.includes(role as never)
        ? current.filter((item) => item !== role)
        : [...current, role as never],
    );
  };

  const commSettingLabel = (setting: CommSettingInput) =>
    [
      t(`communication-setting-form.document-type-options.${setting.documentType}`),
      t(`communication-setting-form.communication-type-options.${setting.communicationType}`),
    ].join(" — ");

  return (
    <>
      <form onSubmit={onSubmit(additionalAddresses, communicationSettings)} className="space-y-8">
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
            {t("company-form.sections.company-details")}
          </h2>
          <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <FormLabel htmlFor="companyName" required>
                  {t("company-form.fields.company-name")}
                </FormLabel>
                <Input
                  id="companyName"
                  {...register("companyName")}
                  aria-invalid={!!errors.companyName}
                  placeholder={t("company-form.placeholders.company-name")}
                  disabled={isPending}
                />
                <FormFieldError message={errors.companyName?.message} />
              </div>

              <FormSelectField
                control={control}
                id="lang"
                name="lang"
                label={t("company-form.fields.language")}
                options={langOptions}
                emptyValue=""
                disabled={isPending}
              />

              <div>
                <FormLabel htmlFor="correspName">
                  {t("company-form.fields.corresp-name")}
                </FormLabel>
                <Input id="correspName" {...register("correspName")} disabled={isPending} />
              </div>
            </div>

            <div>
              <FormLabel htmlFor="remarks">{t("company-form.fields.remarks")}</FormLabel>
              <textarea
                id="remarks"
                {...register("remarks")}
                rows={3}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
                placeholder={t("company-form.placeholders.remarks")}
                disabled={isPending}
              />
            </div>

            {/* Addresses */}
            <div className="space-y-2">
              {hasFirstAddress ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <MapPin className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-muted-foreground">{addressLabel(addressValues)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFirstAddressDialogOpen(true)}
                    className="shrink-0 text-xs text-primary hover:underline"
                    disabled={isPending}
                  >
                    {t("common.edit")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsFirstAddressDialogOpen(true)}
                  className="inline-flex cursor-pointer h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  disabled={isPending}
                >
                  <Plus className="size-4" />
                  {t("company-form.add-address")}
                </button>
              )}

              {additionalAddresses.map((address, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <MapPin className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-muted-foreground">{addressLabel(address)}</span>
                    <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      {t("company-form.delivery-badge")}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdditionalAddresses((prev) => prev.filter((_, i) => i !== index))}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={isPending}
                  >
                    <X className="size-4" />
                    <span className="sr-only">{t("company-form.remove-address")}</span>
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
                  {t("company-form.add-delivery-address")}
                </button>
              )}
            </div>

            {/* Communication Settings */}
            <div className="space-y-2">
              {communicationSettings.map((setting, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-muted-foreground">{commSettingLabel(setting)}</span>
                    {setting.shape && (
                      <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                        {t(`communication-setting-form.shape-options.${setting.shape}`)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCommunicationSettings((prev) => prev.filter((_, i) => i !== index))}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={isPending}
                  >
                    <X className="size-4" />
                    <span className="sr-only">{t("company-form.remove-communication-setting")}</span>
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  commSettingForm.reset(DEFAULT_COMM_SETTING);
                  setSelectedCommType("");
                  setUseContractLink(false);
                  setIsCommSettingDialogOpen(true);
                }}
                className="inline-flex cursor-pointer h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                disabled={isPending}
              >
                <Plus className="size-4" />
                {t("company-form.add-communication-setting")}
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
            {t("company-form.sections.roles")}
          </h2>
          <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {companyRoles.map((role) => (
              <label
                key={role}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <input
                  type="checkbox"
                  className="size-4 rounded border-border accent-primary"
                  checked={selectedRoles.includes(role as never)}
                  onChange={() => toggleRole(role)}
                  disabled={isPending}
                />
                <span className="text-sm font-medium text-gray-700">
                  {t(`company-form.roles.${role}`)}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
            {t("company-form.sections.search-codes")}
          </h2>
          <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-3">
            <div>
              <FormLabel htmlFor="searchCode1">{t("company-form.fields.search-code")}</FormLabel>
              <Input id="searchCode1" {...register("searchCode1")} disabled={isPending} />
            </div>
            <div>
              <FormLabel htmlFor="searchCode2">{t("company-form.fields.search-code")}</FormLabel>
              <Input id="searchCode2" {...register("searchCode2")} disabled={isPending} />
            </div>
            <div>
              <FormLabel htmlFor="searchCode3">{t("company-form.fields.search-code")}</FormLabel>
              <Input id="searchCode3" {...register("searchCode3")} disabled={isPending} />
            </div>
          </div>
        </section>

        <FormError>{state.error}</FormError>

        <FormActions
          isPending={isPending}
          onCancel={() => router.push("/companies")}
          submitLabel={t("company-form.submit")}
        />
      </form>

      {/* Primary Address Dialog */}
      <Dialog open={isFirstAddressDialogOpen} onOpenChange={setIsFirstAddressDialogOpen}>
        <DialogContent className="flex h-[85dvh] max-w-3xl flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b bg-background px-6 py-5">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="size-4" />
              {t("company-form.dialogs.primary-address.title")}
            </DialogTitle>
            <DialogDescription>
              {t("company-form.dialogs.primary-address.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <AddressForm control={control} errors={errors.address} register={register} watch={watch} />
          </div>
          <div className="shrink-0 border-t bg-background px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsFirstAddressDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="button" onClick={handleSaveFirstAddress}>
                {t("company-form.save-address")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Additional Address Dialog */}
      <Dialog
        open={isAdditionalAddressDialogOpen}
        onOpenChange={(open) => {
          if (!open) resetAdditionalForm();
          setIsAdditionalAddressDialogOpen(open);
        }}
      >
        <DialogContent className="flex h-[85dvh] max-w-3xl flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b bg-background px-6 py-5">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="size-4" />
              {t("company-form.dialogs.delivery-address.title")}
            </DialogTitle>
            <DialogDescription>
              {t("company-form.dialogs.delivery-address.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <AddressForm
              control={additionalForm.control}
              errors={additionalForm.formState.errors.address}
              register={additionalForm.register}
              watch={additionalForm.watch}
              deliveryOnly
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
                {t("common.cancel")}
              </Button>
              <Button type="button" onClick={handleSaveAdditionalAddress}>
                {t("company-form.save-address")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Communication Setting Dialog */}
      <Dialog
        open={isCommSettingDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            commSettingForm.reset(DEFAULT_COMM_SETTING);
            setUseContractLink(false);
            setSelectedCommType("");
          }
          setIsCommSettingDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="size-4" />
              {t("company-form.dialogs.communication-setting.title")}
            </DialogTitle>
            <DialogDescription>
              {t("company-form.dialogs.communication-setting.description")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCommSetting} className="mt-2 space-y-4 px-6 pb-6">
            <div>
              <FormLabel htmlFor="cs-documentType" required>
                {t("communication-setting-form.fields.document-type")}
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
                    placeholder={t("common.select-option")}
                  />
                )}
              />
              <FormFieldError message={commSettingForm.formState.errors.documentType?.message} />
            </div>

            <div>
              <FormLabel htmlFor="cs-communicationType" required>
                {t("communication-setting-form.fields.communication-type")}
              </FormLabel>
              <Controller
                name="communicationType"
                control={commSettingForm.control}
                render={({ field }) => (
                  <Select
                    id="cs-communicationType"
                    options={communicationTypeOptions}
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                      setSelectedCommType(val);
                      commSettingForm.setValue("email", "");
                      commSettingForm.setValue("fax", "");
                    }}
                    placeholder={t("common.select-option")}
                  />
                )}
              />
              <FormFieldError message={commSettingForm.formState.errors.communicationType?.message} />
            </div>

            <div>
              <FormLabel htmlFor="cs-shape">
                {t("communication-setting-form.fields.shape")}
              </FormLabel>
              <Controller
                name="shape"
                control={commSettingForm.control}
                render={({ field }) => (
                  <Select
                    id="cs-shape"
                    options={shapeOptions}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder={t("common.empty-option")}
                  />
                )}
              />
            </div>

            {/* Contract — optional checkbox toggle */}
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  className="size-4 rounded border-border accent-primary"
                  checked={useContractLink}
                  onChange={(e) => {
                    setUseContractLink(e.target.checked);
                    if (!e.target.checked) commSettingForm.setValue("contractUuid", "");
                  }}
                />
                {t("communication-setting-form.fields.contract")}
              </label>
              {useContractLink && (
                <Controller
                  name="contractUuid"
                  control={commSettingForm.control}
                  render={({ field }) => (
                    <Select
                      id="cs-contractUuid"
                      options={contractOptions}
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      placeholder={t("common.empty-option")}
                    />
                  )}
                />
              )}
            </div>

            {/* Email — only when communicationType is "email" and contract is not selected */}
            {!useContractLink && selectedCommType === "email" && (
              <div>
                <FormLabel htmlFor="cs-email">
                  {t("communication-setting-form.fields.email")}
                </FormLabel>
                <Input id="cs-email" type="email" {...commSettingForm.register("email")} />
              </div>
            )}

            {/* Fax — only when communicationType is "fax" and contract is not selected */}
            {!useContractLink && selectedCommType === "fax" && (
              <div>
                <FormLabel htmlFor="cs-fax">
                  {t("communication-setting-form.fields.fax")}
                </FormLabel>
                <Input id="cs-fax" {...commSettingForm.register("fax")} />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  commSettingForm.reset(DEFAULT_COMM_SETTING);
                  setUseContractLink(false);
                  setSelectedCommType("");
                  setIsCommSettingDialogOpen(false);
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit">
                {t("company-form.save-communication-setting")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
