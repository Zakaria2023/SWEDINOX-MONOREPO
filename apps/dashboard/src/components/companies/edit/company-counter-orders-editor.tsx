"use client";

import {
  deleteCounterOrder,
  saveCounterOrder,
} from "@/app/(dashboard)/companies/[uuid]/edit/counter-orders/actions";
import { counterOrderRowToDialogValues } from "@/app/(dashboard)/companies/[uuid]/edit/counter-orders/mappers";
import {
  counterOrderDialogSchema,
  CounterOrderDialogValues,
  DEFAULT_COUNTER_ORDER,
} from "@/app/(dashboard)/companies/validation";
import { CounterOrderDialog } from "@/components/companies/dialogs/counter-order-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import type { SelectCounterOrders } from "@/db/schema/counter-orders";
import { daysInSystem, todayDateString } from "@/lib/helpers";
import { COUNTER_ORDER_STATUS_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type Props = {
  companyUuid: string;
  counterOrders: SelectCounterOrders[];
};

export const CompanyCounterOrdersEditor = ({
  companyUuid,
  counterOrders,
}: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SelectCounterOrders | null>(
    null,
  );

  const [saveState, dispatchSave, isSaving] = useActionState(
    saveCounterOrder,
    {},
  );
  const [deleteState, dispatchDelete, isDeleting] = useActionState(
    deleteCounterOrder,
    {},
  );

  const counterOrderForm = useForm<CounterOrderDialogValues>({
    resolver: zodResolver(counterOrderDialogSchema),
    defaultValues: DEFAULT_COUNTER_ORDER,
  });

  useEffect(() => {
    if (saveState.success) {
      setIsDialogOpen(false);
      setEditingUuid(null);
      counterOrderForm.reset(DEFAULT_COUNTER_ORDER);
    }
  }, [saveState, counterOrderForm]);

  useEffect(() => {
    if (deleteState.success) {
      setDeleteTarget(null);
    }
  }, [deleteState]);

  const handleOpenAdd = () => {
    // Same default as the legacy add flow: the order date starts at today.
    counterOrderForm.reset({
      ...DEFAULT_COUNTER_ORDER,
      orderDate: todayDateString(),
    });
    setEditingUuid(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (order: SelectCounterOrders) => {
    counterOrderForm.reset(counterOrderRowToDialogValues(order));
    setEditingUuid(order.uuid);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      counterOrderForm.reset(DEFAULT_COUNTER_ORDER);
      setEditingUuid(null);
    }
    setIsDialogOpen(open);
  };

  const handleCancel = () => {
    handleDialogOpenChange(false);
  };

  const handleSave = counterOrderForm.handleSubmit((values) => {
    startTransition(() => {
      dispatchSave({ companyUuid, counterOrderUuid: editingUuid, values });
    });
  });

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      startTransition(() => {
        dispatchDelete({ companyUuid, counterOrderUuid: deleteTarget.uuid });
      });
    }
  };

  return (
    <div className="space-y-4">
      <FormError>{saveState.error ?? deleteState.error}</FormError>

      <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
        {counterOrders.length === 0 && (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No counter orders yet — add the first one below.
          </p>
        )}
        {counterOrders.map((order) => (
          <div
            key={order.uuid}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <ShoppingCart className="size-4 shrink-0 text-muted-foreground" />
              <span className="shrink-0 text-muted-foreground">
                {order.orderDate || "Counter order"}
              </span>
              {order.status && (
                <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                  {COUNTER_ORDER_STATUS_LABELS[order.status]}
                </span>
              )}
              <span className="shrink-0 text-xs text-muted-foreground">
                € {order.amountExVat ?? "0.00"}
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
                <span className="sr-only">Edit counter order</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(order)}
                className="rounded p-1 text-muted-foreground hover:text-destructive"
                disabled={isSaving || isDeleting}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Delete counter order</span>
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
          Add Counter Order
        </button>
      </div>

      <CounterOrderDialog
        isOpen={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onCancel={handleCancel}
        onSave={handleSave}
        form={counterOrderForm}
        isEditing={editingUuid !== null}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete counter order"
        description={`Delete ${
          deleteTarget?.orderDate
            ? `the counter order from ${deleteTarget.orderDate}`
            : "this counter order"
        }? This can't be undone.`}
        confirmLabel="Delete"
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
