"use server";

import { PURCHASE_RECEIVAL_COLUMNS } from "@/app/(dashboard)/purchase-receivals/columns";
import { db } from "@/db";
import { Batches, SelectBatches } from "@/db/schema/batches";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  PurchaseLineReceivals,
  SelectPurchaseLineReceivals,
} from "@/db/schema/purchase-line-receivals";
import {
  PurchaseOrderItems,
  SelectPurchaseOrderItems,
} from "@/db/schema/purchase-order-items";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { orderLineStatuses, receiptStatuses } from "@/lib/enums";
import { describeError, generateUuid, personInitials } from "@/lib/helpers";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { exportRows } from "@/lib/server/excel";
import {
  dateRangeFilter,
  enumFilter,
  FilterBindings,
  relationFilter,
  runPaged,
  SortableColumns,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { asc, count, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Only four figures belong to a receival: the weight planned and the weight
// that arrived, the date it arrived, and its own status. Everything else on the
// row — quantities, amounts, options, the purchaser, the line's own status —
// belongs to the purchase line and merely repeats down its receivals.
//
// Proved on a 151-row export: 151 receivals over 107 lines, and those four
// columns are the only ones that differ between the rows of one line. So the
// rest is read from the line here and never from the copies stored on the
// receival: those copies are written once and go stale the moment the line
// moves on, which is why every row of this screen used to claim its line was
// still "In progress".
const lineStatusSql = sql<
  SelectPurchaseOrderItems["status"]
>`COALESCE(${PurchaseOrderItems.status}, ${PurchaseLineReceivals.lineStatus})`;

// The line's weight in the unit its price is struck in: a tonne price divides
// by a thousand, a kilo price does not.
const priceQuantitySql = sql<number>`
  CASE WHEN UPPER(COALESCE(${PurchaseOrderItems.priceUnit}, 'TN')) = 'KG'
    THEN COALESCE(${PurchaseOrderItems.kgPurchased}, 0)
    ELSE COALESCE(${PurchaseOrderItems.kgPurchased}, 0) / 1000
  END`.mapWith(Number);

const lineAmountSql = sql<number>`
  COALESCE(${PurchaseOrderItems.netPrice}, 0) *
  CASE WHEN UPPER(COALESCE(${PurchaseOrderItems.priceUnit}, 'TN')) = 'KG'
    THEN COALESCE(${PurchaseOrderItems.kgPurchased}, 0)
    ELSE COALESCE(${PurchaseOrderItems.kgPurchased}, 0) / 1000
  END`.mapWith(Number);

// The reference prints the actual arrival date once there is one and the
// planned date until then — the two agree on 146 of 151 rows and the five that
// differ are all rows where the goods turned up on a different day.
const receiptDateSql = sql<
  SelectPurchaseLineReceivals["receiptDate"]
>`COALESCE(${PurchaseLineReceivals.deliveryDateActual}, ${PurchaseLineReceivals.deliveryDatePlanned}, ${PurchaseLineReceivals.receiptDate})`;

const PURCHASE_RECEIVAL_SEARCH = [
  PurchaseLineReceivals.purchaseOrderCode,
  Products.productCode,
  Products.name,
  Companies.companyName,
] as const;

const PURCHASE_RECEIVAL_FILTERS: FilterBindings = {
  // The reference filters on the scheduled delivery date rather than the
  // arrival, and that is the whole question the screen asks: what was due in
  // this window, and did it come. A filter on the actual date could only ever
  // find the deliveries that already happened.
  deliveryDatePlanned: dateRangeFilter(
    PurchaseLineReceivals.deliveryDatePlanned,
  ),
  receiptStatus: enumFilter(
    PurchaseLineReceivals.receiptStatus,
    receiptStatuses,
  ),
  lineStatus: enumFilter(PurchaseOrderItems.status, orderLineStatuses),
  supplier: relationFilter(PurchaseLineReceivals.companyUuid),
  product: relationFilter(PurchaseLineReceivals.productUuid),
  arrived: (values) => {
    const value = values[0];
    if (value !== "true" && value !== "false") {
      return undefined;
    }
    return value === "true"
      ? sql`COALESCE(${PurchaseLineReceivals.kgActual}, 0) > 0`
      : sql`COALESCE(${PurchaseLineReceivals.kgActual}, 0) <= 0`;
  },
};

const PURCHASE_RECEIVAL_SORTABLE: SortableColumns = {
  purchaseOrderCode: PurchaseLineReceivals.purchaseOrderCode,
  supplierName: Companies.companyName,
  productCode: Products.productCode,
  deliveryDatePlanned: PurchaseLineReceivals.deliveryDatePlanned,
  deliveryDateActual: PurchaseLineReceivals.deliveryDateActual,
  receiptDate: receiptDateSql,
  kgPlanned: PurchaseLineReceivals.kgPlanned,
  kgActual: PurchaseLineReceivals.kgActual,
  lineAmount: lineAmountSql,
  purchaseOrderDate: PurchaseOrders.orderDate,
};

export type PurchaseReceivalRow = {
  uuid: SelectPurchaseLineReceivals["uuid"];
  id: SelectPurchaseLineReceivals["id"];
  purchaseOrderUuid: SelectPurchaseLineReceivals["purchaseOrderUuid"];
  purchaseOrderItemUuid: SelectPurchaseLineReceivals["purchaseOrderItemUuid"];
  productUuid: SelectPurchaseLineReceivals["productUuid"];
  companyUuid: SelectPurchaseLineReceivals["companyUuid"];

  /** The row's identity: order, line, supplier. */
  purchaseOrderCode: SelectPurchaseLineReceivals["purchaseOrderCode"];
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  lineNumber: SelectPurchaseLineReceivals["lineNumber"];
  supplierCode: SelectCompanies["searchCode1"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  purchaseOrderDate: SelectPurchaseOrders["orderDate"] | null;

  /** The line's money and quantities, repeated down its receivals. */
  lineAmount: number;
  qtyPlanned: SelectPurchaseOrderItems["quantity"];
  unit: SelectPurchaseOrderItems["unit"];
  qtyActual: SelectPurchaseOrderItems["qtyReceived"];
  /** "Received Qty" — the supplier's confirmed quantity, despite the heading. */
  confirmedQty: SelectPurchaseOrderItems["qtyConfirmed"];
  priceQuantity: number;

  options: SelectPurchaseOrderItems["options"];
  lineStatus: SelectPurchaseOrderItems["status"];
  receiptDate: SelectPurchaseLineReceivals["receiptDate"];
  purchaser: string | null;
  purchaserInitials: string | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  lengthMm: SelectPurchaseOrderItems["lengthMm"];

  /** The four figures that are the receival's own. */
  kgPlanned: SelectPurchaseLineReceivals["kgPlanned"];
  kgActual: SelectPurchaseLineReceivals["kgActual"];
  deliveryDateActual: SelectPurchaseLineReceivals["deliveryDateActual"];
  receiptStatus: SelectPurchaseLineReceivals["receiptStatus"];
  deliveryDatePlanned: SelectPurchaseLineReceivals["deliveryDatePlanned"];
};

export type PurchaseReceivalSibling = {
  uuid: SelectPurchaseLineReceivals["uuid"];
  kgPlanned: SelectPurchaseLineReceivals["kgPlanned"];
  kgActual: SelectPurchaseLineReceivals["kgActual"];
  deliveryDatePlanned: SelectPurchaseLineReceivals["deliveryDatePlanned"];
  deliveryDateActual: SelectPurchaseLineReceivals["deliveryDateActual"];
  receiptStatus: SelectPurchaseLineReceivals["receiptStatus"];
};

export type PurchaseReceivalDetail = PurchaseReceivalRow & {
  preAnnouncedDeliveryDate: SelectPurchaseLineReceivals["preAnnouncedDeliveryDate"];
  createdAt: SelectPurchaseLineReceivals["createdAt"];
  updatedAt: SelectPurchaseLineReceivals["updatedAt"];
  /** The other instalments of the same line, so a split is visible as one. */
  siblings: PurchaseReceivalSibling[];
  /** The batch registered against this receipt, if one has been. */
  batch: PurchaseReceivalBatchRow | null;
};

export type PurchaseReceivalActionResult = {
  success?: boolean;
  error?: string;
};

export type PurchaseReceivalBatchRow = Pick<
  SelectBatches,
  "uuid" | "internalCharge" | "charge" | "receiptDate" | "stockUuid"
>;

type PurchaserRow = { purchaserId: string | null };

const receivalSelection = {
  uuid: PurchaseLineReceivals.uuid,
  id: PurchaseLineReceivals.id,
  purchaseOrderUuid: PurchaseLineReceivals.purchaseOrderUuid,
  purchaseOrderItemUuid: PurchaseLineReceivals.purchaseOrderItemUuid,
  productUuid: PurchaseLineReceivals.productUuid,
  companyUuid: PurchaseLineReceivals.companyUuid,

  purchaseOrderCode: PurchaseLineReceivals.purchaseOrderCode,
  purchaseOrderId: PurchaseOrders.id,
  lineNumber: sql<
    SelectPurchaseLineReceivals["lineNumber"]
  >`COALESCE(${PurchaseOrderItems.lineNumber}, ${PurchaseLineReceivals.lineNumber})`,
  supplierCode: Companies.searchCode1,
  supplierName: Companies.companyName,
  purchaseOrderDate: PurchaseOrders.orderDate,

  lineAmount: lineAmountSql,
  qtyPlanned: sql<
    SelectPurchaseOrderItems["quantity"]
  >`COALESCE(${PurchaseOrderItems.quantity}, ${PurchaseLineReceivals.qtyPlanned})`,
  unit: sql<
    SelectPurchaseOrderItems["unit"]
  >`COALESCE(${PurchaseOrderItems.unit}, ${PurchaseLineReceivals.unit})`,
  qtyActual: sql<
    SelectPurchaseOrderItems["qtyReceived"]
  >`COALESCE(${PurchaseOrderItems.qtyReceived}, ${PurchaseLineReceivals.qtyActual})`,
  // "Received Qty" is the confirmed quantity — what the supplier acknowledged
  // it would send. The reference heading is simply misleading: the figure is
  // non-zero on rows where nothing has arrived, and matches "Qty confirmed" on
  // Purchase lines row for row.
  confirmedQty: sql<
    SelectPurchaseOrderItems["qtyConfirmed"]
  >`COALESCE(${PurchaseOrderItems.qtyConfirmed}, ${PurchaseLineReceivals.receivedQty})`,
  priceQuantity: priceQuantitySql,

  options: sql<
    SelectPurchaseOrderItems["options"]
  >`COALESCE(${PurchaseOrderItems.options}, ${PurchaseLineReceivals.options})`,
  lineStatus: lineStatusSql,
  receiptDate: receiptDateSql,
  purchaserId: sql<
    string | null
  >`COALESCE(${PurchaseOrderItems.purchaser}, ${PurchaseLineReceivals.purchaser})`,
  productCode: Products.productCode,
  productName: Products.name,
  lengthMm: sql<
    SelectPurchaseOrderItems["lengthMm"]
  >`COALESCE(${PurchaseOrderItems.lengthMm}, ${PurchaseLineReceivals.lengthMm})`,

  kgPlanned: PurchaseLineReceivals.kgPlanned,
  kgActual: PurchaseLineReceivals.kgActual,
  deliveryDateActual: PurchaseLineReceivals.deliveryDateActual,
  receiptStatus: PurchaseLineReceivals.receiptStatus,
  deliveryDatePlanned: PurchaseLineReceivals.deliveryDatePlanned,
};

// The purchaser column stores a Clerk id, and Clerk owns the names — so the id
// is resolved here rather than printed at a reader who has no way to know whose
// it is. The initials the reference shows beside it are derived from the name.
const withPurchaserNames = async <T extends PurchaserRow>(
  rows: T[],
): Promise<
  Array<
    Omit<T, "purchaserId"> & {
      purchaser: string | null;
      purchaserInitials: string | null;
    }
  >
> => {
  if (rows.length === 0) {
    return [];
  }
  const users = await getClerkUsersForSelect();
  const nameById = new Map(users.map((user) => [user.value, user.label]));

  return rows.map(({ purchaserId, ...row }) => {
    const purchaser = purchaserId
      ? (nameById.get(purchaserId) ?? purchaserId)
      : null;
    return { ...row, purchaser, purchaserInitials: personInitials(purchaser) };
  });
};

const purchaseReceivalRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<PurchaseReceivalRow[]> => {
    const rows = await db
      .select(receivalSelection)
      .from(PurchaseLineReceivals)
      .leftJoin(
        PurchaseOrderItems,
        eq(
          PurchaseLineReceivals.purchaseOrderItemUuid,
          PurchaseOrderItems.uuid,
        ),
      )
      .leftJoin(
        PurchaseOrders,
        eq(PurchaseLineReceivals.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(
        Companies,
        eq(PurchaseLineReceivals.companyUuid, Companies.uuid),
      )
      .leftJoin(Products, eq(PurchaseLineReceivals.productUuid, Products.uuid))
      .where(
        tableWhere({
          query,
          search: PURCHASE_RECEIVAL_SEARCH,
          filters: PURCHASE_RECEIVAL_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          PURCHASE_RECEIVAL_SORTABLE,
          query,
          [
            desc(PurchaseLineReceivals.deliveryDatePlanned),
            asc(PurchaseLineReceivals.purchaseOrderCode),
          ],
          PurchaseLineReceivals.id,
        ),
      )
      .limit(limit)
      .offset(offset);

    return withPurchaserNames(rows);
  };

export const getPurchaseReceivals = async (
  query: TableQuery,
): Promise<Paged<PurchaseReceivalRow>> => {
  try {
    return await runPaged(query, {
      rows: purchaseReceivalRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(PurchaseLineReceivals)
          .leftJoin(
            PurchaseOrderItems,
            eq(
              PurchaseLineReceivals.purchaseOrderItemUuid,
              PurchaseOrderItems.uuid,
            ),
          )
          .leftJoin(
            PurchaseOrders,
            eq(PurchaseLineReceivals.purchaseOrderUuid, PurchaseOrders.uuid),
          )
          .leftJoin(
            Companies,
            eq(PurchaseLineReceivals.companyUuid, Companies.uuid),
          )
          .leftJoin(
            Products,
            eq(PurchaseLineReceivals.productUuid, Products.uuid),
          )
          .where(
            tableWhere({
              query,
              search: PURCHASE_RECEIVAL_SEARCH,
              filters: PURCHASE_RECEIVAL_FILTERS,
            }),
          );
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase receivals"));
  }
};

export const exportPurchaseReceivals = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Purchase receivals",
    columns: PURCHASE_RECEIVAL_COLUMNS,
    columnKeys,
    rows: purchaseReceivalRows(parseTableQuery(params)),
  });

/**
 * One goods receipt with its supplier, product, purchase order, the other
 * instalments of the same line, and the batch registered against it.
 *
 * A receipt that has not been turned into a batch yet has none — the batch is
 * registered by a separate step on /batches, so its absence is a normal state
 * rather than missing data.
 */
export const getPurchaseReceivalDetail = async (
  uuid: string,
): Promise<PurchaseReceivalDetail | null> => {
  try {
    const rows = await db
      .select({
        ...receivalSelection,
        preAnnouncedDeliveryDate:
          PurchaseLineReceivals.preAnnouncedDeliveryDate,
        createdAt: PurchaseLineReceivals.createdAt,
        updatedAt: PurchaseLineReceivals.updatedAt,
      })
      .from(PurchaseLineReceivals)
      .leftJoin(
        PurchaseOrderItems,
        eq(
          PurchaseLineReceivals.purchaseOrderItemUuid,
          PurchaseOrderItems.uuid,
        ),
      )
      .leftJoin(
        PurchaseOrders,
        eq(PurchaseLineReceivals.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(
        Companies,
        eq(PurchaseLineReceivals.companyUuid, Companies.uuid),
      )
      .leftJoin(Products, eq(PurchaseLineReceivals.productUuid, Products.uuid))
      .where(eq(PurchaseLineReceivals.uuid, uuid))
      .limit(1);

    const [receival] = await withPurchaserNames(rows);
    if (!receival) {
      return null;
    }

    const siblings = receival.purchaseOrderItemUuid
      ? await db
          .select({
            uuid: PurchaseLineReceivals.uuid,
            kgPlanned: PurchaseLineReceivals.kgPlanned,
            kgActual: PurchaseLineReceivals.kgActual,
            deliveryDatePlanned: PurchaseLineReceivals.deliveryDatePlanned,
            deliveryDateActual: PurchaseLineReceivals.deliveryDateActual,
            receiptStatus: PurchaseLineReceivals.receiptStatus,
          })
          .from(PurchaseLineReceivals)
          .where(
            eq(
              PurchaseLineReceivals.purchaseOrderItemUuid,
              receival.purchaseOrderItemUuid,
            ),
          )
          .orderBy(asc(PurchaseLineReceivals.id))
      : [];

    const [batch] = await db
      .select({
        uuid: Batches.uuid,
        internalCharge: Batches.internalCharge,
        charge: Batches.charge,
        receiptDate: Batches.receiptDate,
        stockUuid: Batches.stockUuid,
      })
      .from(Batches)
      .where(eq(Batches.purchaseLineReceivalUuid, uuid))
      .limit(1);

    return { ...receival, siblings, batch: batch ?? null };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase receival"));
  }
};

/**
 * `Split` — divide a reception into two instalments.
 *
 * This is the mechanism behind a purchase line showing several rows on the
 * receivals overview: one reception is created against the line and then split,
 * which is why only the weights, the arrival date and the status differ between
 * those rows while everything else repeats from the line.
 *
 * The parts always sum to the whole — in kilos and in pieces both — so a split
 * can neither create nor destroy what the line is owed.
 */
export const splitPurchaseReceival = async (
  uuid: string,
  splitKg: number,
): Promise<PurchaseReceivalActionResult> => {
  try {
    const [receival] = await db
      .select()
      .from(PurchaseLineReceivals)
      .where(eq(PurchaseLineReceivals.uuid, uuid))
      .limit(1);

    if (!receival) {
      return { error: "Receipt not found." };
    }
    if (Number(receival.kgActual ?? 0) > 0) {
      return { error: "A receipt that has already arrived cannot be split." };
    }

    const plannedKg = Number(receival.kgPlanned ?? 0);
    if (plannedKg <= 0) {
      return {
        error:
          "This receipt carries no planned weight, so there is nothing to divide.",
      };
    }
    if (!Number.isFinite(splitKg) || splitKg <= 0 || splitKg >= plannedKg) {
      return {
        error: `Enter a weight between 0 and ${plannedKg} kg to split off.`,
      };
    }

    // The quantity follows the weight's share, so the two instalments still add
    // up to the pieces the line expects.
    const plannedQty = Number(receival.qtyPlanned ?? 0);
    const splitQty = plannedQty * (splitKg / plannedKg);

    await db.transaction(async (tx) => {
      await tx
        .update(PurchaseLineReceivals)
        .set({
          kgPlanned: (plannedKg - splitKg).toFixed(2),
          qtyPlanned: (plannedQty - splitQty).toFixed(3),
        })
        .where(eq(PurchaseLineReceivals.uuid, uuid));

      // The new instalment is the same reception in every respect except its
      // weight: same line, same planned date, nothing arrived yet.
      const { id: _id, uuid: _uuid, createdAt, updatedAt, ...rest } = receival;
      void _id;
      void _uuid;
      void createdAt;
      void updatedAt;
      await tx.insert(PurchaseLineReceivals).values({
        ...rest,
        uuid: generateUuid(),
        kgPlanned: splitKg.toFixed(2),
        qtyPlanned: splitQty.toFixed(3),
        kgActual: "0.00",
        qtyActual: "0.000",
        deliveryDateActual: null,
        receiptStatus: receival.receiptStatus,
      });
    });

    revalidatePath("/purchase-receivals");
    revalidatePath(`/purchase-receivals/${uuid}`);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to split the receipt") };
  }
};
