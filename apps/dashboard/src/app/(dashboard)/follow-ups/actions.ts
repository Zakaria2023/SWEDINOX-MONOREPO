"use server";

import { describeError } from "@/lib/helpers";
import {
  db,
  Companies,
  FollowUps,
  SelectCompanies,
  SelectFollowUps,
} from "@/db";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type FollowUpListItem = SelectFollowUps & {
  companyName: SelectCompanies["companyName"] | null;
};

export type FollowUpDetail = FollowUpListItem & {
  companyId: SelectCompanies["id"] | null;
};

export const getFollowUps = async (): Promise<FollowUpListItem[]> => {
  try {
    return await db
      .select({
        ...getTableColumns(FollowUps),
        companyName: Companies.companyName,
      })
      .from(FollowUps)
      .leftJoin(Companies, eq(FollowUps.companyUuid, Companies.uuid))
      .orderBy(desc(FollowUps.createdAt));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch follow-ups"));
  }
};

/** One follow-up with the company it was logged against. */
export const getFollowUpDetail = async (
  uuid: string,
): Promise<FollowUpDetail | null> => {
  const [row] = await db
    .select({
      ...getTableColumns(FollowUps),
      companyName: Companies.companyName,
      companyId: Companies.id,
    })
    .from(FollowUps)
    .leftJoin(Companies, eq(FollowUps.companyUuid, Companies.uuid))
    .where(eq(FollowUps.uuid, uuid))
    .limit(1);

  return row ?? null;
};
