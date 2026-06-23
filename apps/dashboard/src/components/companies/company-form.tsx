"use client";

import { useCompanySubmit } from "@/app/(dashboard)/companies/use-company-submit";
import { USAGE_CATEGORY_FIELDS } from "@/app/(dashboard)/companies/validation";
import { type ContractListItem } from "@/app/(dashboard)/contracts/actions";
import { type TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import { DocumentUploader } from "@/components/document-uploader";
import { AddressForm } from "@/components/companies/address-form";
import { DialogFormFooter } from "@/components/companies/dialog-form-footer";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { companyRoles, contactCategories, contactSalutations } from "@/lib/enums";
import { cn } from "@/lib/helpers";
import {
  ADDRESS_CATEGORY_LABELS,
  COMMON_TEXT,
  COMMUNICATION_SETTING_SHAPE_LABELS,
  COMPANY_ROLE_LABELS,
  CONTACT_CATEGORY_LABELS,
  CONTACT_SALUTATION_LABELS,
  CONTRACT_TYPE_LABELS,
  CONTRACTABLE_ROLE_LABELS,
  TEXT_USAGE_CATEGORY_LABELS,
} from "@/lib/labels";
import {
  AlignLeft,
  FileText,
  MapPin,
  MessageSquare,
  Plus,
  User,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller } from "react-hook-form";

type CompanyFormProps = {
  availableContracts: ContractListItem[];
  textCategories: TextCategoryOption[];
};

export const CompanyForm = ({
  availableContracts,
  textCategories,
}: CompanyFormProps) => {
  const router = useRouter();
  const {
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
    toggleRole,
  } = useCompanySubmit({ availableContracts, textCategories });

  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-8">
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
              <Textarea
                id="remarks"
                {...register("remarks")}
                rows={3}
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
                      <span
                        key={cat}
                        className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                      >
                        {ADDRESS_CATEGORY_LABELS[cat]}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAdditionalAddress(index)}
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
                  onClick={() => handleAdditionalAddressOpenChange(true)}
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
                    onClick={() => removeCommSetting(index)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={isPending}
                  >
                    <X className="size-4" />
                    <span className="sr-only">Remove communication setting</span>
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={handleOpenCommSetting}
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
                    isDisabled
                      ? "cursor-not-allowed opacity-40"
                      : "cursor-pointer hover:bg-muted/40",
                  )}
                >
                  <Checkbox
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
                    onClick={() => removeContract(index)}
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
                onClick={handleOpenContract}
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
            Texts
          </h2>
          <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
            {texts.map((text, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2 text-sm">
                  <AlignLeft className="size-4 shrink-0 text-muted-foreground" />
                  <span className="font-medium text-foreground truncate">
                    {text.title}
                  </span>
                  {(() => {
                    const cat = textCategories.find(
                      (c) => c.uuid === text.textCategoryUuid,
                    );
                    return cat ? (
                      <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                        {cat.name}
                      </span>
                    ) : null;
                  })()}
                  {USAGE_CATEGORY_FIELDS.filter(
                    ({ field }) => text[field as keyof typeof text],
                  )
                    .slice(0, 3)
                    .map(({ key }) => (
                      <span
                        key={key}
                        className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                      >
                        {TEXT_USAGE_CATEGORY_LABELS[key]}
                      </span>
                    ))}
                </div>
                <button
                  type="button"
                  onClick={() => removeText(index)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={isPending}
                >
                  <X className="size-4" />
                  <span className="sr-only">Remove text</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleOpenText}
              className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              disabled={isPending}
            >
              <Plus className="size-4" />
              Add Text
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
            Documents
          </h2>
          <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
            {watch("documents").map((doc, index) => (
              <div key={doc.id} className="flex items-center gap-3 text-sm">
                <span className="flex-1">{doc.fileName}</span>
                <button
                  type="button"
                  onClick={async () => {
                    await fetch(`/api/documents/${doc.id}/delete`, { method: "DELETE" });
                    const current = watch("documents");
                    setValue(
                      "documents",
                      current.filter((_, i) => i !== index),
                    );
                  }}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            <DocumentUploader
              onSuccess={(uploads) => {
                const current = watch("documents");
                setValue("documents", [
                  ...current,
                  ...uploads.map((u) => ({ id: u.documentId, fileName: u.fileName })),
                ]);
              }}
            />
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
                    {[contact.firstName, contact.lastName]
                      .filter(Boolean)
                      .join(" ") || "Contact"}
                  </span>
                  {contact.categories?.map((cat) => (
                    <span
                      key={cat}
                      className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                    >
                      {CONTACT_CATEGORY_LABELS[cat]}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => removeContact(index)}
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
              onClick={handleOpenContact}
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
          <DialogFormFooter
            onCancel={handleCancelFirstAddress}
            submitLabel="Save Address"
            onSubmit={handleSaveFirstAddress}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAdditionalAddressDialogOpen}
        onOpenChange={handleAdditionalAddressOpenChange}
      >
        <DialogContent className="flex h-[85dvh] max-w-3xl flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b bg-background px-6 py-5">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="size-4" />
              Address
            </DialogTitle>
            <DialogDescription>
              Fill in the address details. Categories already assigned to
              another address are not available.
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
          <DialogFormFooter
            onCancel={handleCancelAdditionalAddress}
            submitLabel="Save Address"
            onSubmit={handleSaveAdditionalAddress}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCommSettingDialogOpen}
        onOpenChange={handleCommSettingOpenChange}
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

          <form onSubmit={handleSaveCommSetting}>
            <DialogBody className="space-y-4">
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
                  message={
                    commSettingForm.formState.errors.documentType?.message
                  }
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
            </DialogBody>
            <DialogFormFooter
              onCancel={handleCancelCommSetting}
              submitLabel="Add Setting"
            />
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isContractDialogOpen}
        onOpenChange={handleContractOpenChange}
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

          <form onSubmit={handleSaveContract}>
            <DialogBody className="space-y-4">
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
                <FormFieldError
                  message={
                    contractSelectionForm.formState.errors.contractUuid?.message
                  }
                />
              </div>

              <div>
                <FormLabel htmlFor="ct-role" required>
                  Role
                </FormLabel>
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
                <FormFieldError
                  message={contractSelectionForm.formState.errors.role?.message}
                />
              </div>
            </DialogBody>

            <DialogFormFooter
              onCancel={handleCancelContract}
              submitLabel="Add Contract"
            />
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTextDialogOpen} onOpenChange={handleTextOpenChange}>
        <DialogContent className="flex h-[85dvh] max-w-5xl flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b bg-background px-6 py-5">
            <DialogTitle className="flex items-center gap-2">
              <AlignLeft className="size-4" />
              Add Text
            </DialogTitle>
            <DialogDescription>
              Select a category to auto-fill the usage checkboxes, then fill in
              the title and text block.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSaveText}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex min-h-0 flex-1 gap-0">
              <div className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r p-6">
                <div>
                  <FormLabel htmlFor="txt-category" required>
                    Text Category
                  </FormLabel>
                  <Controller
                    name="textCategoryUuid"
                    control={textForm.control}
                    render={({ field }) => (
                      <Select
                        id="txt-category"
                        options={[
                          { value: "", label: COMMON_TEXT.selectOption },
                          ...textCategories.map((c) => ({
                            value: c.uuid,
                            label: c.name,
                          })),
                        ]}
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleCategorySelect(value);
                        }}
                        placeholder={COMMON_TEXT.selectOption}
                      />
                    )}
                  />
                  <FormFieldError
                    message={
                      textForm.formState.errors.textCategoryUuid?.message
                    }
                  />
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 overflow-y-auto border-r p-6">
                <div className="flex flex-1 flex-col">
                  <FormLabel htmlFor="txt-textBlock" required>
                    Text Block
                  </FormLabel>
                  <Textarea
                    id="txt-textBlock"
                    {...textForm.register("textBlock")}
                    className="mt-1 flex-1"
                    placeholder="Enter the text content..."
                    style={{ minHeight: "200px" }}
                  />
                  <FormFieldError
                    message={textForm.formState.errors.textBlock?.message}
                  />
                </div>
              </div>

              <div className="flex w-60 shrink-0 flex-col gap-1 overflow-y-auto p-6">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Usage Categories
                </p>
                {USAGE_CATEGORY_FIELDS.map(({ key, field }) => (
                  <Controller
                    key={field}
                    name={field}
                    control={textForm.control}
                    render={({ field: f }) => (
                      <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/40">
                        <Checkbox
                          checked={!!f.value}
                          onChange={(e) => f.onChange(e.target.checked)}
                        />
                        <span className="text-sm text-gray-700">
                          {TEXT_USAGE_CATEGORY_LABELS[key]}
                        </span>
                      </label>
                    )}
                  />
                ))}
              </div>
            </div>

            <DialogFormFooter
              onCancel={handleCancelText}
              submitLabel="Add Text"
            />
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isContactDialogOpen} onOpenChange={handleContactOpenChange}>
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
                <h3 className="text-sm font-semibold text-gray-700">
                  Contact Person
                </h3>
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
                    <Input
                      id="co-firstName"
                      {...contactForm.register("firstName")}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-initials">Initials</FormLabel>
                    <Input
                      id="co-initials"
                      {...contactForm.register("initials")}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <FormLabel htmlFor="co-lastName">Last Name</FormLabel>
                    <Input
                      id="co-lastName"
                      {...contactForm.register("lastName")}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-telephone">Telephone</FormLabel>
                    <Input
                      id="co-telephone"
                      {...contactForm.register("telephone")}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-mobile">Mobile</FormLabel>
                    <Input
                      id="co-mobile"
                      {...contactForm.register("mobile")}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <FormLabel htmlFor="co-fax">Fax</FormLabel>
                    <Input id="co-fax" {...contactForm.register("fax")} />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-email">Email</FormLabel>
                    <Input
                      id="co-email"
                      type="email"
                      {...contactForm.register("email")}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-address">Address</FormLabel>
                    <Input
                      id="co-address"
                      {...contactForm.register("address")}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <FormLabel htmlFor="co-categoryAddition">
                      Category Addition
                    </FormLabel>
                    <Input
                      id="co-categoryAddition"
                      {...contactForm.register("categoryAddition")}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-btwNumber">BTW Number</FormLabel>
                    <Input
                      id="co-btwNumber"
                      {...contactForm.register("btwNumber")}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Address</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <FormLabel htmlFor="co-country">Country</FormLabel>
                    <Input
                      id="co-country"
                      {...contactForm.register("country")}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-postal">Postal</FormLabel>
                    <Input
                      id="co-postal"
                      {...contactForm.register("postal")}
                    />
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
                      <Checkbox
                        id="co-poBox"
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
                    <Input
                      id="co-streetAndNo"
                      {...contactForm.register("streetAndNo")}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-annex">Annex</FormLabel>
                    <Input id="co-annex" {...contactForm.register("annex")} />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-postalCode">Postal Code</FormLabel>
                    <Input
                      id="co-postalCode"
                      {...contactForm.register("postalCode")}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <FormLabel htmlFor="co-city">City</FormLabel>
                    <Input id="co-city" {...contactForm.register("city")} />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-region">Region</FormLabel>
                    <Input
                      id="co-region"
                      {...contactForm.register("region")}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-addressCountry">Country</FormLabel>
                    <Input
                      id="co-addressCountry"
                      {...contactForm.register("addressCountry")}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <FormLabel htmlFor="co-addressTelephone">
                      Telephone
                    </FormLabel>
                    <Input
                      id="co-addressTelephone"
                      {...contactForm.register("addressTelephone")}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-addressFax">Fax</FormLabel>
                    <Input
                      id="co-addressFax"
                      {...contactForm.register("addressFax")}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="co-addressEmail">Email</FormLabel>
                    <Input
                      id="co-addressEmail"
                      type="email"
                      {...contactForm.register("addressEmail")}
                    />
                  </div>
                </div>
                <div>
                  <FormLabel htmlFor="co-website">Website</FormLabel>
                  <Input
                    id="co-website"
                    {...contactForm.register("website")}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Categories
                </h3>
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
                          <Checkbox
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
                <h3 className="text-sm font-semibold text-gray-700">
                  Sequence Number
                </h3>
                <div className="w-32">
                  <Input
                    type="number"
                    min={1}
                    {...contactForm.register("sequenceNumber", {
                      valueAsNumber: true,
                    })}
                  />
                  <FormFieldError
                    message={
                      contactForm.formState.errors.sequenceNumber?.message
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFormFooter
              onCancel={handleCancelContact}
              submitLabel="Add Contact"
            />
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
