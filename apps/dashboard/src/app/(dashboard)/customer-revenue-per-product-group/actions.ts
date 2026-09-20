"use server";

import { CUSTOMER_REVENUE_PER_PRODUCT_GROUP_COLUMNS } from "@/app/(dashboard)/customer-revenue-per-product-group/columns";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import { Products } from "@/db/schema/products";
import {
  customerGroups,
  orderSourceTypes,
  salesRepresentatives,
} from "@/lib/enums";
import { describeError, profitMarginPercent } from "@/lib/helpers";
import { getRevenueCompanies } from "@/lib/server/customer-revenue";
import { exportRows } from "@/lib/server/excel";
import {
  dateRangeFilter,
  enumFilter,
  FilterBindings,
  runPaged,
  SortableColumns,
  tableOrderBy,
  tableWhere,
  valueFilter,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { and, count, eq, isNotNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

export type CustomerRevenuePerProductGroupRow = {
  representative: SelectCompanies["representative"] | null;
  customerGroup: SelectCompanies["customerGroup"] | null;
  transportRegion: string | null;
  debtorNumber: SelectCompanies["debtorNumber"] | null;
  customerName: SelectCompanies["companyName"] | null;
  city: SelectCompanyAddresses["city"] | null;
  region: SelectCompanies["region"] | null;
  productGroupName: SelectProductGroups["name"] | null;
  subgroup1Name: SelectProductGroups["name"] | null;
  subgroup2Name: SelectProductGroups["name"] | null;
  year: number;
  month: number;
  invoiceDate: Date | null;
  sourceType: SelectOrderItems["sourceType"];
  option1: string | null;
  option2: string | null;
  salesPriceUnit: number;
  priceUnit: string | null;
  weightKg: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  invoiceLines: number;
};

const parentGroup = alias(ProductGroups, "parent_group");
const grandparentGroup = alias(ProductGroups, "grandparent_group");

// A cancelled invoice is not revenue, and a line with no company cannot be
// reported against one.
const INVOICED = and(
  eq(Invoices.cancelled, false),
  isNotNull(Invoices.companyUuid),
);

// A line carries its options as one string. The reference gives them two
// columns, filled in the order they were added -- `Slijpen` + `Laser Folie`
// being the commonest pair -- so the string is split at the first comma.
const OPTION_1 = sql<
  string | null
>`NULLIF(TRIM(SUBSTRING_INDEX(COALESCE(${OrderItems.options}, ''), ',', 1)), '')`;

const OPTION_2 = sql<string | null>`NULLIF(TRIM(CASE
  WHEN ${OrderItems.options} LIKE '%,%'
  THEN SUBSTRING_INDEX(SUBSTRING_INDEX(${OrderItems.options}, ',', 2), ',', -1)
  ELSE ''
END), '')`;

const CUSTOMER_REVENUE_PRODUCT_GROUP_SEARCH = [
  Companies.companyName,
  ProductGroups.name,
] as const;

const CUSTOMER_REVENUE_PRODUCT_GROUP_FILTERS: FilterBindings = {
  representative: enumFilter(Companies.representative, salesRepresentatives),
  customerGroup: enumFilter(Companies.customerGroup, customerGroups),
  region: valueFilter(Companies.region),
  transportRegion: valueFilter(Orders.transportRegion),
  orderType: enumFilter(OrderItems.sourceType, orderSourceTypes),
  invoiceDate: dateRangeFilter(Invoices.invoiceDate),
};

const CUSTOMER_REVENUE_PRODUCT_GROUP_SORTABLE: SortableColumns = {
  customerName: Companies.companyName,
  invoiceDate: Invoices.invoiceDate,
  productGroup: ProductGroups.name,
};

/**
 * The product half of invoiced revenue, at the reference's own grain.
 *
 * Options and charges are not in it: C9 totals exactly the invoice lines'
 * `Revenue products` (9 032 601.62 across the reference's window) and their
 * product profit. The option half and the charges are what C10 splits out.
 *
 * The grain is customer x product group x subgroups x **invoice date** x order
 * type x option 1 x option 2 x price unit -- unique on all 2 241 of the
 * reference's rows. It is per day, not per month; the year and month columns
 * are printed beside the date rather than instead of it.
 *
 * The group is shown three levels deep, top first -- `Roestvast staal` /
 * `RVS platen` / `Plaat Koudgewalst 304` -- walked up from the product's own
 * group, since a product may sit at any of the three levels.
 */
const productGroupRevenueRows =
  (query: TableQuery) =>
  async (
    limit: number,
    offset: number,
  ): Promise<CustomerRevenuePerProductGroupRow[]> => {
    const rows = await db
      .select({
        companyUuid: Invoices.companyUuid,
        ownGroup: ProductGroups.name,
        parentGroup: parentGroup.name,
        grandparentGroup: grandparentGroup.name,
        transportRegion: Orders.transportRegion,
        sourceType: OrderItems.sourceType,
        option1: OPTION_1,
        option2: OPTION_2,
        priceUnit: InvoiceItems.priceUnit,
        invoiceDate: Invoices.invoiceDate,
        year: sql<number>`YEAR(${Invoices.invoiceDate})`,
        month: sql<number>`MONTH(${Invoices.invoiceDate})`,
        weightKg: sql<string>`COALESCE(SUM(${InvoiceItems.weightKg}), 0)`,
        quantity: sql<string>`COALESCE(SUM(${InvoiceItems.quantity}), 0)`,
        revenue: sql<string>`COALESCE(SUM(${InvoiceItems.revenueProducts}), 0)`,
        profit: sql<string>`COALESCE(SUM(${InvoiceItems.profitProducts}), 0)`,
        invoiceLines: count(InvoiceItems.uuid),
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .innerJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
      .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
      .innerJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
      .leftJoin(
        ProductGroups,
        eq(Products.productGroupUuid, ProductGroups.uuid),
      )
      .leftJoin(parentGroup, eq(ProductGroups.parentUuid, parentGroup.uuid))
      .leftJoin(
        grandparentGroup,
        eq(parentGroup.parentUuid, grandparentGroup.uuid),
      )
      .where(
        tableWhere({
          query,
          search: CUSTOMER_REVENUE_PRODUCT_GROUP_SEARCH,
          filters: CUSTOMER_REVENUE_PRODUCT_GROUP_FILTERS,
          scope: [INVOICED],
        }),
      )
      .groupBy(
        Invoices.companyUuid,
        ProductGroups.uuid,
        ProductGroups.name,
        parentGroup.name,
        grandparentGroup.name,
        Orders.transportRegion,
        OrderItems.sourceType,
        OPTION_1,
        OPTION_2,
        InvoiceItems.priceUnit,
        Invoices.invoiceDate,
      )
      .orderBy(
        ...tableOrderBy(
          CUSTOMER_REVENUE_PRODUCT_GROUP_SORTABLE,
          query,
          [sql`${Invoices.invoiceDate} desc`],
          Invoices.companyUuid,
        ),
      )
      .limit(limit)
      .offset(offset);

    if (rows.length === 0) {
      return [];
    }

    const companies = await getRevenueCompanies(
      rows
        .map((row) => row.companyUuid)
        .filter((uuid): uuid is string => uuid !== null),
    );

    return rows.map((row): CustomerRevenuePerProductGroupRow => {
      const company = companies.get(row.companyUuid ?? "");
      // Top level first, whatever depth the product's own group sits at.
      const [
        productGroupName = null,
        subgroup1Name = null,
        subgroup2Name = null,
      ] = [row.grandparentGroup, row.parentGroup, row.ownGroup].filter(
        (name): name is string => name !== null,
      );
      const revenue = Number(row.revenue);
      const profit = Number(row.profit);
      const weightKg = Number(row.weightKg);
      const priceUnit = row.priceUnit;

      return {
        representative: company?.representative ?? null,
        customerGroup: company?.customerGroup ?? null,
        transportRegion: row.transportRegion ?? null,
        debtorNumber: company?.debtorNumber ?? null,
        customerName: company?.companyName ?? null,
        city: company?.city ?? null,
        region: company?.region ?? null,
        productGroupName,
        subgroup1Name,
        subgroup2Name,
        year: Number(row.year),
        month: Number(row.month),
        invoiceDate: row.invoiceDate,
        sourceType: row.sourceType,
        option1: row.option1,
        option2: row.option2,
        // Sold quantity restated in the unit the line was priced in: tonnes
        // are kilos over a thousand, kilos are the weight itself, and anything
        // else -- pieces, metres -- is the quantity as invoiced.
        salesPriceUnit:
          priceUnit === "TN"
            ? weightKg / 1000
            : priceUnit === "KG"
              ? weightKg
              : Number(row.quantity),
        priceUnit,
        weightKg,
        revenue,
        profit,
        profitMargin: profitMarginPercent(revenue, profit),
        invoiceLines: Number(row.invoiceLines),
      };
    });
  };

export const getCustomerRevenuePerProductGroup = async (
  query: TableQuery,
): Promise<Paged<CustomerRevenuePerProductGroupRow>> => {
  try {
    return await runPaged(query, {
      rows: productGroupRevenueRows(query),
      count: async () => {
        // One row per group, so the count is how many groups there are.
        const grouped = db
          .select({ companyUuid: Invoices.companyUuid })
          .from(InvoiceItems)
          .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
          .innerJoin(
            OrderItems,
            eq(InvoiceItems.orderItemUuid, OrderItems.uuid),
          )
          .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
          .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
          .innerJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
          .leftJoin(
            ProductGroups,
            eq(Products.productGroupUuid, ProductGroups.uuid),
          )
          .where(
            tableWhere({
              query,
              search: CUSTOMER_REVENUE_PRODUCT_GROUP_SEARCH,
              filters: CUSTOMER_REVENUE_PRODUCT_GROUP_FILTERS,
              scope: [INVOICED],
            }),
          )
          .groupBy(
            Invoices.companyUuid,
            ProductGroups.uuid,
            Orders.transportRegion,
            OrderItems.sourceType,
            OPTION_1,
            OPTION_2,
            InvoiceItems.priceUnit,
            Invoices.invoiceDate,
          )
          .as("grouped");

        const [row] = await db.select({ value: count() }).from(grouped);
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(
      describeError(
        error,
        "Failed to fetch customer revenue per product group",
      ),
    );
  }
};

export const exportCustomerRevenuePerProductGroup = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Customer revenue per product group",
    columns: CUSTOMER_REVENUE_PER_PRODUCT_GROUP_COLUMNS,
    columnKeys,
    rows: productGroupRevenueRows(parseTableQuery(params)),
  });

/** The transport regions invoiced lines were shipped to, for the filter. */
export const getRevenueTransportRegions = async (): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ transportRegion: Orders.transportRegion })
    .from(Orders)
    .where(isNotNull(Orders.transportRegion))
    .orderBy(Orders.transportRegion);

  return rows
    .map((row) => row.transportRegion)
    .filter((region): region is string => region !== null && region !== "");
};
