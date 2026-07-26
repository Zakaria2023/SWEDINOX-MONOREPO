"use client";

import {
  deleteCompanyProduct,
  saveCompanyProduct,
} from "@/app/(dashboard)/companies/[uuid]/edit/products/actions";
import {
  productRowToDialogValues,
  productRowToOption,
} from "@/app/(dashboard)/companies/[uuid]/edit/products/mappers";
import {
  DEFAULT_PRODUCT,
  productDialogSchema,
  ProductDialogValues,
} from "@/app/(dashboard)/companies/validation";
import type { ProductGroupOption } from "@/app/(dashboard)/product-groups/actions";
import type { ProductOption } from "@/app/(dashboard)/products/actions";
import { ProductDialog } from "@/components/companies/dialogs/product-dialog";
import { ProductPickerDialog } from "@/components/companies/dialogs/product-picker-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import type { SelectProducts } from "@/db/schema/products";
import {
  DELIVERY_TIME_UNIT_LABELS,
  PURCHASING_UNIT_LABELS,
} from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type Props = {
  companyUuid: string;
  products: SelectProducts[];
  productGroups: ProductGroupOption[];
  availableProducts: ProductOption[];
};

export const CompanyProductsEditor = ({
  companyUuid,
  products,
  productGroups,
  availableProducts,
}: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [pickedProduct, setPickedProduct] = useState<ProductOption | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<SelectProducts | null>(null);

  const [saveState, dispatchSave, isSaving] = useActionState(
    saveCompanyProduct,
    {},
  );
  const [deleteState, dispatchDelete, isDeleting] = useActionState(
    deleteCompanyProduct,
    {},
  );

  const productForm = useForm<ProductDialogValues>({
    resolver: zodResolver(productDialogSchema),
    defaultValues: DEFAULT_PRODUCT,
  });

  useEffect(() => {
    if (saveState.success) {
      setIsDialogOpen(false);
      setEditingUuid(null);
      setPickedProduct(null);
      productForm.reset(DEFAULT_PRODUCT);
    }
  }, [saveState, productForm]);

  useEffect(() => {
    if (deleteState.success) {
      setDeleteTarget(null);
    }
  }, [deleteState]);

  const handleOpenAdd = () => {
    productForm.reset(DEFAULT_PRODUCT);
    setPickedProduct(null);
    setEditingUuid(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (product: SelectProducts) => {
    productForm.reset(productRowToDialogValues(product));
    setPickedProduct(productRowToOption(product));
    setEditingUuid(product.uuid);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      productForm.reset(DEFAULT_PRODUCT);
      setPickedProduct(null);
      setEditingUuid(null);
    }
    setIsDialogOpen(open);
  };

  const handleCancel = () => {
    handleDialogOpenChange(false);
  };

  const handleOpenPicker = () => setIsPickerOpen(true);

  const handleCancelPicker = () => setIsPickerOpen(false);

  const handlePickProduct = (product: ProductOption) => {
    setPickedProduct(product);
    productForm.setValue("productUuid", product.uuid);
    setIsPickerOpen(false);
  };

  const handleSave = productForm.handleSubmit((values) => {
    dispatchSave({ companyUuid, productUuid: editingUuid, values });
  });

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      dispatchDelete({ companyUuid, productUuid: deleteTarget.uuid });
    }
  };

  return (
    <div className="space-y-4">
      <FormError>{saveState.error ?? deleteState.error}</FormError>

      <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
        {products.length > 0 && (
          <div className="overflow-x-auto rounded-lg border bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 font-medium">Pref</th>
                  <th className="px-3 py-2 font-medium">EAN</th>
                  <th className="px-3 py-2 font-medium">External Code</th>
                  <th className="px-3 py-2 font-medium">Editing</th>
                  <th className="px-3 py-2 font-medium">Delivery Time</th>
                  <th className="px-3 py-2 font-medium">Min. Order Qty</th>
                  <th className="px-3 py-2 font-medium">Order Series</th>
                  <th className="px-3 py-2 font-medium">Website</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.uuid} className="border-b last:border-0">
                    <td className="px-3 py-2 font-mono">
                      {product.productCode}
                    </td>
                    <td className="px-3 py-2">{product.name}</td>
                    <td className="px-3 py-2 text-center">
                      {product.preferred ? "✓" : ""}
                    </td>
                    <td className="px-3 py-2">{product.ean || "—"}</td>
                    <td className="px-3 py-2">
                      {product.externalProductCode || "—"}
                    </td>
                    <td className="px-3 py-2">{product.editing || "—"}</td>
                    <td className="px-3 py-2">
                      {product.deliveryTime ?? 0}
                      {product.deliveryTimeUnit
                        ? ` ${DELIVERY_TIME_UNIT_LABELS[product.deliveryTimeUnit]}`
                        : ""}
                    </td>
                    <td className="px-3 py-2">
                      {product.minOrderQty ?? "0"}
                      {product.minOrderQtyUnit
                        ? ` ${PURCHASING_UNIT_LABELS[product.minOrderQtyUnit]}`
                        : ""}
                    </td>
                    <td className="px-3 py-2">
                      {product.orderSeries ?? 0}
                      {product.orderSeriesUnit
                        ? ` ${PURCHASING_UNIT_LABELS[product.orderSeriesUnit]}`
                        : ""}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {product.showOnWebsite ? "✓" : ""}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(product)}
                          className="rounded p-1 text-muted-foreground hover:text-primary"
                          disabled={isSaving || isDeleting}
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit product</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(product)}
                          className="rounded p-1 text-muted-foreground hover:text-destructive"
                          disabled={isSaving || isDeleting}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Delete product</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          disabled={isSaving || isDeleting}
        >
          <Plus className="size-4" />
          Add Product
        </button>
        {products.length === 0 && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Package className="size-3.5" />
            No products added yet.
          </p>
        )}
      </div>

      <ProductDialog
        isOpen={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onCancel={handleCancel}
        onSave={handleSave}
        form={productForm}
        selectedProduct={pickedProduct}
        onBrowse={handleOpenPicker}
        submitLabel={editingUuid ? "Save Changes" : "Add Product"}
      />

      <ProductPickerDialog
        isOpen={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        onCancel={handleCancelPicker}
        onSelect={handlePickProduct}
        productGroups={productGroups}
        products={availableProducts}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete product"
        description={`Delete ${
          deleteTarget
            ? `${deleteTarget.productCode} — ${deleteTarget.name}`
            : "this product"
        }? This can't be undone.`}
        confirmLabel="Delete"
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
