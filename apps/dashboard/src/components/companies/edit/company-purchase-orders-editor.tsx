"use client";

import {
  deleteCompanyPurchaseOrder,
  saveCompanyPurchaseOrder,
} from "@/app/(dashboard)/companies/[uuid]/edit/purchase-orders/actions";
import { purchaseOrderRowToDialogValues } from "@/app/(dashboard)/companies/[uuid]/edit/purchase-orders/mappers";
import {
  DEFAULT_PURCHASE_ORDER,
  purchaseOrderDialogSchema,
  PurchaseOrderDialogValues,
} from "@/app/(dashboard)/companies/validation";
import { PurchaseOrderDialog } from "@/components/companies/dialogs/purchase-order-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import type { SelectPurchaseOrders } from "@/db/schema/purchase-orders";
import { todayDateString } from "@/lib/helpers";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { PackageCheck, Pencil, Plus, Trash2 } from "lucide-react";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type Props = {
  companyUuid: string;
  purchaseOrders: SelectPurchaseOrders[];
};

export const CompanyPurchaseOrdersEditor = ({
  companyUuid,
  purchaseOrders,
}: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SelectPurchaseOrders | null>(
    null,
  );

  const [saveState, dispatchSave, isSaving] = useActionState(
    saveCompanyPurchaseOrder,
    {},
  );
  const [deleteState, dispatchDelete, isDeleting] = useActionState(
    deleteCompanyPurchaseOrder,
    {},
  );

  const purchaseOrderForm = useForm<PurchaseOrderDialogValues>({
    resolver: zodResolver(purchaseOrderDialogSchema),
    defaultValues: DEFAULT_PURCHASE_ORDER,
  });

  useEffect(() => {
    if (saveState.success) {
      setIsDialogOpen(false);
      setEditingUuid(null);
      purchaseOrderForm.reset(DEFAULT_PURCHASE_ORDER);
    }
  }, [saveState, purchaseOrderForm]);

  useEffect(() => {
    if (deleteState.success) {
      setDeleteTarget(null);
    }
  }, [deleteState]);

  // Legacy behaviour: a new purchase order opens with today's order date
  // pre-filled on top of the shared defaults.
  const handleOpenAdd = () => {
    purchaseOrderForm.reset({
      ...DEFAULT_PURCHASE_ORDER,
      orderDate: todayDateString(),
    });
    setEditingUuid(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (order: SelectPurchaseOrders) => {
    purchaseOrderForm.reset(purchaseOrderRowToDialogValues(order));
    setEditingUuid(order.uuid);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      purchaseOrderForm.reset(DEFAULT_PURCHASE_ORDER);
      setEditingUuid(null);
    }
    setIsDialogOpen(open);
  };

  const handleCancel = () => {
    handleDialogOpenChange(false);
  };

  const handleSave = purchaseOrderForm.handleSubmit((values) => {
    startTransition(() => {
      dispatchSave({ companyUuid, purchaseOrderUuid: editingUuid, values });
    });
  });

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      startTransition(() => {
        dispatchDelete({ companyUuid, purchaseOrderUuid: deleteTarget.uuid });
      });
    }
  };

  return (
    <div className="space-y-4">
      <FormError>{saveState.error ?? deleteState.error}</FormError>

      <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
        {purchaseOrders.length === 0 && (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No purchase orders yet — add the first one below.
          </p>
        )}
        {purchaseOrders.map((order) => (
          <div
            key={order.uuid}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <PackageCheck className="size-4 shrink-0 text-muted-foreground" />
              <span className="shrink-0 text-muted-foreground">
                {order.orderDate || "Purchase order"}
              </span>
              <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {PURCHASE_ORDER_STATUS_LABELS[order.status]}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                € {order.amount}
              </span>
              {order.reference && (
                <span className="line-clamp-1 text-xs text-muted-foreground">
                  {order.reference}
                </span>
              )}
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                0 days in system
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => handleOpenEdit(order)}
                className="rounded p-1 text-muted-foreground hover:text-primary"
                disabled={isSaving || isDeleting}
              >
                <Pencil className="size-4" />
                <span className="sr-only">Edit purchase order</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(order)}
                className="rounded p-1 text-muted-foreground hover:text-destructive"
                disabled={isSaving || isDeleting}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Delete purchase order</span>
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          disabled={isSaving || isDeleting}
        >
          <Plus className="size-4" />
          Add Purchase Order
        </button>
      </div>

      <PurchaseOrderDialog
        isOpen={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onCancel={handleCancel}
        onSave={handleSave}
        form={purchaseOrderForm}
        isEditing={editingUuid !== null}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete purchase order"
        description={`Delete ${
          deleteTarget
            ? deleteTarget.reference ||
              deleteTarget.orderDate ||
              "this purchase order"
            : "this purchase order"
        }? This can't be undone.`}
        confirmLabel="Delete"
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
