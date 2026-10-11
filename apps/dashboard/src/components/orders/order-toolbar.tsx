"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  BadgeCheck,
  Building2,
  ClipboardList,
  Copy,
  FileText,
  Mail,
  Printer,
  Puzzle,
  Undo2,
  Wand2,
  XCircle,
} from "lucide-react";
import { cancelOrder, OrderDetail } from "@/app/(dashboard)/orders/actions";
import { SendOrderDialog } from "@/components/orders/send-order-dialog";
import { Button } from "@/components/shadcn/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";

const SAVE_FIRST = "Save the order first";
const NOT_BUILT = "Not built yet";

type Props = {
  /** The saved order; null on a new one, where every action waits for Save. */
  order: OrderDetail | null;
  /** The picking `Make final` raised, which `Workorder` opens. */
  pickingWorkOrderUuid: string | null;
};

/**
 * The reference's order toolbar, in its order (100785, 7-10-2026): `Make
 * final · Print… · Send… · Return · Par. return · Show company · PAC · Cancel
 * · Optimize · Copy · Workorder · Invoice · Options…`. `Make final` leaves the
 * toolbar once the order is final, as on 102191; everything else stays, and
 * what is not built is greyed rather than hidden.
 */
export const OrderToolbar = ({ order, pickingWorkOrderUuid }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [sendMode, setSendMode] = useState<"final" | "send" | null>(null);

  const isSaved = order !== null;
  const isCancelled = order?.status === "cancelled";
  // Making an order final is the one press that raises the picking and the
  // transport job, so it is only offered while the order is still a typed
  // document nobody has released.
  const isProvisional = !isSaved || order.status === "provisional";
  // A line is still open to billing until its invoiced quantity reaches its
  // quantity, which is when it becomes `invoiced`. With none left the
  // reference greys Cancel, Par. return and Invoice (106623, 7-10-2026).
  const isFullyInvoiced =
    isSaved &&
    (order.status === "invoiced" ||
      (order.items.length > 0 &&
        order.items.every(
          (item) => item.status !== "reserved" && item.status !== "delivered",
        )));
  const canCancel = isSaved && !isCancelled && !isFullyInvoiced;
  const canFollowUp =
    isSaved && !isCancelled && !isProvisional && !isFullyInvoiced;

  const handleCancel = () => {
    if (!order) {
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await cancelOrder(order.uuid);
      if (result.error) {
        setError(result.error);
      }
      setIsCancelOpen(false);
    });
  };

  return (
    <div className="space-y-2 border-b pb-4">
      <div className="flex flex-wrap gap-2">
        {isProvisional && (
          <Button
            type="button"
            onClick={() => setSendMode("final")}
            disabled={!isSaved || isPending || isCancelled}
            title={isSaved ? undefined : SAVE_FIRST}
          >
            <BadgeCheck className="me-1.5 size-4" />
            Make final
          </Button>
        )}
        {/* No order confirmation is printed here yet; `Send…` mails it. */}
        <Button
          type="button"
          variant="outline"
          disabled
          title={isSaved ? NOT_BUILT : SAVE_FIRST}
        >
          <Printer className="me-1.5 size-4" />
          Print…
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setSendMode("send")}
          disabled={!isSaved || isPending || isProvisional || isCancelled}
          title={isSaved ? undefined : SAVE_FIRST}
        >
          <Mail className="me-1.5 size-4" />
          Send…
        </Button>
        {/* Greyed on the reference's own call-off order too. */}
        <Button
          type="button"
          variant="outline"
          disabled
          title={isSaved ? NOT_BUILT : SAVE_FIRST}
        >
          <Undo2 className="me-1.5 size-4" />
          Return
        </Button>
        {order && canFollowUp ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link
                href={`/return-orders/new?company=${order.companyUuid}&order=${order.uuid}`}
              />
            }
          >
            <Undo2 className="me-1.5 size-4" />
            Par. return
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled
            title={isSaved ? undefined : SAVE_FIRST}
          >
            <Undo2 className="me-1.5 size-4" />
            Par. return
          </Button>
        )}
        {order ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/companies/${order.companyUuid}`} />}
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
        <Button
          type="button"
          variant="outline"
          disabled
          title={isSaved ? NOT_BUILT : SAVE_FIRST}
        >
          PAC
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setIsCancelOpen(true)}
          disabled={isPending || !canCancel}
          title={isSaved ? undefined : SAVE_FIRST}
        >
          <XCircle className="me-1.5 size-4" />
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled
          title={isSaved ? NOT_BUILT : SAVE_FIRST}
        >
          <Wand2 className="me-1.5 size-4" />
          Optimize
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled
          title={isSaved ? NOT_BUILT : SAVE_FIRST}
        >
          <Copy className="me-1.5 size-4" />
          Copy
        </Button>
        {pickingWorkOrderUuid ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link href={`/warehouse-work-orders/${pickingWorkOrderUuid}`} />
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
            title={
              isSaved ? "Make the order final to raise its picking" : SAVE_FIRST
            }
          >
            <ClipboardList className="me-1.5 size-4" />
            Workorder
          </Button>
        )}
        {order && canFollowUp ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link href={`/invoices/add?company=${order.companyUuid}`} />
            }
          >
            <FileText className="me-1.5 size-4" />
            Invoice
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled
            title={isSaved ? undefined : SAVE_FIRST}
          >
            <FileText className="me-1.5 size-4" />
            Invoice
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          disabled
          title={isSaved ? NOT_BUILT : SAVE_FIRST}
        >
          <Puzzle className="me-1.5 size-4" />
          Options…
        </Button>
      </div>
      <FormError>{error}</FormError>

      {order && (
        <>
          <SendOrderDialog
            key={sendMode ?? "closed"}
            orderUuid={order.uuid}
            orderId={order.id}
            mode={sendMode ?? "send"}
            open={sendMode !== null}
            onOpenChange={(open) => {
              if (!open) {
                setSendMode(null);
              }
            }}
          />
          <ConfirmDialog
            open={isCancelOpen}
            onOpenChange={setIsCancelOpen}
            onConfirm={handleCancel}
            isPending={isPending}
            title="Cancel order"
            description="This cancels the order and releases any stock it had reserved. This cannot be undone."
            confirmLabel="Cancel Order"
          />
        </>
      )}
    </div>
  );
};
