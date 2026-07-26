"use client";

import {
  deleteCompanyCustomerStock,
  saveCompanyCustomerStock,
} from "@/app/(dashboard)/companies/[uuid]/edit/customer-stock/actions";
import {
  customerStockRowToDialogValues,
  customerStockRowToOption,
} from "@/app/(dashboard)/companies/[uuid]/edit/customer-stock/mappers";
import {
  customerStockDialogSchema,
  CustomerStockDialogValues,
  DEFAULT_CUSTOMER_STOCK,
} from "@/app/(dashboard)/companies/validation";
import type { ProductGroupOption } from "@/app/(dashboard)/product-groups/actions";
import type { ProductOption } from "@/app/(dashboard)/products/actions";
import { CustomerStockDialog } from "@/components/companies/dialogs/customer-stock-dialog";
import { ProductPickerDialog } from "@/components/companies/dialogs/product-picker-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import type { SelectCustomerStock } from "@/db/schema/customer-stock";
import { CUSTOMER_STOCK_REASON_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { Boxes, Pencil, Plus, Trash2 } from "lucide-react";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type Props = {
  companyUuid: string;
  customerStock: SelectCustomerStock[];
  productGroups: ProductGroupOption[];
  availableProducts: ProductOption[];
};

export const CompanyCustomerStockEditor = ({
  companyUuid,
  customerStock,
  productGroups,
  availableProducts,
}: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [pickedProduct, setPickedProduct] = useState<ProductOption | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<SelectCustomerStock | null>(
    null,
  );

  const [saveState, dispatchSave, isSaving] = useActionState(
    saveCompanyCustomerStock,
    {},
  );
  const [deleteState, dispatchDelete, isDeleting] = useActionState(
    deleteCompanyCustomerStock,
    {},
  );

  const stockForm = useForm<CustomerStockDialogValues>({
    resolver: zodResolver(customerStockDialogSchema),
    defaultValues: DEFAULT_CUSTOMER_STOCK,
  });

  useEffect(() => {
    if (saveState.success) {
      setIsDialogOpen(false);
      setEditingUuid(null);
      setPickedProduct(null);
      stockForm.reset(DEFAULT_CUSTOMER_STOCK);
    }
  }, [saveState, stockForm]);

  useEffect(() => {
    if (deleteState.success) {
      setDeleteTarget(null);
    }
  }, [deleteState]);

  const handleOpenAdd = () => {
    stockForm.reset(DEFAULT_CUSTOMER_STOCK);
    setPickedProduct(null);
    setEditingUuid(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (entry: SelectCustomerStock) => {
    stockForm.reset(customerStockRowToDialogValues(entry));
    setPickedProduct(customerStockRowToOption(entry));
    setEditingUuid(entry.uuid);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      stockForm.reset(DEFAULT_CUSTOMER_STOCK);
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
    stockForm.setValue("productUuid", product.uuid);
    setIsPickerOpen(false);
  };

  const handleSave = stockForm.handleSubmit((values) => {
    startTransition(() => {
      dispatchSave({ companyUuid, customerStockUuid: editingUuid, values });
    });
  });

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      startTransition(() => {
        dispatchDelete({ companyUuid, customerStockUuid: deleteTarget.uuid });
      });
    }
  };

  return (
    <div className="space-y-4">
      <FormError>{saveState.error ?? deleteState.error}</FormError>

      <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
        {customerStock.length > 0 && (
          <div className="overflow-x-auto rounded-lg border bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Location</th>
                  <th className="px-3 py-2 font-medium">Product code</th>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Qty (Stock)
                  </th>
                  <th className="px-3 py-2 font-medium">Reason</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {customerStock.map((entry) => (
                  <tr key={entry.uuid} className="border-b last:border-0">
                    <td className="px-3 py-2">{entry.location}</td>
                    <td className="px-3 py-2 font-mono">{entry.productCode}</td>
                    <td className="px-3 py-2">{entry.productName}</td>
                    <td className="px-3 py-2 text-right">{entry.quantity}</td>
                    <td className="px-3 py-2">
                      {entry.reason
                        ? CUSTOMER_STOCK_REASON_LABELS[entry.reason]
                        : ""}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {entry.description}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(entry)}
                          className="rounded p-1 text-muted-foreground hover:text-primary"
                          disabled={isSaving || isDeleting}
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit stock booking</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(entry)}
                          className="rounded p-1 text-muted-foreground hover:text-destructive"
                          disabled={isSaving || isDeleting}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Delete stock booking</span>
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
          New
        </button>
        {customerStock.length === 0 && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Boxes className="size-3.5" />
            No customer stock booked yet.
          </p>
        )}
      </div>

      <CustomerStockDialog
        isOpen={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onCancel={handleCancel}
        onSave={handleSave}
        form={stockForm}
        selectedProduct={pickedProduct}
        onBrowse={handleOpenPicker}
        submitLabel={editingUuid ? "Save Changes" : "Book Stock"}
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
        title="Delete stock booking"
        description={`Delete ${
          deleteTarget
            ? [deleteTarget.productCode, deleteTarget.productName]
                .filter(Boolean)
                .join(" — ") || "this stock booking"
            : "this stock booking"
        }? This can't be undone.`}
        confirmLabel="Delete"
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
