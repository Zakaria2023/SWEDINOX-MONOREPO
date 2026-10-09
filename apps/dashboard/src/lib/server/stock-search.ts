import "server-only";

import { db } from "@/db";
import { Companies } from "@/db/schema/companies";
import { Products } from "@/db/schema/products";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { Stock } from "@/db/schema/stock";
import { Warehouses } from "@/db/schema/warehouses";
import {
  articlePieceWeightKg,
  inferArticleQuality,
  NON_SELLABLE_LOCATION_TYPES,
  toDateString,
} from "@/lib/helpers";
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

/**
 * What the reference calls a lot's **choice**, and the two values it has been
 * seen carrying. `stockCategory` is free text — the reference lets a warehouse
 * name its own categories — so this matches rather than enumerates, and a
 * category nobody recognises counts as first choice, which is what the
 * reference's own grid does when neither box is ticked.
 *
 * Dutch and English both appear: the correction dialog writes `2nd choice` and
 * the filter chip is labelled `2e keus`.
 */
const SECOND_CHOICE_CATEGORIES = ["2nd choice", "2e keus", "2de keus"];

const isSecondChoiceSql = sql<boolean>`(
  LOWER(COALESCE(${Stock.stockCategory}, '')) IN (${sql.join(
    SECOND_CHOICE_CATEGORIES.map((value) => sql`${value}`),
    sql`, `,
  )})
)`;

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
export type StockSearchSource = "stock" | "purchase" | "catalogue";

export type StockSearchFilters = {
  productCode?: string | null;
  searchCode?: string | null;
  quality?: string | null;
  /**
   * `From` of each dimension. Alone it means "about this size" and the margin
   * is applied either side of it; with a `To` it is the bottom of a range.
   */
  lengthMm?: number | null;
  widthMm?: number | null;
  thicknessMm?: number | null;
  /** `Until and incl.` of each dimension — the reference's `Tot en met`. */
  lengthMmTo?: number | null;
  widthMmTo?: number | null;
  thicknessMmTo?: number | null;
  /** The reference offers 5 % per dimension and defaults to it. */
  marginPercent?: number | null;
  /** A dimension's own margin, when it differs from the one above. */
  lengthMarginPercent?: number | null;
  widthMarginPercent?: number | null;
  thicknessMarginPercent?: number | null;
  /** The reference's `Productgroep` dropdown. */
  productGroupUuid?: string | null;
  /**
   * The reference's `Bewerking` dropdown: the processing the metal carries.
   * Matched on what a lot or an incoming line says it has; the article list
   * keeps its options as a list whose shape the reference never showed us
   * filtering on, so a catalogue row is not narrowed by it.
   */
  option?: string | null;
  /**
   * 🔴 The reference's `Only products with available stock`, and it does **not**
   * mean what it says. It was ticked on 29-9-2026 while two of the four rows
   * read `Available 0 ST`, and the grid's own filter chip read
   * `TotalPhysicalStock ≠ 0`. So it hides articles that are not on the shelf at
   * all, not articles that are spoken for — a salesman still has to see metal
   * somebody else has reserved, because reservations move.
   *
   * Named for what it filters on rather than what the label says, so nobody
   * implements the obvious and wrong thing again.
   */
  onlyWithPhysicalStock?: boolean;
  /**
   * The reference's `1e keus` / `2e keus`, both unticked by default — so both
   * choices are offered together and a downgraded lot is a normal candidate
   * unless somebody excludes it. Ticking both is the same as ticking neither.
   */
  includeFirstChoice?: boolean;
  includeSecondChoice?: boolean;
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
  /** One piece's weight, so a line can show `Kg(p)` the moment it is picked. */
  pieceWeightKg: number | null;
  /** The article's own purchase unit, which a buying line's `Per` defaults to. */
  purchasingUnit: string | null;
  /** What the quantities are counted in — the reference prints `300 ST`. */
  unit: string | null;
  /** The article's own counting unit — what a new line is ordered in. */
  articleUnit: string | null;
  technical: number;
  reserved: number;
  available: number;
  kgTechnical: number;
  kgReserved: number;
  kgAvailable: number;
  /** The reference's `Total len.`: quantity × length in metres, summed. */
  totalLengthM: number;
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
  /** The lot's own unit, printed beside every quantity. */
  unit: string | null;
  /** The article's own counting unit — what a new line is ordered in. */
  articleUnit: string | null;
  quantityKg: number;
  /** One piece's weight, so a line can show `Kg(p)` the moment it is picked. */
  pieceWeightKg: number | null;
  /** The article's own purchase unit, which a buying line's `Per` defaults to. */
  purchasingUnit: string | null;
  valuationPrice: number;
  /** The purchase order the lot arrived on, or — on the `Purchase` tab — is
   *  coming in on. */
  purchaseOrderId: number | null;
  expectedDate: string | null;
  /** The reference's `Ongeopend`: a bundle nobody has cut open. */
  unopened: boolean;
  receiptDate: string | null;
  supplierName: string | null;
  /** What was paid, beside `APP`: the purchase line's net price and unit. */
  purchasePrice: number | null;
  purchasePriceUnit: string | null;
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
  to?: number | null,
): SQL | undefined => {
  const from = value && value > 0 ? value : null;
  const until = to && to > 0 ? to : null;
  if (from === null && until === null) {
    return undefined;
  }
  // `From` alone is "about this size", so the margin sits either side of it;
  // a range stretches by its margin at both ends — `From 2000 To 3000` at 5 %
  // takes 1900 to 3150.
  if (from !== null && until === null) {
    const slack = (from * marginPercent) / 100;
    return and(
      gte(column, String(from - slack)),
      lte(column, String(from + slack)),
    );
  }
  return and(
    from === null
      ? undefined
      : gte(column, String(from - (from * marginPercent) / 100)),
    until === null
      ? undefined
      : lte(column, String(until + (until * marginPercent) / 100)),
  );
};

export const findSellableStock = async (
  filters: StockSearchFilters,
): Promise<StockSearchResult> => {
  const margin = filters.marginPercent ?? 5;
  const lengthMargin = filters.lengthMarginPercent ?? margin;
  const widthMargin = filters.widthMarginPercent ?? margin;
  const thicknessMargin = filters.thicknessMarginPercent ?? margin;
  const source = filters.source ?? "stock";

  const text = (value: string | null | undefined) =>
    value && value.trim() ? `%${value.trim()}%` : null;

  const productCode = text(filters.productCode);
  const searchCode = text(filters.searchCode);
  const quality = text(filters.quality);
  const option = text(filters.option);
  const productGroup = filters.productGroupUuid || null;

  // Neither box or both boxes means everything, which is how the reference
  // opens: a 2nd-choice lot is a normal candidate until somebody says otherwise.
  const wantsFirst = filters.includeFirstChoice ?? false;
  const wantsSecond = filters.includeSecondChoice ?? false;
  const choiceFilter =
    wantsFirst === wantsSecond
      ? undefined
      : wantsSecond
        ? eq(isSecondChoiceSql, true)
        : eq(isSecondChoiceSql, false);

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
        // The article's own, for a lot that was booked in without saying.
        articleQuality: Products.featuresQuality,
        articleLength: Products.length,
        articleWidth: Products.widthDiameter,
        articleThickness: Products.thickness,
        quantity: Stock.quantity,
        reserved: Stock.reservedQuantity,
        unit: Stock.unit,
        articleUnit: Products.stockUnit,
        quantityKg: Stock.quantityKg,
        valuationPrice: Stock.valuationPrice,
        purchasingUnit: Products.purchasingUnit,
        unopened: Stock.unopened,
        receiptDate: Stock.receiptDate,
        purchaseOrderId: PurchaseOrders.id,
        supplierName: Companies.companyName,
        purchasePrice: PurchaseOrderItems.netPrice,
        purchasePriceUnit: PurchaseOrderItems.priceUnit,
      })
      .from(Stock)
      .innerJoin(Products, eq(Stock.productUuid, Products.uuid))
      .leftJoin(Warehouses, eq(Stock.locationUuid, Warehouses.uuid))
      .leftJoin(PurchaseOrders, eq(Stock.purchaseOrderUuid, PurchaseOrders.uuid))
      .leftJoin(
        PurchaseOrderItems,
        eq(Stock.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
      )
      .leftJoin(Companies, eq(Stock.supplierUuid, Companies.uuid))
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
          option ? like(Stock.options, option) : undefined,
          productGroup
            ? eq(Products.productGroupUuid, productGroup)
            : undefined,
          withinMargin(
            Stock.lengthMm,
            filters.lengthMm,
            lengthMargin,
            filters.lengthMmTo,
          ),
          withinMargin(
            Stock.widthMm,
            filters.widthMm,
            widthMargin,
            filters.widthMmTo,
          ),
          withinMargin(
            Stock.thicknessMm,
            filters.thicknessMm,
            thicknessMargin,
            filters.thicknessMmTo,
          ),
          filters.onlyWithPhysicalStock === false
            ? undefined
            : ne(Stock.quantity, "0"),
          choiceFilter,
        ),
      )
      .orderBy(desc(Stock.receiptDate))
      .limit(STOCK_SEARCH_LIMIT + 1);

    return rows.map((row) => {
      const quantity = Number(row.quantity ?? 0);
      const quantityKg = Number(row.quantityKg ?? 0);
      const {
        articleQuality,
        articleLength,
        articleWidth,
        articleThickness,
        ...lot
      } = row;
      const mm = (value: string | null) =>
        value === null ? null : Math.round(Number(value));
      return {
        ...lot,
        // A lot that was booked in without its own quality or size is still
        // the article it is: the reference's grid prints `304L2B` and
        // `2000 × 1000 × 2` off the article where the lot says nothing.
        quality:
          lot.quality ??
          articleQuality ??
          inferArticleQuality(lot.productCode, lot.productName),
        lengthMm: lot.lengthMm ?? mm(articleLength),
        widthMm: lot.widthMm ?? mm(articleWidth),
        thicknessMm: lot.thicknessMm ?? articleThickness,
        quantity,
        reserved: Number(row.reserved ?? 0),
        available: quantity - Number(row.reserved ?? 0),
        quantityKg,
        // A lot on the shelf has been weighed as a whole, so one piece of it is
        // that weight shared out — nearer the truth than any formula.
        pieceWeightKg: quantity > 0 && quantityKg > 0 ? quantityKg / quantity : null,
        valuationPrice: Number(row.valuationPrice ?? 0),
        expectedDate: null,
        purchasePrice:
          row.purchasePrice === null ? null : Number(row.purchasePrice),
      };
    });
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
        unit: PurchaseOrderItems.unit,
        articleUnit: Products.stockUnit,
        quantityKg: PurchaseOrderItems.kgPurchased,
        valuationPrice: PurchaseOrderItems.netPrice,
        purchaseOrderId: PurchaseOrders.id,
        expectedDate: PurchaseOrders.deliveryDate,
        purchasingUnit: Products.purchasingUnit,
        supplierName: Companies.companyName,
        purchasePriceUnit: PurchaseOrderItems.priceUnit,
      })
      .from(PurchaseOrderItems)
      .innerJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
      .innerJoin(
        PurchaseOrders,
        eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
      .where(
        and(
          gt(outstanding, "0"),
          ne(PurchaseOrders.status, "cancelled"),
          productCode ? like(Products.productCode, productCode) : undefined,
          searchCode ? like(Products.searchCode1, searchCode) : undefined,
          quality ? like(PurchaseOrderItems.qualityCode, quality) : undefined,
          option ? like(PurchaseOrderItems.options, option) : undefined,
          productGroup
            ? eq(Products.productGroupUuid, productGroup)
            : undefined,
          withinMargin(
            PurchaseOrderItems.lengthMm,
            filters.lengthMm,
            lengthMargin,
            filters.lengthMmTo,
          ),
          withinMargin(
            PurchaseOrderItems.widthMm,
            filters.widthMm,
            widthMargin,
            filters.widthMmTo,
          ),
          withinMargin(
            PurchaseOrderItems.thicknessMm,
            filters.thicknessMm,
            thicknessMargin,
            filters.thicknessMmTo,
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
      quality:
        row.quality ?? inferArticleQuality(row.productCode, row.productName),
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
      unit: row.unit,
      articleUnit: row.articleUnit,
      quantityKg: Number(row.quantityKg ?? 0),
      // The line it is coming in on already states its weight; one piece is
      // that weight over the pieces still outstanding.
      pieceWeightKg:
        Number(row.quantity ?? 0) > 0 && Number(row.quantityKg ?? 0) > 0
          ? Number(row.quantityKg) / Number(row.quantity)
          : null,
      purchasingUnit: row.purchasingUnit,
      valuationPrice: Number(row.valuationPrice ?? 0),
      purchaseOrderId: row.purchaseOrderId,
      expectedDate: row.expectedDate ? toDateString(row.expectedDate) : null,
      unopened: true,
      receiptDate: null,
      supplierName: row.supplierName,
      purchasePrice: Number(row.valuationPrice ?? 0),
      purchasePriceUnit: row.purchasePriceUnit,
    }));
  };

  // 🔴 The article list itself, regardless of whether any of it exists.
  //
  // A **buying** document cannot search the shelf: the whole reason to raise a
  // purchase order is that the metal is not there. Selling searches `stock`,
  // buying searches this. Rows come back with nothing in them — no quantity, no
  // lot, no location — because there is nothing to report yet, and the variant
  // grid above then shows one row per article.
  const catalogue = async (): Promise<StockSearchLot[]> => {
    const rows = await db
      .select({
        uuid: Products.uuid,
        productUuid: Products.uuid,
        productCode: Products.productCode,
        productName: Products.name,
        quality: Products.featuresQuality,
        lengthMm: Products.length,
        widthMm: Products.widthDiameter,
        thicknessMm: Products.thickness,
        // 🔴 Everything a weight is derived from. A buying line is priced per
        // tonne, so an article that comes back from here without the means to
        // weigh it bills EUR 0,00 and nobody is told why.
        dimensionShape: Products.dimensionShape,
        featuresQuality: Products.featuresQuality,
        densityKgDm3: Products.densityKgDm3,
        length: Products.length,
        widthDiameter: Products.widthDiameter,
        thickness: Products.thickness,
        theoreticalThickness: Products.theoreticalThickness,
        weightTheoretical: Products.weightTheoretical,
        theoreticalWeight: Products.theoreticalWeight,
        weightUnit: Products.weightUnit,
        purchasingUnit: Products.purchasingUnit,
        stockUnit: Products.stockUnit,
      })
      .from(Products)
      .where(
        and(
          productCode ? like(Products.productCode, productCode) : undefined,
          searchCode ? like(Products.searchCode1, searchCode) : undefined,
          quality ? like(Products.featuresQuality, quality) : undefined,
          productGroup
            ? eq(Products.productGroupUuid, productGroup)
            : undefined,
          withinMargin(
            Products.length,
            filters.lengthMm,
            lengthMargin,
            filters.lengthMmTo,
          ),
          withinMargin(
            Products.widthDiameter,
            filters.widthMm,
            widthMargin,
            filters.widthMmTo,
          ),
          withinMargin(
            Products.thickness,
            filters.thicknessMm,
            thicknessMargin,
            filters.thicknessMmTo,
          ),
        ),
      )
      .orderBy(asc(Products.productCode))
      .limit(STOCK_SEARCH_LIMIT + 1);

    return rows.map((row) => ({
      uuid: row.uuid,
      productUuid: row.productUuid,
      productCode: row.productCode,
      productName: row.productName,
      locationName: null,
      quality:
        row.quality ?? inferArticleQuality(row.productCode, row.productName),
      charge: null,
      internalCharge: null,
      internalBatch: null,
      stockCategory: null,
      options: null,
      remark: null,
      lengthMm: row.lengthMm === null ? null : Math.round(Number(row.lengthMm)),
      widthMm: row.widthMm === null ? null : Math.round(Number(row.widthMm)),
      thicknessMm: row.thicknessMm,
      quantity: 0,
      reserved: 0,
      available: 0,
      unit: row.stockUnit,
      articleUnit: row.stockUnit,
      quantityKg: 0,
      pieceWeightKg: articlePieceWeightKg(row),
      purchasingUnit: row.purchasingUnit,
      valuationPrice: 0,
      purchaseOrderId: null,
      expectedDate: null,
      unopened: false,
      receiptDate: null,
      supplierName: null,
      purchasePrice: null,
      purchasePriceUnit: null,
    }));
  };

  const found =
    source === "purchase"
      ? await incoming()
      : source === "catalogue"
        ? await catalogue()
        : await shelf();
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
    const kgAvailable =
      lot.quantity > 0 ? (lot.quantityKg * lot.available) / lot.quantity : 0;
    const lengthM = (lot.quantity * (lot.lengthMm ?? 0)) / 1000;
    const existing = variants.get(key);
    if (existing) {
      existing.technical += lot.quantity;
      existing.reserved += lot.reserved;
      existing.available += lot.available;
      existing.kgTechnical += lot.quantityKg;
      existing.kgReserved += lot.quantityKg - kgAvailable;
      existing.kgAvailable += kgAvailable;
      existing.totalLengthM += lengthM;
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
      pieceWeightKg: lot.pieceWeightKg,
      purchasingUnit: lot.purchasingUnit,
      unit: lot.unit,
      articleUnit: lot.articleUnit,
      technical: lot.quantity,
      reserved: lot.reserved,
      available: lot.available,
      kgTechnical: lot.quantityKg,
      kgReserved: lot.quantityKg - kgAvailable,
      kgAvailable,
      totalLengthM: lengthM,
      lotCount: 1,
    });
  });

  return {
    // Most available first, as the reference orders it. On a catalogue search
    // every row is zero, so the tiebreak carries the whole ordering and it has
    // to be the code somebody is scanning for.
    variants: [...variants.values()].sort(
      (a, b) =>
        b.available - a.available ||
        (a.productCode ?? "").localeCompare(b.productCode ?? ""),
    ),
    lots,
    truncated,
  };
};

/**
 * The lower grid's tabs — the reference's `Voorraad` · `Inkoop` · `Interne
 * productie`. The third has never been seen holding anything and nothing here
 * produces rows for it yet, so it is offered and empty.
 */
export type StockWindowTab = "stock" | "purchase" | "internal_production";

export type StockWindowFilters = StockSearchFilters & {
  tab: StockWindowTab;
  /**
   * The reference's `Alleen artikelen met technische voorraad`, unticked by
   * default: the article grid lists the catalogue, on the shelf or not, until
   * somebody narrows it to what is physically there.
   */
  onlyWithTechnicalStock?: boolean;
};

export type StockWindowResult = {
  /** One row per article — or per article and quality where lots exist. */
  articles: StockSearchVariant[];
  /** The lots of the chosen tab, behind the articles above. */
  lots: StockSearchLot[];
  truncated: boolean;
};

/**
 * The `Voorraad` window as the reference draws it (captured 9-10-2026 from a
 * purchase order, and 21-9-2026 from a sales order — it is one window): the
 * article list above, grouped by quality where the shelf holds the article in
 * several, and the chosen tab's lots below. Two reads rather than one join,
 * because the article grid is the catalogue and the lot grid is whichever
 * supply the tab names; this database caps connections, so they run in turn.
 */
export const findStockWindow = async (
  filters: StockWindowFilters,
): Promise<StockWindowResult> => {
  const articles = await findSellableStock({
    ...filters,
    source: "catalogue",
    onlyWithPhysicalStock: false,
  });
  const supply =
    filters.tab === "internal_production"
      ? { variants: [], lots: [], truncated: false }
      : await findSellableStock({
          ...filters,
          source: filters.tab,
          onlyWithPhysicalStock: filters.tab === "stock",
        });

  // An article the tab holds is shown with that supply's figures, one row per
  // quality and category; an article it does not hold is one row of zeros.
  const held = new Set(supply.variants.map((variant) => variant.productUuid));
  const rows = [
    ...supply.variants,
    ...articles.variants.filter((variant) => !held.has(variant.productUuid)),
  ];
  const kept = filters.onlyWithTechnicalStock
    ? rows.filter((row) => row.technical > 0)
    : rows;

  return {
    articles: kept.sort(
      (a, b) =>
        b.available - a.available ||
        (a.productCode ?? "").localeCompare(b.productCode ?? ""),
    ),
    lots: supply.lots,
    truncated: articles.truncated || supply.truncated,
  };
};
