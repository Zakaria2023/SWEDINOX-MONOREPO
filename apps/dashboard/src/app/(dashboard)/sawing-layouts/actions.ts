"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import { SawingLayouts, SelectSawingLayouts } from "@/db/schema/sawing-layouts";
import { asc, desc, eq } from "drizzle-orm";

export type SawingLayoutListItem = SelectSawingLayouts;

/** One qty/length pair from the layout's ten fixed piece slots. */
export type SawingLayoutCut = {
  slot: number;
  qty: number | null;
  length: string | null;
};

export type SawingLayoutDetail = SelectSawingLayouts & {
  /** The slots that actually carry a cut, in slot order. */
  cuts: SawingLayoutCut[];
  /** Total pieces across the filled slots. */
  totalPieces: number;
  /** Total length consumed by the cuts. */
  totalCutLength: number;
};

export const getSawingLayouts = async (): Promise<SawingLayoutListItem[]> => {
  try {
    return await db
      .select()
      .from(SawingLayouts)
      .orderBy(desc(SawingLayouts.sawingDate), asc(SawingLayouts.machine));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch sawing layouts"));
  }
};

/**
 * One cutting plan with its ten piece slots read back as a list.
 *
 * The slots are ten fixed column pairs on the row rather than a child table, so
 * they are collected here into the list the screen actually wants. A slot with
 * neither a quantity nor a length is an unused slot, not a zero-piece cut, and is
 * left out.
 */
export const getSawingLayoutDetail = async (
  uuid: string,
): Promise<SawingLayoutDetail | null> => {
  const [row] = await db
    .select()
    .from(SawingLayouts)
    .where(eq(SawingLayouts.uuid, uuid))
    .limit(1);

  if (!row) {
    return null;
  }

  const slots: Array<{ qty: number | null; length: string | null }> = [
    { qty: row.qty1, length: row.length1 },
    { qty: row.qty2, length: row.length2 },
    { qty: row.qty3, length: row.length3 },
    { qty: row.qty4, length: row.length4 },
    { qty: row.qty5, length: row.length5 },
    { qty: row.qty6, length: row.length6 },
    { qty: row.qty7, length: row.length7 },
    { qty: row.qty8, length: row.length8 },
    { qty: row.qty9, length: row.length9 },
    { qty: row.qty10, length: row.length10 },
  ];

  const cuts = slots
    .map((slot, index) => ({ slot: index + 1, ...slot }))
    .filter((cut) => cut.qty !== null || cut.length !== null);

  return {
    ...row,
    cuts,
    totalPieces: cuts.reduce((sum, cut) => sum + (cut.qty ?? 0), 0),
    totalCutLength: cuts.reduce(
      (sum, cut) => sum + (cut.qty ?? 0) * Number(cut.length ?? 0),
      0,
    ),
  };
};
