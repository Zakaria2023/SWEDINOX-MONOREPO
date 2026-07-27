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
