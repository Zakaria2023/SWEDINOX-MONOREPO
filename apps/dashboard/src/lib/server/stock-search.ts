import "server-only";

import { db } from "@/db";
import { Products } from "@/db/schema/products";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { Stock } from "@/db/schema/stock";
import { Warehouses } from "@/db/schema/warehouses";
import { NON_SELLABLE_LOCATION_TYPES, toDateString } from "@/lib/helpers";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  isNull,
  like,
  lte,
  ne,
  notInArray,
  or,
  SQL,
  sql,
} from "drizzle-orm";
import { MySqlColumn } from "drizzle-orm/mysql-core";

/** What a lot has left once its reservations are taken off. */
const availableQuantity = sql<string>`(${Stock.quantity} - ${Stock.reservedQuantity})`;

/**
 * The stock search a sales line is entered through.
 *
 * Watched on 21-9-2026: pressing `New` on an order line does not open a product
 * dropdown, it opens a window titled `Stock`. Filters on product, search code,
 * quality and the three dimensions — each dimension `From`/`Until and incl.`
 * with a **±5 % `Search with margin`** — then two grids. The upper one groups
 * the matches into product/quality variants and commits with `Use selected
 * product`, leaving the line unallocated. The lower one lists individual lots
 * and commits with `Use selected stock`, binding the line to one.
 *
 * Three tabs sit above the lower grid: `Stock`, `Purchase` and `Internal
 * production`. 🔴 The `Purchase` tab is how goods are sold before they arrive —
 * purchase order 401141 carried `Qty(r) 90` against `Qty(p) 100` on its own
 * Stock panel before the lorry left, and the receipt then pre-allocated exactly
 * those bundles to the sales lines waiting for them.
 *
 * This replaces loading every lot in the warehouse into the form and letting
 * the browser filter it.
 */
export type StockSearchSource = "stock" | "purchase";

export type StockSearchFilters = {
  productCode?: string | null;
  searchCode?: string | null;
  quality?: string | null;
  lengthMm?: number | null;
  widthMm?: number | null;
  thicknessMm?: number | null;
  /** The reference offers 5 % per dimension and defaults to it. */
  marginPercent?: number | null;
  onlyWithAvailableStock?: boolean;
  source?: StockSearchSource;
};

/** One row of the upper grid: a product and quality, with its lots summed. */
export type StockSearchVariant = {
  productUuid: string;
  productCode: string | null;
  productName: string | null;
  quality: string | null;
  stockCategory: string | null;
  options: string | null;
  lengthMm: number | null;
  widthMm: number | null;
  thicknessMm: string | null;
  technical: number;
  reserved: number;
  available: number;
  kgTechnical: number;
  kgAvailable: number;
  lotCount: number;
};

/** One row of the lower grid: a lot you can bind a line to. */
export type StockSearchLot = {
  uuid: string;
  productUuid: string;
  productCode: string | null;
  productName: string | null;
  locationName: string | null;
  quality: string | null;
  charge: string | null;
  internalCharge: string | null;
  internalBatch: string | null;
  stockCategory: string | null;
  options: string | null;
  remark: string | null;
  lengthMm: number | null;
  widthMm: number | null;
  thicknessMm: string | null;
  quantity: number;
  reserved: number;
  available: number;
  quantityKg: number;
  valuationPrice: number;
  /** Set on the `Purchase` tab: the order these goods are coming in on. */
  purchaseOrderId: number | null;
  expectedDate: string | null;
};

export type StockSearchResult = {
  variants: StockSearchVariant[];
  lots: StockSearchLot[];
  /** True when the grids were cut short, so the dialog can say so. */
  truncated: boolean;
};

const STOCK_SEARCH_LIMIT = 200;

/**
 * A dimension filter with the reference's margin applied.
 *
 * `Search with margin` is what makes the dialog usable: a customer asking for a
 * 3000 mm plate will take a 2950 one, and typing an exact length would hide it.
 * A margin of 0 means the dimension must match exactly.
 */
const withinMargin = (
  column: MySqlColumn,
  value: number | null | undefined,
  marginPercent: number,
): SQL | undefined => {
  if (!value || value <= 0) {
    return undefined;
  }
  const slack = (value * marginPercent) / 100;
  return and(
    gte(column, String(value - slack)),
    lte(column, String(value + slack)),
  );
};

export const findSellableStock = async (
  filters: StockSearchFilters,
): Promise<StockSearchResult> => {
  const margin = filters.marginPercent ?? 5;
  const source = filters.source ?? "stock";

  const text = (value: string | null | undefined) =>
    value && value.trim() ? `%${value.trim()}%` : null;

  const productCode = text(filters.productCode);
  const searchCode = text(filters.searchCode);
  const quality = text(filters.quality);

  // Goods already on the shelf. Everything `getAvailableStockForSelect` excludes
  // is excluded here too — blocked lots, somebody else's metal, and locations
  // whose type puts stock out of reach — because a search that offers metal a
  // line cannot take is worse than no search.
  const shelf = async (): Promise<StockSearchLot[]> => {
    const rows = await db
      .select({
        uuid: Stock.uuid,
        productUuid: Stock.productUuid,
        productCode: Products.productCode,
        productName: Products.name,
        locationName: Warehouses.name,
        quality: Stock.quality,
        charge: Stock.charge,
        internalCharge: Stock.internalCharge,
        internalBatch: Stock.internalBatch,
        stockCategory: Stock.stockCategory,
        options: Stock.options,
        remark: Stock.remark,
        lengthMm: Stock.lengthMm,
        widthMm: Stock.widthMm,
        thicknessMm: Stock.thicknessMm,
        quantity: Stock.quantity,
        reserved: Stock.reservedQuantity,
        quantityKg: Stock.quantityKg,
        valuationPrice: Stock.valuationPrice,
      })
      .from(Stock)
      .innerJoin(Products, eq(Stock.productUuid, Products.uuid))
      .leftJoin(Warehouses, eq(Stock.locationUuid, Warehouses.uuid))
      .where(
        and(
          eq(Stock.status, "pending"),
          eq(Stock.blocked, false),
          isNull(Stock.ownerCompanyUuid),
          or(
            isNull(Stock.locationUuid),
            isNull(Warehouses.locationType),
            notInArray(Warehouses.locationType, NON_SELLABLE_LOCATION_TYPES),
          ),
          productCode ? like(Products.productCode, productCode) : undefined,
          searchCode ? like(Products.searchCode1, searchCode) : undefined,
          quality ? like(Stock.quality, quality) : undefined,
          withinMargin(Stock.lengthMm, filters.lengthMm, margin),
          withinMargin(Stock.widthMm, filters.widthMm, margin),
          withinMargin(Stock.thicknessMm, filters.thicknessMm, margin),
          filters.onlyWithAvailableStock === false
            ? undefined
            : gt(availableQuantity, "0"),
        ),
      )
      .orderBy(desc(Stock.receiptDate))
      .limit(STOCK_SEARCH_LIMIT + 1);

    return rows.map((row) => ({
      ...row,
      quantity: Number(row.quantity ?? 0),
      reserved: Number(row.reserved ?? 0),
      available: Number(row.quantity ?? 0) - Number(row.reserved ?? 0),
      quantityKg: Number(row.quantityKg ?? 0),
      valuationPrice: Number(row.valuationPrice ?? 0),
      purchaseOrderId: null,
      expectedDate: null,
    }));
  };

  // 🔴 Goods that have not arrived. Each row is a purchase line still owing
  // quantity, offered as supply a sales line can be struck against — which is
  // how 90 of the 100 pieces on purchase order 401141 were spoken for before
  // the lorry left.
  const incoming = async (): Promise<StockSearchLot[]> => {
    const outstanding = sql<string>`(${PurchaseOrderItems.quantity} - ${PurchaseOrderItems.qtyReceived})`;
    const rows = await db
      .select({
        uuid: PurchaseOrderItems.uuid,
        productUuid: PurchaseOrderItems.productUuid,
        productCode: Products.productCode,
        productName: Products.name,
        quality: PurchaseOrderItems.qualityCode,
        lengthMm: PurchaseOrderItems.lengthMm,
        widthMm: PurchaseOrderItems.widthMm,
        thicknessMm: PurchaseOrderItems.thicknessMm,
        quantity: outstanding,
        quantityKg: PurchaseOrderItems.kgPurchased,
        valuationPrice: PurchaseOrderItems.netPrice,
        purchaseOrderId: PurchaseOrders.id,
        expectedDate: PurchaseOrders.deliveryDate,
      })
      .from(PurchaseOrderItems)
      .innerJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
      .innerJoin(
        PurchaseOrders,
        eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .where(
        and(
          gt(outstanding, "0"),
          ne(PurchaseOrders.status, "cancelled"),
          productCode ? like(Products.productCode, productCode) : undefined,
          searchCode ? like(Products.searchCode1, searchCode) : undefined,
          quality ? like(PurchaseOrderItems.qualityCode, quality) : undefined,
          withinMargin(PurchaseOrderItems.lengthMm, filters.lengthMm, margin),
          withinMargin(PurchaseOrderItems.widthMm, filters.widthMm, margin),
          withinMargin(
            PurchaseOrderItems.thicknessMm,
            filters.thicknessMm,
            margin,
          ),
        ),
      )
      .orderBy(asc(PurchaseOrders.deliveryDate))
      .limit(STOCK_SEARCH_LIMIT + 1);

    return rows.map((row) => ({
      uuid: row.uuid,
      productUuid: row.productUuid,
      productCode: row.productCode,
      productName: row.productName,
      locationName: null,
      quality: row.quality,
      charge: null,
      internalCharge: null,
      internalBatch: null,
      stockCategory: null,
      options: null,
      remark: null,
      lengthMm: row.lengthMm,
      widthMm: row.widthMm,
      thicknessMm: row.thicknessMm,
      quantity: Number(row.quantity ?? 0),
      // Nothing is reserved against a line that has not been received. What the
      // reference shows as `Qty(r)` there is the sales side's claim on it, and
      // reading it back from here would count the same commitment twice.
      reserved: 0,
      available: Number(row.quantity ?? 0),
      quantityKg: Number(row.quantityKg ?? 0),
      valuationPrice: Number(row.valuationPrice ?? 0),
      purchaseOrderId: row.purchaseOrderId,
      expectedDate: row.expectedDate ? toDateString(row.expectedDate) : null,
    }));
  };

  const found = source === "purchase" ? await incoming() : await shelf();
  const truncated = found.length > STOCK_SEARCH_LIMIT;
  const lots = truncated ? found.slice(0, STOCK_SEARCH_LIMIT) : found;

  // The upper grid. One row per product and quality, which is how the reference
  // groups it: `PK304L300315` appeared four times — 304L2B, 304L, 304L2B with
  // `Laser Foil`, and 304L2B `2nd choice` — each with its own totals.
  const variants = new Map<string, StockSearchVariant>();
  lots.forEach((lot) => {
    const key = [
      lot.productUuid,
      lot.quality ?? "",
      lot.stockCategory ?? "",
      lot.options ?? "",
    ].join("|");
    const existing = variants.get(key);
    if (existing) {
      existing.technical += lot.quantity;
      existing.reserved += lot.reserved;
      existing.available += lot.available;
      existing.kgTechnical += lot.quantityKg;
      existing.kgAvailable +=
        lot.quantity > 0 ? (lot.quantityKg * lot.available) / lot.quantity : 0;
      existing.lotCount += 1;
      return;
    }
    variants.set(key, {
      productUuid: lot.productUuid,
      productCode: lot.productCode,
      productName: lot.productName,
      quality: lot.quality,
      stockCategory: lot.stockCategory,
      options: lot.options,
      lengthMm: lot.lengthMm,
      widthMm: lot.widthMm,
      thicknessMm: lot.thicknessMm,
      technical: lot.quantity,
      reserved: lot.reserved,
      available: lot.available,
      kgTechnical: lot.quantityKg,
      kgAvailable:
        lot.quantity > 0 ? (lot.quantityKg * lot.available) / lot.quantity : 0,
      lotCount: 1,
    });
  });

  return {
    variants: [...variants.values()].sort(
      (a, b) => b.available - a.available,
    ),
    lots,
    truncated,
  };
};
