import "server-only";

import { db } from "@/db";
import { OrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { orderStatusFromLines } from "@/lib/helpers";
import { eq } from "drizzle-orm";

type OrderStatusWriter = Pick<typeof db, "select" | "update">;

/**
 * Re-derive a sales order header's status from its lines.
 *
 * Until 7-10-2026 nothing did: the header was written `released` when the order
 * was printed and `cancelled` when it was called off, and every delivery and
 * invoice after that moved the lines and left the header where it was. The
 * reference's `Orders and Quotes` grid groups on a header that does move —
 * `Partially delivered`, `Delivered`, `Partially invoiced`, `Invoiced`.
 */
export const refreshOrderStatus = async (
  tx: OrderStatusWriter,
  orderUuid: string,
): Promise<void> => {
  const [order] = await tx
    .select({ status: Orders.status })
    .from(Orders)
    .where(eq(Orders.uuid, orderUuid))
    .limit(1);

  if (!order) {
    return;
  }

  const lines = await tx
    .select({ lineStatus: OrderItems.lineStatus })
    .from(OrderItems)
    .where(eq(OrderItems.orderUuid, orderUuid));

  const next = orderStatusFromLines(
    order.status,
    lines.map((line) => line.lineStatus),
  );

  if (next !== order.status) {
    await tx.update(Orders).set({ status: next }).where(eq(Orders.uuid, orderUuid));
  }
};

/** The same, for callers that hold a line rather than its order. */
export const refreshOrderStatusForLine = async (
  tx: OrderStatusWriter,
  orderItemUuid: string,
): Promise<void> => {
  const [line] = await tx
    .select({ orderUuid: OrderItems.orderUuid })
    .from(OrderItems)
    .where(eq(OrderItems.uuid, orderItemUuid))
    .limit(1);

  if (line) {
    await refreshOrderStatus(tx, line.orderUuid);
  }
};
