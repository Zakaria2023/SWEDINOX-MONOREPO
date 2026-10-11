"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  BadgeCheck,
  Building2,
  ClipboardList,
  Mail,
  MessageSquareWarning,
  PackageCheck,
  Printer,
  ReceiptText,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import {
  creditReturnOrder,
  deleteReturnOrder,
  makeReturnOrderFinal,
  receiveReturnOrder,
  ReturnOrderActionResult,
  ReturnOrderDetail,
} from "@/app/(dashboard)/return-orders/actions";
import { Button } from "@/components/shadcn/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";

const SAVE_FIRST = "Save the return order first";

const NOT_BUILT = "Not built yet";

type Props = {
  /** The saved return; null on a new one, whose document actions all wait. */
  returnOrder: ReturnOrderDetail | null;
};

/**
 * The reference's toolbar on a return: `Make final · Print… · Send… · Show
 * company · Show order · Show complaint · Workorder · Invoice` (return 290247,
 * 29-9-2026). `Make final` leaves once the return is final; the rest grey
 * while there is nothing to open. Between `Workorder` and `Invoice` sits the
 * step the reference takes through its unloading: the goods coming back.
 */
export const ReturnOrderToolbar = ({ returnOrder }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const status = returnOrder?.status ?? "open";
  const isProvisional = status === "open";
  const isReceived = status === "received";
  const isCredited = status === "credited";
  const isCancelled = status === "cancelled";
  const complaintUuid =
    returnOrder?.complaints[0]?.complaintUuid ??
    returnOrder?.items.find((item) => item.complaintUuid)?.complaintUuid ??
    null;
  const creditNote = returnOrder?.credits[0] ?? null;

  const run = (action: () => Promise<ReturnOrderActionResult>) => {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-2 border-b pb-4">
      <div className="flex flex-wrap gap-2">
        {isProvisional && (
          <Button
            type="button"
            onClick={() => {
              if (returnOrder) {
                run(() => makeReturnOrderFinal(returnOrder.uuid));
              }
            }}
            disabled={!returnOrder || isPending}
            title={returnOrder ? undefined : SAVE_FIRST}
          >
            <BadgeCheck className="me-1.5 size-4" />
            Make final
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          disabled
          title={returnOrder ? NOT_BUILT : SAVE_FIRST}
        >
          <Printer className="me-1.5 size-4" />
          Print…
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled
          title={returnOrder ? NOT_BUILT : SAVE_FIRST}
        >
          <Mail className="me-1.5 size-4" />
          Send…
        </Button>
        {returnOrder ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/companies/${returnOrder.companyUuid}`} />}
          >
            <Building2 className="me-1.5 size-4" />
            Show company
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled title={SAVE_FIRST}>
            <Building2 className="me-1.5 size-4" />
            Show company
          </Button>
        )}
        {returnOrder?.orderUuid ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/orders/${returnOrder.orderUuid}`} />}
          >
            <ShoppingCart className="me-1.5 size-4" />
            Show order
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled>
            <ShoppingCart className="me-1.5 size-4" />
            Show order
          </Button>
        )}
        {complaintUuid ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/complaints/${complaintUuid}`} />}
          >
            <MessageSquareWarning className="me-1.5 size-4" />
            Show complaint
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled>
            <MessageSquareWarning className="me-1.5 size-4" />
            Show complaint
          </Button>
        )}
        {returnOrder?.warehouseWorkOrderUuid ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link
                href={`/warehouse-work-orders/${returnOrder.warehouseWorkOrderUuid}`}
              />
            }
          >
            <ClipboardList className="me-1.5 size-4" />
            Workorder
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled
            title="No unloading has been raised for this return"
          >
            <ClipboardList className="me-1.5 size-4" />
            Workorder
          </Button>
        )}

        {/* Goods arriving and money going back are two decisions, so they
            are two buttons — `Invoice` only wakes once the goods are in. */}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (returnOrder) {
              run(() => receiveReturnOrder(returnOrder.uuid));
            }
          }}
          disabled={
            !returnOrder ||
            isPending ||
            isReceived ||
            isCredited ||
            isCancelled
          }
          title={
            returnOrder
              ? "Books the goods back into stock at the value they left at."
              : SAVE_FIRST
          }
        >
          <PackageCheck className="me-1.5 size-4" />
          {isReceived || isCredited ? "Goods received" : "Receive goods"}
        </Button>
        {isCredited && creditNote ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/invoices/${creditNote.uuid}`} />}
          >
            <ReceiptText className="me-1.5 size-4" />
            Invoice
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (returnOrder) {
                run(() => creditReturnOrder(returnOrder.uuid));
              }
            }}
            disabled={!returnOrder || isPending || !isReceived}
            title={
              isReceived
                ? "Raises the credit note at the price each line was invoiced at."
                : isCredited
                  ? "Closed without a credit note: the return carried no value."
                  : "Receive the goods first"
            }
          >
            <ReceiptText className="me-1.5 size-4" />
            Invoice
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsDeleteOpen(true)}
          disabled={!returnOrder || isPending || isReceived || isCredited}
          title={
            isReceived || isCredited
              ? "The goods are back in stock; this return can no longer be deleted"
              : undefined
          }
        >
          <Trash2 className="me-1.5 size-4" />
          Delete
        </Button>
      </div>
      <FormError>{error}</FormError>
      {returnOrder && (
        <ConfirmDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={() => {
            run(() => deleteReturnOrder(returnOrder.uuid));
            setIsDeleteOpen(false);
          }}
          isPending={isPending}
          title="Delete return order"
          description="This removes the return order, its lines, surcharges and texts. This cannot be undone."
          confirmLabel="Delete Return Order"
        />
      )}
    </div>
  );
};
