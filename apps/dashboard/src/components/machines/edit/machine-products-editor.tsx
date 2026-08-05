"use client";

import { updateMachineProducts } from "@/app/(dashboard)/machines/[uuid]/edit/actions";
import {
  MachineActionResult,
  MachineProductInput,
} from "@/app/(dashboard)/machines/actions";
import {
  DEFAULT_MACHINE_PRODUCT,
  machineProductDialogSchema,
  MachineProductDialogValues,
} from "@/app/(dashboard)/machines/validation";
import { ProductGroupOption } from "@/app/(dashboard)/product-groups/actions";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import { ProductPickerDialog } from "@/components/companies/dialogs/product-picker-dialog";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { toIntOrNull } from "@/lib/helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { MachineProductDialog } from "../dialogs/machine-product-dialog";
import { ProductsSection } from "../sections/products-section";

type Props = {
  machineUuid: string;
  products: MachineProductInput[];
  productGroups: ProductGroupOption[];
  availableProducts: ProductOption[];
};

export const MachineProductsEditor = ({
  machineUuid,
  products: savedProducts,
  productGroups,
  availableProducts,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<MachineActionResult>({});
  const [products, setProducts] =
    useState<MachineProductInput[]>(savedProducts);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [pickedProduct, setPickedProduct] = useState<ProductOption | null>(
    null,
  );

  const productForm = useForm<MachineProductDialogValues>({
    resolver: zodResolver(machineProductDialogSchema),
    defaultValues: DEFAULT_MACHINE_PRODUCT,
  });

  const closeProductDialog = () => {
    productForm.reset(DEFAULT_MACHINE_PRODUCT);
    setPickedProduct(null);
    setIsProductDialogOpen(false);
  };

  const handleProductOpenChange = (open: boolean) => {
    if (!open) {
      productForm.reset(DEFAULT_MACHINE_PRODUCT);
      setPickedProduct(null);
    }
    setIsProductDialogOpen(open);
  };

  const handleOpenProduct = () => {
    productForm.reset(DEFAULT_MACHINE_PRODUCT);
    setPickedProduct(null);
    setIsProductDialogOpen(true);
  };

  const handlePickProduct = (product: ProductOption) => {
    setPickedProduct(product);
    productForm.setValue("productUuid", product.uuid);
    setIsProductPickerOpen(false);
  };

  const handleSaveProduct = productForm.handleSubmit((values) => {
    if (!pickedProduct) {
      productForm.setError("productUuid", {
        message: "Please select a product",
      });
      return;
    }

    setProducts((prev) => [
      ...prev,
      {
        productUuid: pickedProduct.uuid,
        productGroupUuid: pickedProduct.productGroupUuid ?? null,
        productCode: pickedProduct.productCode,
        description: pickedProduct.name,
        preference: toIntOrNull(values.preference),
        productionPerHour: toIntOrNull(values.productionPerHour),
        prodUnit: values.prodUnit,
        minCorner: values.minCorner?.trim() ? values.minCorner : "0.00",
        maxCorner: values.maxCorner?.trim() ? values.maxCorner : "90.00",
        daysInSystem: toIntOrNull(values.daysInSystem),
      },
    ]);

    closeProductDialog();
  });

  const removeProduct = (index: number) =>
    setProducts((prev) => prev.filter((_, i) => i !== index));

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      setState(await updateMachineProducts(machineUuid, products));
    });
  };

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="space-y-8">
        {state.error && <FormError>{state.error}</FormError>}

        <ProductsSection
          products={products}
          removeProduct={removeProduct}
          handleOpenProduct={handleOpenProduct}
          isPending={isPending}
        />

        <FormActions
          submitLabel="Save Products"
          isPending={isPending}
          onCancel={() => router.push(`/machines/${machineUuid}/edit`)}
        />
      </form>

      <MachineProductDialog
        isOpen={isProductDialogOpen}
        onOpenChange={handleProductOpenChange}
        onCancel={closeProductDialog}
        onSave={handleSaveProduct}
        form={productForm}
        selectedProduct={pickedProduct}
        onBrowse={() => setIsProductPickerOpen(true)}
      />

      <ProductPickerDialog
        isOpen={isProductPickerOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsProductPickerOpen(false);
          }
        }}
        onCancel={() => setIsProductPickerOpen(false)}
        onSelect={handlePickProduct}
        productGroups={productGroups}
        products={availableProducts}
      />
    </div>
  );
};
