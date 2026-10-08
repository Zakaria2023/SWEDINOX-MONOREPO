import { db } from "@/db";
import { TransactionRollbackError } from "drizzle-orm";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type DryRunResult<T> = { ran: true; value: T } | { ran: false };

type DryRunBox<T> = { result: DryRunResult<T> };

/**
 * The reference's `Simuleer` — a dry run before a change (PLANNED-CODE-CHANGES-6
 * §28b).
 *
 * Runs `work` inside a real transaction, so every rule, guard and derived
 * figure is the one the real action would apply, then rolls it back. Nothing
 * a simulation shows is a re-implementation that could drift from what `OK`
 * does: it *is* what `OK` does, undone.
 *
 * Errors thrown by `work` propagate unchanged, so a simulation refuses exactly
 * what the real action would refuse.
 */
export const dryRun = async <T>(
  work: (tx: Transaction) => Promise<T>,
): Promise<T> => {
  // A box rather than a `let`: TypeScript keeps a `let` narrowed to its
  // initial value across the callback that reassigns it.
  const box: DryRunBox<T> = { result: { ran: false } };

  try {
    await db.transaction(async (tx) => {
      box.result = { ran: true, value: await work(tx) };
      tx.rollback();
    });
  } catch (error) {
    if (!(error instanceof TransactionRollbackError)) {
      throw error;
    }
  }

  const { result } = box;
  if (!result.ran) {
    throw new Error("The simulation did not run");
  }

  return result.value;
};
