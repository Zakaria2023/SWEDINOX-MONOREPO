"use server";

import { db } from "@/db";
import {
  CountListDeviations,
  SelectCountListDeviations,
} from "@/db/schema/count-list-deviations";
import { Products, SelectProducts } from "@/db/schema/products";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type CountListDeviationListItem = SelectCountListDeviations & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  length: SelectProducts["length"] | null;
};

const selection = {
  ...getTableColumns(CountListDeviations),
  productCode: Products.productCode,
  productName: Products.name,
  length: Products.length,
};

export const getCountListDeviations = async (): Promise<
  CountListDeviationListItem[]
> => {
  try {
    return await db
      .select(selection)
      .from(CountListDeviations)
      .leftJoin(Products, eq(CountListDeviations.productUuid, Products.uuid))
      .orderBy(desc(CountListDeviations.workOrderDate));
  } catch {
    throw new Error("Failed to fetch count-list deviations");
  }
};

export type CountListDeviationDetail = CountListDeviationListItem;

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
