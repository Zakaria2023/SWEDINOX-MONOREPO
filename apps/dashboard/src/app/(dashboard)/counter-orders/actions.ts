"use server";

import {
  Companies,
  CompanyAddresses,
  Contracts,
  CounterOrderItems,
  CounterOrders,
  CounterOrderSurcharges,
  Contacts,
  db,
  InsertCounterOrderItems,
  InsertCounterOrders,
  InsertCounterOrderSurcharges,
  InsertTexts,
  Products,
  SelectCompanies,
  SelectCompanyAddresses,
  SelectContacts,
  SelectContracts,
  SelectCounterOrderItems,
  SelectCounterOrders,
  SelectProducts,
  Texts,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
} from "drizzle-orm";
import { redirect } from "next/navigation";
import { counterOrderStatuses } from "@/lib/enums";
import {
  dateRangeFilter,
  enumFilter,
  relationFilter,
  runPaged,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { COUNTER_ORDER_COLUMNS } from "@/app/(dashboard)/counter-orders/columns";
import { exportRows } from "@/lib/server/excel";

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

export type CounterOrderItemInput = Omit<
  InsertCounterOrderItems,
  "id" | "uuid" | "counterOrderUuid" | "createdAt" | "updatedAt"
>;

export type CounterOrderExtras = {
  surcharges: CounterOrderSurchargeInput[];
  texts: CounterOrderTextInput[];
  contractUuids: string[];
  items: CounterOrderItemInput[];
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

export type CounterOrderItemRow = SelectCounterOrderItems & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export type CounterOrderDetail = CounterOrderListItem & {
  companyId: SelectCompanies["id"] | null;
  contactName: SelectContacts["firstName"] | null;
  deliveryAddressCity: SelectCompanyAddresses["city"] | null;
  deliveryAddressStreet: SelectCompanyAddresses["streetAndNo"] | null;
  items: CounterOrderItemRow[];
};

const COUNTER_ORDER_SEARCH = [
  CounterOrders.customerRef,
  CounterOrders.ourReference,
  Companies.companyName,
] as const;

const COUNTER_ORDER_SORTABLE = {
  createdAt: CounterOrders.createdAt,
  orderDate: CounterOrders.orderDate,
  customer: Companies.companyName,
  status: CounterOrders.status,
};

const COUNTER_ORDER_FILTERS = {
  status: enumFilter(CounterOrders.status, counterOrderStatuses),
  company: relationFilter(CounterOrders.companyUuid),
  orderDate: dateRangeFilter(CounterOrders.orderDate),
};

/**
 * The rows one view of the counter orders overview selects, as a window onto
 * them.
 */
const counterOrderRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<CounterOrderListItem[]> =>
    db
      .select({
        ...getTableColumns(CounterOrders),
        companyName: Companies.companyName,
      })
      .from(CounterOrders)
      .innerJoin(Companies, eq(Companies.uuid, CounterOrders.companyUuid))
      .where(
        tableWhere({
          query,
          search: COUNTER_ORDER_SEARCH,
          filters: COUNTER_ORDER_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          COUNTER_ORDER_SORTABLE,
          query,
          [desc(CounterOrders.createdAt)],
          CounterOrders.id,
        ),
      )
      .limit(limit)
      .offset(offset);

/** Every counter order the current view matches, as a workbook. */
export const exportCounterOrders = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Counter Orders",
    columns: COUNTER_ORDER_COLUMNS,
    columnKeys,
    rows: counterOrderRows(parseTableQuery(params)),
  });

export const getCounterOrders = async (
  query: TableQuery,
): Promise<Paged<CounterOrderListItem>> => {
  const where = tableWhere({
    query,
    search: COUNTER_ORDER_SEARCH,
    filters: COUNTER_ORDER_FILTERS,
  });

  return runPaged(query, {
    rows: counterOrderRows(query),

    count: async () => {
      const [row] = await db
        .select({ value: count() })
        .from(CounterOrders)
        .innerJoin(Companies, eq(Companies.uuid, CounterOrders.companyUuid))
        .where(where);
      return Number(row?.value ?? 0);
    },
  });
};

/**
 * One counter order with its customer, contact, delivery address and lines —
 * everything the order records.
 */
export const getCounterOrderDetail = async (
  uuid: string,
): Promise<CounterOrderDetail | null> => {
  const [order] = await db
    .select({
      ...getTableColumns(CounterOrders),
      companyName: Companies.companyName,
      companyId: Companies.id,
      contactName: Contacts.firstName,
      deliveryAddressCity: CompanyAddresses.city,
      deliveryAddressStreet: CompanyAddresses.streetAndNo,
    })
    .from(CounterOrders)
    .innerJoin(Companies, eq(Companies.uuid, CounterOrders.companyUuid))
    .leftJoin(Contacts, eq(Contacts.uuid, CounterOrders.contactUuid))
    .leftJoin(
      CompanyAddresses,
      eq(CompanyAddresses.uuid, CounterOrders.deliveryAddressUuid),
    )
    .where(eq(CounterOrders.uuid, uuid))
    .limit(1);

  if (!order) {
    return null;
  }

  const items = await db
    .select({
      ...getTableColumns(CounterOrderItems),
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(CounterOrderItems)
    .leftJoin(Products, eq(Products.uuid, CounterOrderItems.productUuid))
    .where(eq(CounterOrderItems.counterOrderUuid, uuid))
    .orderBy(asc(CounterOrderItems.lineNumber));

  return { ...order, items };
};

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

      if (extras.items.length > 0) {
        await tx.insert(CounterOrderItems).values(
          extras.items.map((item, index) => ({
            ...item,
            uuid: generateUuid(),
            counterOrderUuid: uuid,
            lineNumber: (index + 1) * 10,
          })),
        );
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
