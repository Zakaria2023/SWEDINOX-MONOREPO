"use server";

import { db } from "@/db";
import {
  RevenueBudgets,
  SelectRevenueBudgets,
} from "@/db/schema/revenue-budgets";
import {
  RevenueGroups,
  SelectRevenueGroups,
} from "@/db/schema/revenue-groups";
import { requireAuth } from "@/lib/auth";
import { describeError, generateUuid, moneyString } from "@/lib/helpers";
import { asc, eq, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { revenueBudgetSchema, RevenueBudgetFormValues } from "./validation";

export type RevenueBudgetRow = SelectRevenueBudgets & {
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
};

export type RevenueGroupOption = Pick<
  SelectRevenueGroups,
  "uuid" | "number" | "name"
>;

export type RevenueBudgetActionResult = {
  error?: string;
  success?: boolean;
};

/** Every budget line of one year, month by month, group by group. */
export const getRevenueBudgets = async (
  year: number,
): Promise<RevenueBudgetRow[]> => {
  try {
    return await db
      .select({
        ...getTableColumns(RevenueBudgets),
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
      })
      .from(RevenueBudgets)
      .leftJoin(
        RevenueGroups,
        eq(RevenueBudgets.revenueGroupUuid, RevenueGroups.uuid),
      )
      .where(eq(RevenueBudgets.year, year))
      .orderBy(asc(RevenueBudgets.month), asc(RevenueGroups.number));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch the budget"));
  }
};

export const getRevenueGroupOptions = async (): Promise<RevenueGroupOption[]> =>
  db
    .select({
      uuid: RevenueGroups.uuid,
      number: RevenueGroups.number,
      name: RevenueGroups.name,
    })
    .from(RevenueGroups)
    .orderBy(asc(RevenueGroups.number));

/**
 * Set one group's budget for one month. Saving a month that already has a
 * budget replaces it — there is one budget per group per month.
 */
export const saveRevenueBudget = async (
  _prevState: RevenueBudgetActionResult,
  values: RevenueBudgetFormValues,
): Promise<RevenueBudgetActionResult> => {
  await requireAuth();
  const parsed = revenueBudgetSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid budget" };
  }
  const data = parsed.data;

  const figures = {
    revenueStock: moneyString(data.revenueStock),
    revenueCrossDock: moneyString(data.revenueCrossDock),
    revenueFactory: moneyString(data.revenueFactory),
    weightStock: data.weightStock.toFixed(2),
    weightCrossDock: data.weightCrossDock.toFixed(2),
    weightFactory: data.weightFactory.toFixed(2),
    profitPercentageStock: data.profitPercentageStock.toFixed(2),
    profitPercentageCrossDock: data.profitPercentageCrossDock.toFixed(2),
    profitPercentageFactory: data.profitPercentageFactory.toFixed(2),
  };

  try {
    await db
      .insert(RevenueBudgets)
      .values({
        uuid: generateUuid(),
        revenueGroupUuid: data.revenueGroupUuid,
        year: data.year,
        month: data.month,
        ...figures,
      })
      .onDuplicateKeyUpdate({ set: figures });
  } catch (error) {
    return { error: describeError(error, "Failed to save the budget") };
  }

  revalidatePath("/revenue-budgets");
  revalidatePath("/revenue-vs-budget");
  return { success: true };
};

export const deleteRevenueBudget = async (
  uuid: string,
): Promise<RevenueBudgetActionResult> => {
  await requireAuth();
  try {
    await db.delete(RevenueBudgets).where(eq(RevenueBudgets.uuid, uuid));
  } catch (error) {
    return { error: describeError(error, "Failed to delete the budget") };
  }

  revalidatePath("/revenue-budgets");
  revalidatePath("/revenue-vs-budget");
  return { success: true };
};
