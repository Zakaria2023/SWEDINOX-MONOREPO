import { db } from "@/db";
import { OrderItems } from "@/db/schema/order-items";
import { eq } from "drizzle-orm";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * A purchase line has been raised **for** a sales line: point the sale at it
 * and make the sale `CD`.
 *
 * Captured 8-10-2026 on purchase order `404299` / sales order `O108183`: the
 * purchase line reads `For line O108183/10` and the sales line's `Type` reads
 * `CD`. A sales line that already holds stock of its own and is topped up by
 * the purchase is `Stk+CD`, the reference's third value.
 */
export const coverSalesLineWithPurchase = async (
  tx: Transaction,
  orderItemUuid: string,
  purchaseOrderItemUuid: string,
): Promise<void> => {
  const [line] = await tx
    .select({ qtyReserved: OrderItems.qtyReserved })
    .from(OrderItems)
    .where(eq(OrderItems.uuid, orderItemUuid))
    .limit(1);

  if (!line) {
    return;
  }

  await tx
    .update(OrderItems)
    .set({
      purchaseOrderItemUuid,
      sourceType:
        Number(line.qtyReserved ?? 0) > 0 ? "stock_and_cross_dock" : "cross_dock",
    })
    .where(eq(OrderItems.uuid, orderItemUuid));
};
