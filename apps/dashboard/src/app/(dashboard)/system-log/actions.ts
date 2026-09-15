"use server";

import { db } from "@/db";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { SelectSystemLogs, SystemLogs } from "@/db/schema/system-logs";
import { SystemLogCategory } from "@/lib/enums";
import { describeError } from "@/lib/helpers";
import { desc, eq } from "drizzle-orm";

const SYSTEM_LOG_LIMIT = 1000;

export type SystemLogRow = Pick<
  SelectSystemLogs,
  "uuid" | "category" | "message" | "orderUuid" | "userId" | "createdAt"
> & {
  orderId: SelectOrders["id"] | null;
};

// The newest entries first, optionally one category only. Capped: the reference
// kept 9 360 entries over two and a half years, and this screen is read from
// the top.
export const getSystemLogs = async (
  category: SystemLogCategory | null,
): Promise<SystemLogRow[]> => {
  try {
    return await db
      .select({
        uuid: SystemLogs.uuid,
        category: SystemLogs.category,
        message: SystemLogs.message,
        orderUuid: SystemLogs.orderUuid,
        userId: SystemLogs.userId,
        createdAt: SystemLogs.createdAt,
        orderId: Orders.id,
      })
      .from(SystemLogs)
      .leftJoin(Orders, eq(SystemLogs.orderUuid, Orders.uuid))
      .where(category ? eq(SystemLogs.category, category) : undefined)
      .orderBy(desc(SystemLogs.createdAt), desc(SystemLogs.id))
      .limit(SYSTEM_LOG_LIMIT);
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch the system log"));
  }
};
