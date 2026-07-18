"use client";

import { FormProvider } from "react-hook-form";
import { useMachineSubmit } from "@/app/(dashboard)/machines/use-machine-submit";
import type { ProductGroupOption } from "@/app/(dashboard)/product-groups/actions";
import type { ProductOption } from "@/app/(dashboard)/products/actions";
import type { MachineStockLocationOption } from "@/app/(dashboard)/warehouses/actions";
import { ProductPickerDialog } from "@/components/companies/dialogs/product-picker-dialog";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { MachineProductDialog } from "./dialogs/machine-product-dialog";
import { GeneralSection } from "./sections/general-section";
import { DimensionsAndRemarksSection } from "./sections/dimensions-and-remarks-section";
import { AvailabilitySection } from "./sections/availability-section";
import { CapacitySection } from "./sections/capacity-section";
import { ProductsSection } from "./sections/products-section";
import { PostProcessingSection } from "./sections/post-processing-section";
import { DocumentsSection } from "./sections/documents-section";

type Props = {
  stockLocations: MachineStockLocationOption[];
  productGroups: ProductGroupOption[];
  availableProducts: ProductOption[];
};

export const MachineForm = ({
  stockLocations,
  productGroups,
  availableProducts,
}: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    stockLocationOptions,
    optionOptions,
    productionOptions,
    loadingOptions,
    capacityUnitOptions,
    postProcessingOptions,
    handleCancel,
    products,
    productForm,
    isProductDialogOpen,
    isProductPickerOpen,
    pickedProduct,
    handleProductOpenChange,
    handleOpenProduct,
    handleCancelProduct,
    handleOpenProductPicker,
    handleCancelProductPicker,
    handlePickProduct,
    handleSaveProduct,
    removeProduct,
    postProcessings,
    addPostProcessing,
    updatePostProcessing,
    removePostProcessing,
  } = useMachineSubmit({ stockLocations });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        <GeneralSection
          optionOptions={optionOptions}
          productionOptions={productionOptions}
          loadingOptions={loadingOptions}
          stockLocationOptions={stockLocationOptions}
        />

        <DimensionsAndRemarksSection />

        <AvailabilitySection />

        <CapacitySection capacityUnitOptions={capacityUnitOptions} />

        <ProductsSection
          products={products}
          removeProduct={removeProduct}
          handleOpenProduct={handleOpenProduct}
          isPending={isPending}
        />

        <PostProcessingSection
          postProcessings={postProcessings}
          postProcessingOptions={postProcessingOptions}
          addPostProcessing={addPostProcessing}
          updatePostProcessing={updatePostProcessing}
          removePostProcessing={removePostProcessing}
          isPending={isPending}
        />

        <DocumentsSection />

        {state.error && <FormError>{state.error}</FormError>}

        <FormActions
          submitLabel="Save Machine"
          isPending={isPending}
          onCancel={handleCancel}
        />
      </form>

      <MachineProductDialog
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
        onOpenChange={(open) => {
          if (!open) {
            handleCancelProductPicker();
          }
        }}
        onCancel={handleCancelProductPicker}
        onSelect={handlePickProduct}
        productGroups={productGroups}
        products={availableProducts}
      />
    </FormProvider>
  );
};
