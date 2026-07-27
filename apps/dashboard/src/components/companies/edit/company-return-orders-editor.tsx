"use client";

import {
  deleteReturnOrder,
  saveReturnOrder,
} from "@/app/(dashboard)/companies/[uuid]/edit/return-orders/actions";
import { returnOrderRowToDialogValues } from "@/app/(dashboard)/companies/[uuid]/edit/return-orders/mappers";
import {
  DEFAULT_RETURN_ORDER,
  returnOrderDialogSchema,
  ReturnOrderDialogValues,
} from "@/app/(dashboard)/companies/validation";
import { ReturnOrderDialog } from "@/components/companies/dialogs/return-order-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import { SelectReturnOrders } from "@/db/schema/return-orders";
import { daysInSystem, todayDateString } from "@/lib/helpers";
import {
  RETURN_ORDER_REASON_LABELS,
  RETURN_ORDER_STATUS_LABELS,
} from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2, Undo2 } from "lucide-react";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type Props = {
  companyUuid: string;
  returnOrders: SelectReturnOrders[];
};

export const CompanyReturnOrdersEditor = ({
  companyUuid,
  returnOrders,
}: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SelectReturnOrders | null>(
    null,
  );

  const [saveState, dispatchSave, isSaving] = useActionState(
    saveReturnOrder,
    {},
  );
  const [deleteState, dispatchDelete, isDeleting] = useActionState(
    deleteReturnOrder,
    {},
  );

  const returnOrderForm = useForm<ReturnOrderDialogValues>({
    resolver: zodResolver(returnOrderDialogSchema),
    defaultValues: DEFAULT_RETURN_ORDER,
  });

  useEffect(() => {
    if (saveState.success) {
      setIsDialogOpen(false);
      setEditingUuid(null);
      returnOrderForm.reset(DEFAULT_RETURN_ORDER);
    }
  }, [saveState, returnOrderForm]);

  useEffect(() => {
    if (deleteState.success) {
      setDeleteTarget(null);
    }
  }, [deleteState]);

  const handleOpenAdd = () => {
    // Same default as the legacy add flow: the order date starts at today.
    returnOrderForm.reset({
      ...DEFAULT_RETURN_ORDER,
      orderDate: todayDateString(),
    });
    setEditingUuid(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (order: SelectReturnOrders) => {
    returnOrderForm.reset(returnOrderRowToDialogValues(order));
    setEditingUuid(order.uuid);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      returnOrderForm.reset(DEFAULT_RETURN_ORDER);
      setEditingUuid(null);
    }
    setIsDialogOpen(open);
  };

  const handleCancel = () => {
    handleDialogOpenChange(false);
  };

  const handleSave = returnOrderForm.handleSubmit((values) => {
    startTransition(() => {
      dispatchSave({ companyUuid, returnOrderUuid: editingUuid, values });
    });
  });

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      startTransition(() => {
        dispatchDelete({ companyUuid, returnOrderUuid: deleteTarget.uuid });
      });
    }
  };

  return (
    <div className="space-y-4">
      <FormError>{saveState.error ?? deleteState.error}</FormError>

      <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
        {returnOrders.length === 0 && (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No return orders yet — add the first one below.
          </p>
        )}
        {returnOrders.map((order) => (
          <div
            key={order.uuid}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <Undo2 className="size-4 shrink-0 text-muted-foreground" />
              <span className="shrink-0 text-muted-foreground">
                {order.orderReference || order.orderDate || "Return"}
              </span>
              {order.status && (
                <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                  {RETURN_ORDER_STATUS_LABELS[order.status]}
                </span>
              )}
              {order.returnReason && (
                <span className="line-clamp-1 text-muted-foreground">
                  {RETURN_ORDER_REASON_LABELS[order.returnReason]}
                </span>
              )}
              <span className="shrink-0 text-xs text-muted-foreground">
                € {order.totalExclVat ?? "0.00"}
              </span>
              {order.handlingBlocked && (
                <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                  Blocked
                </span>
              )}
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {daysInSystem(order.createdAt)} days in system
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
                <span className="sr-only">Edit return order</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(order)}
                className="rounded p-1 text-muted-foreground hover:text-destructive"
                disabled={isSaving || isDeleting}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Delete return order</span>
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
          Add Return
        </button>
      </div>

      <ReturnOrderDialog
        isOpen={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onCancel={handleCancel}
        onSave={handleSave}
        form={returnOrderForm}
        isEditing={editingUuid !== null}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete return order"
        description={`Delete ${
          deleteTarget?.orderReference
            ? `return order ${deleteTarget.orderReference}`
            : "this return order"
        }? This can't be undone.`}
        confirmLabel="Delete"
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
