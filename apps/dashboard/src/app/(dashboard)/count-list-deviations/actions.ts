"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import {
  CountListDeviations,
  SelectCountListDeviations,
} from "@/db/schema/count-list-deviations";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  dateRangeFilter,
  runPaged,
  tableWhere,
} from "@/lib/server/table-query";
import { Paged, TableQuery } from "@/lib/table-query";
import { count, desc, eq, getTableColumns } from "drizzle-orm";

const DEVIATION_SEARCH = [
  Products.productCode,
  Products.name,
  CountListDeviations.workOrderNumber,
  CountListDeviations.location,
] as const;

const DEVIATION_FILTERS = {
  workOrderDate: dateRangeFilter(CountListDeviations.workOrderDate),
  reportedAt: dateRangeFilter(CountListDeviations.dateReportedAsCompleted),
};

export type CountListDeviationListItem = SelectCountListDeviations & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  length: SelectProducts["length"] | null;
};

export type CountListDeviationDetail = CountListDeviationListItem;

const selection = {
  ...getTableColumns(CountListDeviations),
  productCode: Products.productCode,
  productName: Products.name,
  length: Products.length,
};

export const getCountListDeviations = async (
  query: TableQuery,
): Promise<Paged<CountListDeviationListItem>> => {
  try {
    const where = tableWhere({
      query,
      search: DEVIATION_SEARCH,
      filters: DEVIATION_FILTERS,
    });
    return await runPaged(query, {
      rows: (limit, offset) =>
        db
          .select(selection)
          .from(CountListDeviations)
          .leftJoin(Products, eq(CountListDeviations.productUuid, Products.uuid))
          .where(where)
          .orderBy(
            desc(CountListDeviations.workOrderDate),
            desc(CountListDeviations.id),
          )
          .limit(limit)
          .offset(offset),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(CountListDeviations)
          .leftJoin(Products, eq(CountListDeviations.productUuid, Products.uuid))
          .where(where);
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch count-list deviations"));
  }
};

export const getCountListDeviationDetail = async (
  uuid: string,
): Promise<CountListDeviationDetail | null> => {
  const [deviation] = await db
    .select(selection)
    .from(CountListDeviations)
    .leftJoin(Products, eq(CountListDeviations.productUuid, Products.uuid))
    .where(eq(CountListDeviations.uuid, uuid))
    .limit(1);

  return deviation ?? null;
};
