"use server";

import {
  Companies,
  CompanyAddresses,
  CounterOrders,
  db,
  InsertCounterOrders,
  SelectCompanies,
  SelectCompanyAddresses,
  SelectCounterOrders,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { asc, desc, eq, getTableColumns } from "drizzle-orm";
import { redirect } from "next/navigation";

export type CounterOrderInput = Omit<
  InsertCounterOrders,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type CounterOrderActionResult = {
  error?: string;
};

export type CounterOrderListItem = SelectCounterOrders & {
  companyName: Pick<SelectCompanies, "companyName">["companyName"];
};

export type AddressOption = Pick<
  SelectCompanyAddresses,
  "uuid" | "streetAndNo" | "city" | "postalCode"
>;

export const getCounterOrders = async (): Promise<CounterOrderListItem[]> =>
  db
    .select({
      ...getTableColumns(CounterOrders),
      companyName: Companies.companyName,
    })
    .from(CounterOrders)
    .innerJoin(Companies, eq(Companies.uuid, CounterOrders.companyUuid))
    .orderBy(desc(CounterOrders.createdAt));

export const getAddressesByCompanyUuid = async (
  companyUuid: string,
): Promise<AddressOption[]> =>
  db
    .select({
      uuid: CompanyAddresses.uuid,
      streetAndNo: CompanyAddresses.streetAndNo,
      city: CompanyAddresses.city,
      postalCode: CompanyAddresses.postalCode,
    })
    .from(CompanyAddresses)
    .where(eq(CompanyAddresses.companyUuid, companyUuid))
    .orderBy(asc(CompanyAddresses.city));

export const createCounterOrder = async (
  input: CounterOrderInput,
): Promise<CounterOrderActionResult> => {
  const uuid = generateUuid();

  try {
    await db.insert(CounterOrders).values({ ...input, uuid });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create counter order",
    };
  }

  redirect("/counter-orders");
};
