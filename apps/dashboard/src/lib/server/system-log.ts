import "server-only";

import { db } from "@/db";
import { SystemLogs } from "@/db/schema/system-logs";
import { SystemLogCategory } from "@/lib/enums";
import { generateUuid } from "@/lib/helpers";

type SystemLogWriter = Pick<typeof db, "insert">;

export type SystemLogEntry = {
  category: SystemLogCategory;
  message: string;
  orderUuid?: string | null;
  /** Null when the system acted on its own — the credit rule holding an order. */
  userId?: string | null;
};

/**
 * Write one entry to the system log. Takes the surrounding transaction, so an
 * entry exists exactly when the change it describes was committed.
 */
export const writeSystemLog = async (
  tx: SystemLogWriter,
  { category, message, orderUuid = null, userId = null }: SystemLogEntry,
): Promise<void> => {
  await tx.insert(SystemLogs).values({
    uuid: generateUuid(),
    category,
    // The column is 1 000 characters; a long credit reason must not fail the
    // change it is recording.
    message: message.slice(0, 1000),
    orderUuid,
    userId,
  });
};
