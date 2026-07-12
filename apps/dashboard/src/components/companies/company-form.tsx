"use client";

import { DebtorCompanyOption } from "@/app/(dashboard)/companies/actions";
import { useCompanySubmit } from "@/app/(dashboard)/companies/use-company-submit";
import {
  ContractForProjectOption,
  ContractListItem,
} from "@/app/(dashboard)/contracts/actions";
import { ProductGroupOption } from "@/app/(dashboard)/product-groups/actions";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { CompanyDetailsSection } from "@/components/companies/sections/company-details-section";
import { RolesSection } from "@/components/companies/sections/roles-section";
import { ContractsSection } from "@/components/companies/sections/contracts-section";
import { SalesSection } from "@/components/companies/sections/sales-section";
import { DebtorSection } from "@/components/companies/sections/debtor-section";
import { InvoicesSection } from "@/components/companies/sections/invoices-section";
import { TextsSection } from "@/components/companies/sections/texts-section";
import { ProjectsSection } from "@/components/companies/sections/projects-section";
import { VisitReportsSection } from "@/components/companies/sections/visit-reports-section";
import { PurchaseOrdersSection } from "@/components/companies/sections/purchase-orders-section";
import { DocumentsSection } from "@/components/companies/sections/documents-section";
import { SearchCodesSection } from "@/components/companies/sections/search-codes-section";
import { ContactsSection } from "@/components/companies/sections/contacts-section";
import { ProductsSection } from "@/components/companies/sections/products-section";
import { CustomerProductsSection } from "@/components/companies/sections/customer-products-section";
import { FirstAddressDialog } from "@/components/companies/dialogs/first-address-dialog";
import { AdditionalAddressDialog } from "@/components/companies/dialogs/additional-address-dialog";
import { CommunicationSettingDialog } from "@/components/companies/dialogs/communication-setting-dialog";
import { ContractDialog } from "@/components/companies/dialogs/contract-dialog";
import { TextDialog } from "@/components/companies/dialogs/text-dialog";
import { ContactDialog } from "@/components/companies/dialogs/contact-dialog";
import { ProjectDialog } from "@/components/companies/dialogs/project-dialog";
import { ProductDialog } from "@/components/companies/dialogs/product-dialog";
import { ProductPickerDialog } from "@/components/companies/dialogs/product-picker-dialog";
import { CustomerProductDialog } from "@/components/companies/dialogs/customer-product-dialog";
import { VisitReportDialog } from "@/components/companies/dialogs/visit-report-dialog";
import { PurchaseOrderDialog } from "@/components/companies/dialogs/purchase-order-dialog";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { FormProvider } from "react-hook-form";

type CompanyFormProps = {
  availableContracts: ContractListItem[];
  projectContracts: ContractForProjectOption[];
  textCategories: TextCategoryOption[];
  debtorCompanies: DebtorCompanyOption[];
  purchaseOrgCompanies: DebtorCompanyOption[];
  productGroups: ProductGroupOption[];
  availableProducts: ProductOption[];
};

export const CompanyForm = ({
  availableContracts,
  projectContracts,
  textCategories,
  debtorCompanies,
  purchaseOrgCompanies,
  productGroups,
  availableProducts,
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
    visitReportForm,
    visitReports,
    isVisitReportDialogOpen,
    isEditingVisitReport,
    handleVisitReportOpenChange,
    handleOpenVisitReport,
    handleEditVisitReport,
    handleCancelVisitReport,
    handleSaveVisitReport,
    removeVisitReport,
    purchaseOrderForm,
    purchaseOrders,
    isPurchaseOrderDialogOpen,
    isEditingPurchaseOrder,
    handlePurchaseOrderOpenChange,
    handleOpenPurchaseOrder,
    handleEditPurchaseOrder,
    handleCancelPurchaseOrder,
    handleSavePurchaseOrder,
    removePurchaseOrder,
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
    productGroups,
    availableProducts,
  });

  const isCustomerOrProspect =
    selectedRoles.includes("customer") || selectedRoles.includes("prospect");

  const isDebtorVisible =
    selectedRoles.includes("customer") ||
    selectedRoles.includes("prospect") ||
    selectedRoles.includes("purchasing_org");

  const isCustomerOrSupplier =
    isCustomerOrProspect || selectedRoles.includes("supplier");

  const isPurchaseOrderVisible =
    selectedRoles.includes("customer") ||
    selectedRoles.includes("processor") ||
    selectedRoles.includes("supplier");

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

        {selectedRoles.includes("customer") && (
          <InvoicesSection isPending={isPending} />
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

        <VisitReportsSection
          visitReports={visitReports}
          removeVisitReport={removeVisitReport}
          handleOpenVisitReport={handleOpenVisitReport}
          handleEditVisitReport={handleEditVisitReport}
          isPending={isPending}
        />

        {isPurchaseOrderVisible && (
          <PurchaseOrdersSection
            purchaseOrders={purchaseOrders}
            removePurchaseOrder={removePurchaseOrder}
            handleOpenPurchaseOrder={handleOpenPurchaseOrder}
            handleEditPurchaseOrder={handleEditPurchaseOrder}
            isPending={isPending}
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

        {isCustomerOrSupplier && (
          <ProductsSection
            products={products}
            removeProduct={removeProduct}
            handleOpenProduct={handleOpenProduct}
            isPending={isPending}
          />
        )}

        {selectedRoles.includes("customer") && (
          <CustomerProductsSection
            products={customerProducts}
            removeProduct={removeCustomerProduct}
            handleOpenProduct={handleOpenCustomerProduct}
            isPending={isPending}
          />
        )}

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

      <ProductDialog
        isOpen={isProductDialogOpen}
        onOpenChange={handleProductOpenChange}
        onCancel={handleCancelProduct}
        onSave={handleSaveProduct}
        form={productForm}
        selectedProduct={pickedProduct}
        onBrowse={handleOpenProductPicker}
      />

      <ProductPickerDialog
        isOpen={isProductPickerOpen}
        onOpenChange={setIsProductPickerOpen}
        onCancel={handleCancelProductPicker}
        onSelect={handlePickProduct}
        productGroups={productGroups}
        products={availableProducts}
      />

      <CustomerProductDialog
        isOpen={isCustomerProductDialogOpen}
        onOpenChange={handleCustomerProductOpenChange}
        onCancel={handleCancelCustomerProduct}
        onSave={handleSaveCustomerProduct}
        form={customerProductForm}
        selectedProduct={pickedCustomerProduct}
        onBrowse={handleOpenCustomerProductPicker}
      />

      <ProductPickerDialog
        isOpen={isCustomerProductPickerOpen}
        onOpenChange={setIsCustomerProductPickerOpen}
        onCancel={handleCancelCustomerProductPicker}
        onSelect={handlePickCustomerProduct}
        productGroups={productGroups}
        products={availableProducts}
      />

      <VisitReportDialog
        isOpen={isVisitReportDialogOpen}
        onOpenChange={handleVisitReportOpenChange}
        onCancel={handleCancelVisitReport}
        onSave={handleSaveVisitReport}
        form={visitReportForm}
        contacts={contacts}
        isEditing={isEditingVisitReport}
      />

      <PurchaseOrderDialog
        isOpen={isPurchaseOrderDialogOpen}
        onOpenChange={handlePurchaseOrderOpenChange}
        onCancel={handleCancelPurchaseOrder}
        onSave={handleSavePurchaseOrder}
        form={purchaseOrderForm}
        isEditing={isEditingPurchaseOrder}
      />
    </FormProvider>
  );
};
