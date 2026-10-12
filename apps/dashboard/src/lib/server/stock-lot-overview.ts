import "server-only";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import {
  RevenueGroups,
  SelectRevenueGroups,
} from "@/db/schema/revenue-groups";
import { SelectStock, Stock } from "@/db/schema/stock";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import {
  booleanFilter,
  FilterBindings,
  relationFilter,
  tableOrderBy,
  tableWhere,
  textRangeFilter,
  valueFilter,
} from "@/lib/server/table-query";
import { TableQuery } from "@/lib/table-query";
import { StockLotView, stockLotViews } from "@/lib/enums";
import { count, desc, eq, getTableColumns, SQL, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

// A lot's location sits under a warehouse section — `00 Hego Almere` on 2 246
// of 2 247 lots — one level up the same tree. The owner of customer stock is a
// second company beside the supplier.
const Section = alias(Warehouses, "section");
const SectionParent = alias(Warehouses, "section_parent");
const Owner = alias(Companies, "owner");

/**
 * One lot as `Stock on location` prints it: all 54 columns of the reference's
 * export (2 247 lots, docs/reference-system/stock-on-location.md), which
 * `Customer stock on location` shares column for column.
 */
export type StockLotOverviewRow = SelectStock & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  stockProduct: SelectProducts["stockProduct"] | null;
  standardProduct: SelectProducts["standardProduct"] | null;
  groupProduct: SelectProducts["groupProduct"] | null;
  applyOptimization: SelectProducts["batchUseOptimization"] | null;
  fixedDimensions: SelectProducts["tradeLengthFixed"] | null;
  stockUnit: SelectProducts["stockUnit"] | null;
  priceUnit: SelectProducts["priceUnit"] | null;
  orderAdviceCode: SelectProducts["orderAdviceCode"] | null;
  pacCode: SelectProducts["pacClassification"] | null;
  theoreticalWeight: SelectProducts["theoreticalWeight"] | null;
  theoreticalWeightUnit: SelectProducts["weightUnit"] | null;
  theoreticalThickness: SelectProducts["theoreticalThickness"] | null;
  mainQuality: SelectProducts["featuresQuality"] | null;
  productType: SelectProducts["dimensionShape"] | null;
  searchCode1: SelectProducts["searchCode1"] | null;
  searchCode2: SelectProducts["searchCode2"] | null;
  searchCode3: SelectProducts["searchCode3"] | null;
  articleGroup: SelectProducts["articleGroup"] | null;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  locationName: SelectWarehouses["name"] | null;
  locationType: SelectWarehouses["locationType"] | null;
  sectionName: SelectWarehouses["name"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  ownerName: SelectCompanies["companyName"] | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  // Computed in SQL.
  available: number;
  availableKg: number;
  stockValue: number;
  /** What is still on order for the product — the reference's `Qty ordered`. */
  qtyOrdered: number;
};

export type StockLotOverviewScope = "all" | "customer";

/** The grid's footer, over every lot the view selects. */
export type StockLotOverviewTotals = {
  quantityKg: number;
  stockValue: number;
};

const LOT_SEARCH = [
  Products.productCode,
  Products.name,
  Stock.charge,
  Stock.internalCharge,
  Stock.internalBatch,
] as const;

// The reference's one location with a view of its own.
const CUVELJE = "CUVELJE";

const RESERVED = sql`COALESCE(${Stock.reservedQuantity}, 0) > 0.01`;
const FREE = sql`COALESCE(${Stock.reservedQuantity}, 0) <= 0.01`;

const atCuvelje = sql`${Stock.locationUuid} IN (
  SELECT ${Warehouses.uuid} FROM ${Warehouses}
  WHERE UPPER(${Warehouses.name}) = ${CUVELJE}
)`;

// Each saved view's filter, as the reference spells it in its view editor.
const VIEW_WHERE: Record<StockLotView, SQL | undefined> = {
  standaard: undefined,
  gip: undefined,
  verkocht: RESERVED,
  beschikbare_voorraad: FREE,
  // `Bundle = 0 And Not Product code Contains SC`
  controle: sql`COALESCE(${Stock.internalBatch}, '') IN ('', '0')
    AND COALESCE(${Products.productCode}, '') NOT LIKE '%SC%'`,
  cuvelje: atCuvelje,
  // `Location ≠ CUVELJE And Stock category In [2nd choice, Remaining] Or
  // Stock category Is null or empty And Available (StkU) from 1,00 to
  // 3.996,00 And Stock (Kg) from 1…` — the category test takes both spellings
  // our lots have carried.
  available_in_house: sql`NOT (${atCuvelje})
    AND (COALESCE(${Stock.stockCategory}, '') IN ('', '2nd choice', 'Remaining', 'second_choice', 'remaining'))
    AND GREATEST(0, COALESCE(${Stock.quantity}, 0) - COALESCE(${Stock.reservedQuantity}, 0)) BETWEEN 1 AND 3996
    AND COALESCE(${Stock.quantityKg}, 0) >= 1`,
};

const namedView = (value: string | undefined): StockLotView | undefined =>
  stockLotViews.find((view) => view === value);

const LOT_SORTABLE = {
  productCode: Products.productCode,
  location: Warehouses.name,
  quantity: Stock.quantity,
  quantityKg: Stock.quantityKg,
  receiptDate: Stock.receiptDate,
  createdAt: Stock.createdAt,
  updatedAt: Stock.updatedAt,
};

// The reference's saved views are filters on these: `Verkocht` is reserved,
// `Beschikbare voorraad` is not, `Cuvelje` is one location.
const LOT_FILTERS: FilterBindings = {
  location: relationFilter(Stock.locationUuid),
  // Set by the product screen's `Stock on location` button.
  product: relationFilter(Stock.productUuid),
  // Set by the company screen's `Stock on location` button.
  owner: relationFilter(Stock.ownerCompanyUuid),
  blocked: booleanFilter(Stock.blocked),
  stockCategory: valueFilter(Stock.stockCategory),
  reserved: (values) => {
    if (values[0] === "reserved") {
      return RESERVED;
    }
    if (values[0] === "free") {
      return FREE;
    }
    return undefined;
  },
  // The reference's only filter on this screen: `Product code` from / u/i.
  productCode: textRangeFilter(Products.productCode),
  // A list of bundle numbers, pasted — what the reference does by filtering
  // the `Bundle` column to `In [ … ]`.
  bundles: valueFilter(Stock.internalBatch),
  view: (values) => {
    const view = namedView(values[0]);
    return view ? VIEW_WHERE[view] : undefined;
  },
};

const scopeOf = (scope: StockLotOverviewScope): SQL[] =>
  scope === "customer" ? [sql`${Stock.ownerCompanyUuid} IS NOT NULL`] : [];

const whereOf = (query: TableQuery, scope: StockLotOverviewScope) =>
  tableWhere({
    query,
    search: LOT_SEARCH,
    filters: LOT_FILTERS,
    scope: [sql`${Stock.status} <> 'received'`, ...scopeOf(scope)],
  });

/**
 * The lots one view selects, as a window onto them — shared by both screens
 * and both of their exports.
 *
 * Only lots still holding goods: a lot drawn to nothing is `received` and has
 * left the shelf.
 */
export const stockLotOverviewRows =
  (query: TableQuery, scope: StockLotOverviewScope) =>
  (limit: number, offset: number): Promise<StockLotOverviewRow[]> =>
    db
      .select({
        ...getTableColumns(Stock),
        productCode: Products.productCode,
        productName: Products.name,
        stockProduct: Products.stockProduct,
        standardProduct: Products.standardProduct,
        groupProduct: Products.groupProduct,
        applyOptimization: Products.batchUseOptimization,
        fixedDimensions: Products.tradeLengthFixed,
        stockUnit: Products.stockUnit,
        priceUnit: Products.priceUnit,
        orderAdviceCode: Products.orderAdviceCode,
        pacCode: Products.pacClassification,
        theoreticalWeight: Products.theoreticalWeight,
        theoreticalWeightUnit: Products.weightUnit,
        theoreticalThickness: Products.theoreticalThickness,
        mainQuality: Products.featuresQuality,
        productType: Products.dimensionShape,
        searchCode1: Products.searchCode1,
        searchCode2: Products.searchCode2,
        searchCode3: Products.searchCode3,
        articleGroup: Products.articleGroup,
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        locationName: Warehouses.name,
        locationType: Warehouses.locationType,
        // The warehouse at the top of the tree: a shelf's parent is a
        // sub-section on a three-level tree, the warehouse one above that.
        sectionName: sql<
          string | null
        >`COALESCE(${SectionParent.name}, ${Section.name})`,
        supplierName: Companies.companyName,
        ownerName: Owner.companyName,
        purchaseOrderId: PurchaseOrders.id,
        // The reference rounds `Available` for display only; the decimal stays.
        available:
          sql<number>`GREATEST(0, COALESCE(${Stock.quantity}, 0) - COALESCE(${Stock.reservedQuantity}, 0))`.mapWith(
            Number,
          ),
        availableKg: sql<number>`GREATEST(0,
          COALESCE(${Stock.quantityKg}, 0)
          - CASE WHEN COALESCE(${Stock.quantity}, 0) > 0
              THEN COALESCE(${Stock.quantityKg}, 0) * COALESCE(${Stock.reservedQuantity}, 0) / ${Stock.quantity}
              ELSE 0
            END)`.mapWith(Number),
        // The lot's stored value. The reference's `Stock (€)` reads
        // kg × price ÷ 1000 because its prices are per tonne; a lot priced by
        // the piece would come out a thousandth of its worth that way, and
        // `valuationEuro` is what the ledger reconciles to either way.
        stockValue: sql<number>`COALESCE(${Stock.valuationEuro}, 0)`.mapWith(
          Number,
        ),
        // `392` on all 98 lots of `PK304150315`: a product-level figure
        // repeated on each lot — what is ordered from suppliers and not yet in.
        qtyOrdered: sql<number>`(
          SELECT COALESCE(SUM(GREATEST(${sql.raw("`poi`.`quantity`")} - COALESCE(${sql.raw("`poi`.`qty_received`")}, 0), 0)), 0)
          FROM ${sql.raw("`PurchaseOrderItems` AS `poi`")}
          INNER JOIN ${sql.raw("`PurchaseOrders` AS `po`")} ON ${sql.raw("`po`.`uuid` = `poi`.`purchase_order_uuid`")}
          WHERE ${sql.raw("`poi`.`product_uuid`")} = ${Stock.productUuid}
            AND ${sql.raw("`po`.`status` IN ('released', 'checked', 'in_progress', 'partially_received')")}
        )`.mapWith(Number),
      })
      .from(Stock)
      .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
      .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
      .leftJoin(Warehouses, eq(Stock.locationUuid, Warehouses.uuid))
      .leftJoin(Section, eq(Warehouses.parentUuid, Section.uuid))
      .leftJoin(SectionParent, eq(Section.parentUuid, SectionParent.uuid))
      .leftJoin(Companies, eq(Stock.supplierUuid, Companies.uuid))
      .leftJoin(Owner, eq(Stock.ownerCompanyUuid, Owner.uuid))
      .leftJoin(PurchaseOrders, eq(Stock.purchaseOrderUuid, PurchaseOrders.uuid))
      .where(whereOf(query, scope))
      .orderBy(
        ...tableOrderBy(
          LOT_SORTABLE,
          query,
          // `GIP` opens on the newest change, as the reference's does.
          [namedView(query.filters.view?.[0]) === "gip" ? desc(Stock.updatedAt) : desc(Stock.createdAt)],
          Stock.id,
        ),
      )
      .limit(limit)
      .offset(offset);

export const countStockLotOverview = async (
  query: TableQuery,
  scope: StockLotOverviewScope,
): Promise<number> => {
  const [row] = await db
    .select({ value: count() })
    .from(Stock)
    .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
    .where(whereOf(query, scope));
  return Number(row?.value ?? 0);
};

/**
 * The footer's totals — `Stock (Kg)` and `Stock (€)` over every lot the view
 * selects, not just the page: 2 428 474 kg and € 5 070 915,59 on the
 * reference's `Standaard`.
 */
export const stockLotOverviewTotals = async (
  query: TableQuery,
  scope: StockLotOverviewScope,
): Promise<StockLotOverviewTotals> => {
  const [row] = await db
    .select({
      quantityKg: sql<number>`COALESCE(SUM(${Stock.quantityKg}), 0)`.mapWith(
        Number,
      ),
      stockValue: sql<number>`COALESCE(SUM(${Stock.valuationEuro}), 0)`.mapWith(
        Number,
      ),
    })
    .from(Stock)
    .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
    .where(whereOf(query, scope));
  return {
    quantityKg: row?.quantityKg ?? 0,
    stockValue: row?.stockValue ?? 0,
  };
};
