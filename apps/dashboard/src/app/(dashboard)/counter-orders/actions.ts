"use server";

import {
  Companies,
  CompanyAddresses,
  Contracts,
  CounterOrders,
  CounterOrderSurcharges,
  db,
  InsertCounterOrders,
  InsertCounterOrderSurcharges,
  InsertTexts,
  SelectCompanies,
  SelectCompanyAddresses,
  SelectContracts,
  SelectCounterOrders,
  Texts,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { and, asc, desc, eq, getTableColumns, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";

export type CounterOrderInput = Omit<
  InsertCounterOrders,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type CounterOrderSurchargeInput = Omit<
  InsertCounterOrderSurcharges,
  "id" | "uuid" | "counterOrderUuid" | "createdAt" | "updatedAt"
>;

export type CounterOrderTextInput = Pick<
  InsertTexts,
  "title" | "textBlock" | "textCategoryUuid"
>;

export type CounterOrderExtras = {
  surcharges: CounterOrderSurchargeInput[];
  texts: CounterOrderTextInput[];
  contractUuids: string[];
};

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

export type ContractOption = Pick<
  SelectContracts,
  "uuid" | "code" | "description" | "contractType"
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

export const getContractsByCompanyUuid = async (
  companyUuid: string,
): Promise<ContractOption[]> =>
  db
    .select({
      uuid: Contracts.uuid,
      code: Contracts.code,
      description: Contracts.description,
      contractType: Contracts.contractType,
    })
    .from(Contracts)
    .where(
      and(
        eq(Contracts.companyUuid, companyUuid),
        inArray(Contracts.role, ["customer", "prospect"]),
      ),
    )
    .orderBy(asc(Contracts.code));

export const createCounterOrder = async (
  input: CounterOrderInput,
  extras: CounterOrderExtras,
): Promise<CounterOrderActionResult> => {
  const uuid = generateUuid();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(CounterOrders).values({ ...input, uuid });

      if (extras.surcharges.length > 0) {
        await tx.insert(CounterOrderSurcharges).values(
          extras.surcharges.map((surcharge) => ({
            ...surcharge,
            uuid: generateUuid(),
            counterOrderUuid: uuid,
          })),
        );
      }

      if (extras.texts.length > 0) {
        await tx.insert(Texts).values(
          extras.texts.map((text) => ({
            uuid: generateUuid(),
            counterOrderUuid: uuid,
            companyUuid: input.companyUuid,
            title: text.title,
            textBlock: text.textBlock,
            textCategoryUuid: text.textCategoryUuid ?? null,
          })),
        );
      }

      if (extras.contractUuids.length > 0) {
        await tx
          .update(Contracts)
          .set({ counterOrderUuid: uuid })
          .where(inArray(Contracts.uuid, extras.contractUuids));
      }
    });
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
