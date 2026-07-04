"use client";

import { DebtorCompanyOption } from "@/app/(dashboard)/companies/actions";
import { useCompanySubmit } from "@/app/(dashboard)/companies/use-company-submit";
import {
  ContractForProjectOption,
  ContractListItem,
} from "@/app/(dashboard)/contracts/actions";
import { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { CompanyDetailsSection } from "@/components/companies/sections/company-details-section";
import { RolesSection } from "@/components/companies/sections/roles-section";
import { ContractsSection } from "@/components/companies/sections/contracts-section";
import { SalesSection } from "@/components/companies/sections/sales-section";
import { DebtorSection } from "@/components/companies/sections/debtor-section";
import { TextsSection } from "@/components/companies/sections/texts-section";
import { ProjectsSection } from "@/components/companies/sections/projects-section";
import { DocumentsSection } from "@/components/companies/sections/documents-section";
import { SearchCodesSection } from "@/components/companies/sections/search-codes-section";
import { ContactsSection } from "@/components/companies/sections/contacts-section";
import { FirstAddressDialog } from "@/components/companies/dialogs/first-address-dialog";
import { AdditionalAddressDialog } from "@/components/companies/dialogs/additional-address-dialog";
import { CommunicationSettingDialog } from "@/components/companies/dialogs/communication-setting-dialog";
import { ContractDialog } from "@/components/companies/dialogs/contract-dialog";
import { TextDialog } from "@/components/companies/dialogs/text-dialog";
import { ContactDialog } from "@/components/companies/dialogs/contact-dialog";
import { ProjectDialog } from "@/components/companies/dialogs/project-dialog";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { FormProvider } from "react-hook-form";

type CompanyFormProps = {
  availableContracts: ContractListItem[];
  projectContracts: ContractForProjectOption[];
  textCategories: TextCategoryOption[];
  debtorCompanies: DebtorCompanyOption[];
  purchaseOrgCompanies: DebtorCompanyOption[];
};

export const CompanyForm = ({
  availableContracts,
  projectContracts,
  textCategories,
  debtorCompanies,
  purchaseOrgCompanies,
}: CompanyFormProps) => {
  const router = useRouter();
  const { user } = useUser();
  const currentUserName = (user?.firstName && user?.lastName) || undefined;

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
    toggleRole,
    salesData,
    setSalesData,
    availableContracts: availableContracts_,
    projectContracts: projectContracts_,
    textCategories: textCategories_,
  } = useCompanySubmit({
    availableContracts,
    projectContracts,
    textCategories,
    debtorCompanies,
    purchaseOrgCompanies,
  });

  const isCustomerOrProspect =
    selectedRoles.includes("customer") || selectedRoles.includes("prospect");

  const isDebtorVisible =
    selectedRoles.includes("customer") ||
    selectedRoles.includes("prospect") ||
    selectedRoles.includes("purchasing_org");

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        <CompanyDetailsSection
          isPending={isPending}
          hasFirstAddress={hasFirstAddress}
          addressValues={addressValues}
          addressLabel={addressLabel}
          additionalAddresses={additionalAddresses}
          setIsFirstAddressDialogOpen={setIsFirstAddressDialogOpen}
          removeAdditionalAddress={removeAdditionalAddress}
          handleAdditionalAddressOpenChange={handleAdditionalAddressOpenChange}
          communicationSettings={communicationSettings}
          commSettingLabel={commSettingLabel}
          removeCommSetting={removeCommSetting}
          handleOpenCommSetting={handleOpenCommSetting}
          langOptions={langOptions}
        />

        <RolesSection
          selectedRoles={selectedRoles}
          disabledRoles={disabledRoles}
          isPending={isPending}
          toggleRole={toggleRole}
        />

        {activeContractableRoles.length > 0 && (
          <ContractsSection
            contracts={contracts}
            removeContract={removeContract}
            handleOpenContract={handleOpenContract}
            isPending={isPending}
          />
        )}

        <SalesSection
          salesData={salesData}
          setSalesData={setSalesData}
          isPending={isPending}
          isCustomerOrProspect={isCustomerOrProspect}
        />

        {isDebtorVisible && (
          <DebtorSection
            isPending={isPending}
            selectedRoles={selectedRoles}
            debtorCompanyOptions={debtorCompanyOptions}
            purchaseOrgOptions={purchaseOrgOptions}
            paymentTermOptions={paymentTermOptions}
            currencyOptions={currencyOptions}
            currentUserName={currentUserName}
          />
        )}

        <TextsSection
          texts={texts}
          removeText={removeText}
          handleOpenText={handleOpenText}
          isPending={isPending}
          textCategories={textCategories_}
        />

        {isCustomerOrProspect && (
          <ProjectsSection
            projects={projects}
            removeProject={removeProject}
            handleOpenProject={handleOpenProject}
            isPending={isPending}
            projectContracts={projectContracts_}
          />
        )}

        <DocumentsSection />

        <SearchCodesSection isPending={isPending} />

        <ContactsSection
          contacts={contacts}
          removeContact={removeContact}
          handleOpenContact={handleOpenContact}
          isPending={isPending}
        />

        <FormError>{state.error}</FormError>

        <FormActions
          isPending={isPending}
          onCancel={() => router.push("/companies")}
          submitLabel="Create Company"
        />
      </form>

      {/* Dialogs */}
      <FirstAddressDialog
        isOpen={isFirstAddressDialogOpen}
        onOpenChange={setIsFirstAddressDialogOpen}
        onCancel={handleCancelFirstAddress}
        onSave={handleSaveFirstAddress}
      />

      <AdditionalAddressDialog
        isOpen={isAdditionalAddressDialogOpen}
        onOpenChange={handleAdditionalAddressOpenChange}
        onCancel={handleCancelAdditionalAddress}
        onSave={handleSaveAdditionalAddress}
        form={additionalForm}
        availableForNext={availableForNext}
      />

      <CommunicationSettingDialog
        isOpen={isCommSettingDialogOpen}
        onOpenChange={handleCommSettingOpenChange}
        onCancel={handleCancelCommSetting}
        onSave={handleSaveCommSetting}
        form={commSettingForm}
        selectedCommType={selectedCommType}
        setSelectedCommType={setSelectedCommType}
        documentTypeOptions={documentTypeOptions}
        communicationTypeOptions={communicationTypeOptions}
        shapeOptions={shapeOptions}
      />

      <ContractDialog
        isOpen={isContractDialogOpen}
        onOpenChange={handleContractOpenChange}
        onCancel={handleCancelContract}
        onSave={handleSaveContract}
        form={contractSelectionForm}
        availableContracts={availableContracts_}
        activeContractableRoles={activeContractableRoles}
      />

      <TextDialog
        isOpen={isTextDialogOpen}
        onOpenChange={handleTextOpenChange}
        onCancel={handleCancelText}
        onSave={handleSaveText}
        form={textForm}
        textCategories={textCategories_}
        handleCategorySelect={handleCategorySelect}
      />

      <ContactDialog
        isOpen={isContactDialogOpen}
        onOpenChange={handleContactOpenChange}
        onCancel={handleCancelContact}
        onSave={handleSaveContact}
        form={contactForm}
        toggleContactCategory={toggleContactCategory}
      />

      <ProjectDialog
        isOpen={isProjectDialogOpen}
        onOpenChange={handleProjectOpenChange}
        onCancel={handleCancelProject}
        onSave={handleSaveProject}
        form={projectForm}
        projectContracts={projectContracts_}
      />
    </FormProvider>
  );
};
