import { db, ProductionWorkOrders, WarehouseWorkOrders } from "@/db";
import { sql } from "drizzle-orm";

// The Drizzle transaction handle passed into db.transaction(async (tx) => ...).
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * The next work-order numbers, taken from one counter shared by the warehouse
 * and the machines.
 *
 * Raising the work for a sales order produces several orders at once — the
 * picking, the fetch that carries the steel to the machine, and the run itself —
 * and the floor reads them as one consecutive block: 305838, 305839, 305840.
 * Two counters would interleave them, so a picking slip and a production slip
 * could both be called 305839 and the shop would have no way to say which job
 * somebody meant.
 *
 * The high-water mark is read across both tables rather than kept in a settings
 * row, so there is nothing that can drift out of step with what was actually
 * issued.
 *
 * Call this inside the transaction that writes the orders. Two callers racing
 * would read the same mark, but both numbers are unique columns, so the loser
 * fails its insert and retries rather than quietly reusing a number.
 */
export const nextWorkOrderNumbers = async (
  tx: Transaction,
  count: number,
): Promise<number[]> => {
  if (count <= 0) {
    return [];
  }

  const [row] = await tx
    .select({
      highest: sql<number>`GREATEST(
        COALESCE((SELECT MAX(${WarehouseWorkOrders.number}) FROM ${WarehouseWorkOrders}), 0),
        COALESCE((SELECT MAX(${ProductionWorkOrders.number}) FROM ${ProductionWorkOrders}), 0)
      )`,
    })
    .from(sql`(SELECT 1) AS one`);

  const start = Number(row?.highest ?? 0) + 1;
  return Array.from({ length: count }, (_, index) => start + index);
};

/** The next single work-order number. */
export const nextWorkOrderNumber = async (tx: Transaction): Promise<number> => {
  const [number] = await nextWorkOrderNumbers(tx, 1);
  if (number === undefined) {
    throw new Error("Could not allocate a work-order number.");
  }
  return number;
};
