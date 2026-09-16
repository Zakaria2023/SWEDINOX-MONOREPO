"use server";
import { describeError, personInitials } from "@/lib/helpers";

import { db } from "@/db";
import {
  PurchaseOrderItems,
  SelectPurchaseOrderItems,
} from "@/db/schema/purchase-order-items";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import { Products, SelectProducts } from "@/db/schema/products";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { alias } from "drizzle-orm/mysql-core";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  isNull,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import {
  dateRangeFilter,
  numberRangeFilter,
  relationFilter,
  tableOrderBy,
  tablePage,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { exportRows } from "@/lib/server/excel";
import { PURCHASE_LINE_COLUMNS } from "@/app/(dashboard)/purchase-lines/columns";

export type PurchaseLineItem = Omit<SelectPurchaseOrderItems, "amount"> & {
  /** Net price x weight, in the price's own unit — derived, never stale. */
  amount: number;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  orderDate: SelectPurchaseOrders["orderDate"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  /** Weight actually booked in against the line, summed over its receivals. */
  kgActual: number;
  /** Ordered weight less what has arrived. */
  kgStillToReceive: number;
  /** That outstanding weight at the line's own price. */
  amountYetToBeReceived: number;
  /** Still inbound and not yet promised to anyone, in the purchase unit. */
  availableQty: number;
  /** The same, in kilograms. */
  availableKg: number;
  /** Still owed in pieces, and the reserved share of the line's weight. */
  qtyStillToReceive: number;
  reservedKg: number;
  /** Gross less net, per unit of the price; null with no gross price. */
  margin: number | null;

  // ── The context the reference prints beside every line ──────────────────
  /** The supplier's own code, and the country it ships from. */
  companyCode: SelectCompanies["searchCode1"] | null;
  country: string | null;
  /** The buyer's initials, beside the name. */
  purchaserInitials: string | null;
  /** What kind of buying this is: materials, processing, customer materials. */
  orderType: SelectPurchaseOrders["purchaseOrderType"];
  /** Stock or cross-docked straight through to a customer. */
  lineType: string;
  /** The root of the product hierarchy, and the group the product sits in. */
  mainGroup: SelectProductGroups["name"] | null;
  subgroup: SelectProductGroups["name"] | null;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  /** The two references the order carries, and the order's own deadline. */
  purchaseReference: SelectPurchaseOrders["reference"] | null;
  ourReference: SelectPurchaseOrders["ourReference"] | null;
  deadline: SelectPurchaseOrders["deliveryDate"] | null;
  /** The construction-products pair: the standard and its declaration. */
  ceStandard: SelectProducts["ce"] | null;
  dop: SelectProducts["classificationPerformance"] | null;
};

export type PurchaseLineDetail = PurchaseLineItem & {
  supplierUuid: SelectCompanies["uuid"] | null;
  purchaseOrderStatus: SelectPurchaseOrders["status"] | null;
  purchaseOrderReference: SelectPurchaseOrders["reference"] | null;
};

// What is still coming, and what it is worth.
//
// Weight received is the line's weight for the quantity that has arrived. Every
// receipt — a receival, an unloading, a purchase invoice — raises the line's
// received quantity and weighs the lot it makes by that same share, so the
// quantity is the one figure all three keep up to date.
//
// "Available" on a purchase line means still inbound and unpromised — a
// different thing from a warehouse lot's available, which is quantity less
// reserved. Both exist; conflating them double-counts.
// "Main group" is the root of the product hierarchy and "Subgroup" the group
// the product sits in directly — the same two levels Sold products shows side
// by side, and the same three-hop climb Order advice uses to find the root.
const Parent = alias(ProductGroups, "group_parent");
const Grandparent = alias(ProductGroups, "group_grandparent");
const Root = alias(ProductGroups, "group_root");

const kgActualSql = sql<number>`(
  CASE WHEN COALESCE(${PurchaseOrderItems.qtyPlanned}, 0) > 0
    THEN COALESCE(${PurchaseOrderItems.kgPurchased}, 0)
       * COALESCE(${PurchaseOrderItems.qtyReceived}, 0)
       / ${PurchaseOrderItems.qtyPlanned}
    ELSE 0
  END
)`;

// Reserved is held in purchase units, so its weight is that share of the
// line's weight.
const reservedKgSql = sql<number>`(
  CASE WHEN COALESCE(${PurchaseOrderItems.qtyPlanned}, 0) > 0
    THEN COALESCE(${PurchaseOrderItems.kgPurchased}, 0)
       * COALESCE(${PurchaseOrderItems.reservedQty}, 0)
       / ${PurchaseOrderItems.qtyPlanned}
    ELSE 0
  END
)`;

const purchaseLineDerived = {
  // Derived rather than read from the stored column, exactly as the reference
  // does it. A stored amount goes stale the moment a line is re-priced or its
  // weight corrected, and nothing recomputes it.
  amount: sql<number>`
    COALESCE(${PurchaseOrderItems.netPrice}, 0) *
    CASE WHEN UPPER(COALESCE(${PurchaseOrderItems.priceUnit}, 'TN')) = 'KG'
      THEN COALESCE(${PurchaseOrderItems.kgPurchased}, 0)
      ELSE COALESCE(${PurchaseOrderItems.kgPurchased}, 0) / 1000
    END`.mapWith(Number),
  kgActual: sql<number>`${kgActualSql}`.mapWith(Number),
  kgStillToReceive:
    sql<number>`GREATEST(0, COALESCE(${PurchaseOrderItems.kgPurchased}, 0) - ${kgActualSql})`.mapWith(
      Number,
    ),
  amountYetToBeReceived: sql<number>`
    COALESCE(${PurchaseOrderItems.netPrice}, 0) *
    CASE WHEN UPPER(COALESCE(${PurchaseOrderItems.priceUnit}, 'TN')) = 'KG'
      THEN GREATEST(0, COALESCE(${PurchaseOrderItems.kgPurchased}, 0) - ${kgActualSql})
      ELSE GREATEST(0, COALESCE(${PurchaseOrderItems.kgPurchased}, 0) - ${kgActualSql}) / 1000
    END`.mapWith(Number),
  availableQty: sql<number>`GREATEST(0,
    COALESCE(${PurchaseOrderItems.qtyPlanned}, 0)
    - COALESCE(${PurchaseOrderItems.qtyReceived}, 0)
    - COALESCE(${PurchaseOrderItems.reservedQty}, 0))`.mapWith(Number),
  availableKg:
    sql<number>`GREATEST(0, COALESCE(${PurchaseOrderItems.kgPurchased}, 0) - ${kgActualSql} - ${reservedKgSql})`.mapWith(
      Number,
    ),
  // What the line is still owed, in pieces — the quantity twin of "Kg. still
  // to be received".
  qtyStillToReceive: sql<number>`GREATEST(0,
    COALESCE(${PurchaseOrderItems.quantity}, 0)
    - COALESCE(${PurchaseOrderItems.qtyReceived}, 0))`.mapWith(Number),
  reservedKg: sql<number>`${reservedKgSql}`.mapWith(Number),
  // What the discount off the list price is worth, per unit of the price. The
  // reference calls this the margin; it is the gap between what the supplier
  // asks and what we agreed. Without a gross price there is no gap to measure —
  // subtracting the net price from nothing reads as a loss of the whole price.
  margin: sql<number | null>`CASE
    WHEN COALESCE(${PurchaseOrderItems.grossPrice}, 0) = 0 THEN NULL
    ELSE ${PurchaseOrderItems.grossPrice} - COALESCE(${PurchaseOrderItems.netPrice}, 0)
  END`.mapWith((value) => (value === null ? null : Number(value))),
};

// The context columns the reference prints beside a line: whose order it is on,
// what kind of buying it is, where the product sits in the hierarchy, and the
// references and standards that travel with it. Declared once so the overview
// and the detail read the same fields from the same joins.
const purchaseLineContext = {
  companyCode: Companies.searchCode1,
  // The supplier's country lives on its address rather than on the company, so
  // it is read from the first address the supplier has.
  country: sql<string | null>`(
    SELECT ${CompanyAddresses.country} FROM ${CompanyAddresses}
    WHERE ${CompanyAddresses.companyUuid} = ${Companies.uuid}
      AND ${CompanyAddresses.country} IS NOT NULL
    ORDER BY ${CompanyAddresses.id} LIMIT 1
  )`,
  orderType: PurchaseOrders.purchaseOrderType,
  // Cross-docking is agreed on the order: goods that never touch our shelves go
  // straight through, which is what "CD" means here.
  lineType: sql<string>`CASE WHEN ${PurchaseOrders.pickupDropoffCdPurchases} = 1 THEN 'CD' ELSE 'Stk' END`,
  mainGroup: sql<
    SelectProductGroups["name"] | null
  >`COALESCE(${Root.name}, ${Grandparent.name}, ${Parent.name}, ${ProductGroups.name})`,
  subgroup: ProductGroups.name,
  revenueGroupNumber: RevenueGroups.number,
  revenueGroupName: RevenueGroups.name,
  purchaseReference: PurchaseOrders.reference,
  ourReference: PurchaseOrders.ourReference,
  deadline: PurchaseOrders.deliveryDate,
  ceStandard: Products.ce,
  dop: Products.classificationPerformance,
};

const PURCHASE_LINE_SEARCH = [
  Products.productCode,
  Products.name,
  Companies.companyName,
] as const;

const PURCHASE_LINE_SORTABLE = {
  createdAt: PurchaseOrderItems.createdAt,
  orderDate: PurchaseOrders.orderDate,
  supplier: Companies.companyName,
  productCode: Products.productCode,
  quantity: PurchaseOrderItems.quantity,
};

// Whose order it was on, who bought it, which article, and when it was placed.
const PURCHASE_LINE_FILTERS = {
  supplier: relationFilter(PurchaseOrders.supplierUuid),
  purchaser: relationFilter(PurchaseOrders.purchaser),
  product: relationFilter(PurchaseOrderItems.productUuid),
  orderDate: dateRangeFilter(PurchaseOrders.orderDate),
  quantity: numberRangeFilter(PurchaseOrderItems.quantity),
  // The reference's "Only current purchasing lines": still to arrive or to be
  // invoiced, on an order that has been neither completed nor called off.
  lines: (values: string[]) =>
    values[0] === "current"
      ? and(
          or(
            isNull(PurchaseOrderItems.status),
            notInArray(PurchaseOrderItems.status, [
              "received",
              "invoiced",
              "cancelled",
            ]),
          ),
          notInArray(PurchaseOrders.status, ["completed", "cancelled"]),
        )
      : undefined,
};

/**
 * The rows one view of the purchase lines overview selects, as a window onto
 * them.
 *
 * Shared by the page and the export, including the buyer's name: that is
 * resolved here from Clerk rather than in SQL, so a second copy of this query
 * would be a second answer to who bought a line.
 */
const purchaseLineRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<PurchaseLineItem[]> => {
    const rows = await db
      .select({
        ...getTableColumns(PurchaseOrderItems),
        ...purchaseLineDerived,
        purchaseOrderId: PurchaseOrders.id,
        orderDate: PurchaseOrders.orderDate,
        supplierName: Companies.companyName,
        productCode: Products.productCode,
        productName: Products.name,
        // The buyer is recorded on the order header as a Clerk user id.
        orderPurchaserId: PurchaseOrders.purchaser,

        ...purchaseLineContext,
      })
      .from(PurchaseOrderItems)
      .leftJoin(
        PurchaseOrders,
        eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
      .leftJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
      .leftJoin(ProductGroups, eq(Products.productGroupUuid, ProductGroups.uuid))
      .leftJoin(Parent, eq(ProductGroups.parentUuid, Parent.uuid))
      .leftJoin(Grandparent, eq(Parent.parentUuid, Grandparent.uuid))
      .leftJoin(Root, eq(Grandparent.parentUuid, Root.uuid))
      .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
      .where(
        tableWhere({
          query,
          search: PURCHASE_LINE_SEARCH,
          filters: PURCHASE_LINE_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          PURCHASE_LINE_SORTABLE,
          query,
          [desc(PurchaseOrderItems.createdAt)],
          PurchaseOrderItems.id,
        ),
      )
      .limit(limit)
      .offset(offset);

    // Resolve the buyer's Clerk id to a display name. Fall back to a
    // line-level purchaser if one was set, then to the raw id.
    const users = await getClerkUsersForSelect();
    const nameById = new Map(users.map((user) => [user.value, user.label]));

    return rows.map(({ orderPurchaserId, ...row }) => {
      const purchaser =
        row.purchaser ??
        (orderPurchaserId
          ? (nameById.get(orderPurchaserId) ?? orderPurchaserId)
          : null);
      return { ...row, purchaser, purchaserInitials: personInitials(purchaser) };
    });
  };

/** Every purchase line the current view matches, as a workbook. */
export const exportPurchaseLines = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Purchase Lines",
    columns: PURCHASE_LINE_COLUMNS,
    columnKeys,
    rows: purchaseLineRows(parseTableQuery(params)),
  });

export const getPurchaseLines = async (
  query: TableQuery,
): Promise<Paged<PurchaseLineItem>> => {
  try {
    const { limit, offset } = tablePage(query);
    const rows = await purchaseLineRows(query)(limit, offset);

    const [totalRow] = await db
      .select({ value: count() })
      .from(PurchaseOrderItems)
      .leftJoin(
        PurchaseOrders,
        eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
      .leftJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
      .where(
        tableWhere({
          query,
          search: PURCHASE_LINE_SEARCH,
          filters: PURCHASE_LINE_FILTERS,
        }),
      );

    return {
      rows,
      total: Number(totalRow?.value ?? 0),
      page: query.page,
      pageSize: query.pageSize,
    };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase lines"));
  }
};

/**
 * One purchase order line with the order, supplier and product behind it. The
 * buyer is resolved from the Clerk user id on the order header the same way the
 * overview resolves it.
 */
export const getPurchaseLineDetail = async (
  uuid: string,
): Promise<PurchaseLineDetail | null> => {
  try {
    const [row] = await db
      .select({
        ...getTableColumns(PurchaseOrderItems),
        ...purchaseLineDerived,
        purchaseOrderId: PurchaseOrders.id,
        purchaseOrderStatus: PurchaseOrders.status,
        purchaseOrderReference: PurchaseOrders.reference,
        orderDate: PurchaseOrders.orderDate,
        supplierName: Companies.companyName,
        supplierUuid: Companies.uuid,
        productCode: Products.productCode,
        productName: Products.name,
        orderPurchaserId: PurchaseOrders.purchaser,
        ...purchaseLineContext,
      })
      .from(PurchaseOrderItems)
      .leftJoin(
        PurchaseOrders,
        eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
      .leftJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
      .leftJoin(ProductGroups, eq(Products.productGroupUuid, ProductGroups.uuid))
      .leftJoin(Parent, eq(ProductGroups.parentUuid, Parent.uuid))
      .leftJoin(Grandparent, eq(Parent.parentUuid, Grandparent.uuid))
      .leftJoin(Root, eq(Grandparent.parentUuid, Root.uuid))
      .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
      .where(eq(PurchaseOrderItems.uuid, uuid))
      .limit(1);

    if (!row) {
      return null;
    }

    const users = await getClerkUsersForSelect();
    const nameById = new Map(users.map((user) => [user.value, user.label]));

    const { orderPurchaserId, ...line } = row;

    const purchaser =
      line.purchaser ??
      (orderPurchaserId
        ? (nameById.get(orderPurchaserId) ?? orderPurchaserId)
        : null);

    return { ...line, purchaser, purchaserInitials: personInitials(purchaser) };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase line"));
  }
};
