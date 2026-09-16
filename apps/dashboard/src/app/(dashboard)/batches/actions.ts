"use server";

import { BATCH_COLUMNS } from "@/app/(dashboard)/batches/columns";
import {
  adjustChargeSchema,
  AdjustChargeValues,
} from "@/app/(dashboard)/batches/validation";
import { db } from "@/db";
import {
  BatchCertificates,
  SelectBatchCertificates,
} from "@/db/schema/batch-certificates";
import { Batches, SelectBatches } from "@/db/schema/batches";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { SelectStock, Stock } from "@/db/schema/stock";
import { StockBatches } from "@/db/schema/stock-batches";
import { requireAuth } from "@/lib/auth";
import { describeError, normaliseCharge } from "@/lib/helpers";
import { exportRows } from "@/lib/server/excel";
import {
  booleanFilter,
  dateRangeFilter,
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
import { and, asc, count, desc, eq, inArray, isNotNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const BATCH_SEARCH = [
  Batches.internalCharge,
  Batches.charge,
  Batches.purchaseOrderCode,
  Products.productCode,
  Companies.companyName,
] as const;

const BATCH_FILTERS: FilterBindings = {
  receiptDate: dateRangeFilter(Batches.receiptDate),
  supplier: relationFilter(Batches.supplierUuid),
  product: relationFilter(Batches.productUuid),
  mandatoryIgnoreDocument: booleanFilter(Batches.mandatoryIgnoreDocument),
};

const BATCH_SORTABLE: SortableColumns = {
  purchaseOrder: Batches.purchaseOrderCode,
  supplier: Companies.companyName,
  productCode: Products.productCode,
  internalCharge: Batches.internalCharge,
  receiptDate: Batches.receiptDate,
  kg: Batches.kg,
};

export type BatchRow = SelectBatches & {
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  supplierCode: SelectCompanies["id"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export type BatchCertificateRow = Pick<
  SelectBatchCertificates,
  | "uuid"
  | "documentCertificate"
  | "documentCode"
  | "fileName"
  | "billOfLading"
  | "producer"
  | "receivedDate"
  | "mandatoryIgnoreDocument"
  | "documents"
>;

export type BatchStockRow = Pick<
  SelectStock,
  | "uuid"
  | "status"
  | "quantity"
  | "reservedQuantity"
  | "unit"
  | "charge"
  | "internalCharge"
  | "locationUuid"
>;

export type BatchDetail = BatchRow & {
  certificates: BatchCertificateRow[];
  stock: BatchStockRow | null;
};

export type BatchActionResult = {
  error?: string;
  success?: boolean;
};

export type AdjustBatchChargeInput = AdjustChargeValues & {
  batchUuid: string;
};

export type InternalChargeOption = {
  value: string;
  label: string;
};

const batchRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<BatchRow[]> => {
    const rows = await db
      .select({
        batch: Batches,
        purchaseOrderId: PurchaseOrders.id,
        supplierCode: Companies.id,
        supplierName: Companies.companyName,
        productCode: Products.productCode,
        productName: Products.name,
      })
      .from(Batches)
      .leftJoin(
        PurchaseOrders,
        eq(Batches.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(Companies, eq(Batches.supplierUuid, Companies.uuid))
      .leftJoin(Products, eq(Batches.productUuid, Products.uuid))
      .where(
        tableWhere({ query, search: BATCH_SEARCH, filters: BATCH_FILTERS }),
      )
      .orderBy(
        ...tableOrderBy(
          BATCH_SORTABLE,
          query,
          [desc(Batches.receiptDate), asc(Batches.internalCharge)],
          Batches.id,
        ),
      )
      .limit(limit)
      .offset(offset);

    return rows.map((row) => ({
      ...row.batch,
      purchaseOrderId: row.purchaseOrderId,
      supplierCode: row.supplierCode,
      supplierName: row.supplierName,
      productCode: row.productCode,
      productName: row.productName,
    }));
  };

/**
 * Every batch row: one per receipt, and one more for every processing output
 * booked back into stock under the same internal charge — the reference's
 * 2 910 rows against 2 226 receipts.
 */
export const getBatches = async (
  query: TableQuery,
): Promise<Paged<BatchRow>> => {
  try {
    return await runPaged(query, {
      rows: batchRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(Batches)
          .leftJoin(Companies, eq(Batches.supplierUuid, Companies.uuid))
          .leftJoin(Products, eq(Batches.productUuid, Products.uuid))
          .where(
            tableWhere({ query, search: BATCH_SEARCH, filters: BATCH_FILTERS }),
          );
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch batches"));
  }
};

export const exportBatches = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Batches",
    columns: BATCH_COLUMNS,
    columnKeys,
    rows: batchRows(parseTableQuery(params)),
  });

/**
 * One batch with its full traceability: the purchase order and supplier it
 * arrived on, the product, the certificates expected or received against it, and
 * the stock lot it became.
 */
export const getBatchDetail = async (
  uuid: string,
): Promise<BatchDetail | null> => {
  const [row] = await db
    .select({
      batch: Batches,
      purchaseOrderId: PurchaseOrders.id,
      supplierCode: Companies.id,
      supplierName: Companies.companyName,
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(Batches)
    .leftJoin(PurchaseOrders, eq(Batches.purchaseOrderUuid, PurchaseOrders.uuid))
    .leftJoin(Companies, eq(Batches.supplierUuid, Companies.uuid))
    .leftJoin(Products, eq(Batches.productUuid, Products.uuid))
    .where(eq(Batches.uuid, uuid))
    .limit(1);

  if (!row) {
    return null;
  }

  const certificates = await db
    .select({
      uuid: BatchCertificates.uuid,
      documentCertificate: BatchCertificates.documentCertificate,
      documentCode: BatchCertificates.documentCode,
      fileName: BatchCertificates.fileName,
      billOfLading: BatchCertificates.billOfLading,
      producer: BatchCertificates.producer,
      receivedDate: BatchCertificates.receivedDate,
      mandatoryIgnoreDocument: BatchCertificates.mandatoryIgnoreDocument,
      documents: BatchCertificates.documents,
    })
    .from(BatchCertificates)
    .where(eq(BatchCertificates.batchUuid, uuid))
    .orderBy(desc(BatchCertificates.receivedDate));

  // A batch registered before its stock lot existed carries no stockUuid, so
  // there is nothing to look up rather than a lot that is merely missing.
  const [stock] = row.batch.stockUuid
    ? await db
        .select({
          uuid: Stock.uuid,
          status: Stock.status,
          quantity: Stock.quantity,
          reservedQuantity: Stock.reservedQuantity,
          unit: Stock.unit,
          charge: Stock.charge,
          internalCharge: Stock.internalCharge,
          locationUuid: Stock.locationUuid,
        })
        .from(Stock)
        .where(eq(Stock.uuid, row.batch.stockUuid))
        .limit(1)
    : [];

  return {
    ...row.batch,
    purchaseOrderId: row.purchaseOrderId,
    supplierCode: row.supplierCode,
    supplierName: row.supplierName,
    productCode: row.productCode,
    productName: row.productName,
    certificates,
    stock: stock ?? null,
  };
};

/**
 * The internal charges `Adjust charge…` can move a batch under — every other
 * one already issued. The reference's field is not typed: a `Select` button
 * picks an existing charge, so two batches that are really one heat can be
 * joined, but a new number cannot be invented here.
 */
export const getInternalChargeOptions = async (
  batchUuid: string,
): Promise<InternalChargeOption[]> => {
  await requireAuth();
  const [batch] = await db
    .select({ internalCharge: Batches.internalCharge })
    .from(Batches)
    .where(eq(Batches.uuid, batchUuid))
    .limit(1);

  const rows = await db
    .selectDistinct({ internalCharge: Batches.internalCharge })
    .from(Batches)
    .where(
      and(
        isNotNull(Batches.internalCharge),
        batch?.internalCharge
          ? ne(Batches.internalCharge, batch.internalCharge)
          : undefined,
      ),
    )
    .orderBy(desc(Batches.internalCharge));

  return rows.flatMap((row) =>
    row.internalCharge
      ? [{ value: row.internalCharge, label: row.internalCharge }]
      : [],
  );
};

/**
 * `Adjust charge…`: correct a batch's heat number and sheet number after the
 * fact, and optionally move it under another existing internal charge.
 *
 * The lots holding the batch carry the same identity on their labels, so they
 * change with it — but only the lots that still show the batch's old identity,
 * never a lot that combines this batch with others under a charge of its own.
 */
export const adjustBatchCharge = async (
  _prevState: BatchActionResult,
  input: AdjustBatchChargeInput,
): Promise<BatchActionResult> => {
  await requireAuth();
  const parsed = adjustChargeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the fields and try again",
    };
  }

  try {
    const [batch] = await db
      .select({
        uuid: Batches.uuid,
        charge: Batches.charge,
        sheetNumber: Batches.sheetNumber,
        internalCharge: Batches.internalCharge,
      })
      .from(Batches)
      .where(eq(Batches.uuid, input.batchUuid))
      .limit(1);

    if (!batch) {
      return { error: "Batch not found." };
    }

    const newInternalCharge = parsed.data.internalCharge || batch.internalCharge;
    if (newInternalCharge && newInternalCharge !== batch.internalCharge) {
      const [exists] = await db
        .select({ uuid: Batches.uuid })
        .from(Batches)
        .where(eq(Batches.internalCharge, newInternalCharge))
        .limit(1);
      if (!exists) {
        return {
          error: "Choose an internal charge that already exists.",
        };
      }
    }

    const charge = normaliseCharge(parsed.data.charge);
    const sheetNumber = parsed.data.sheetNumber.trim() || null;

    await db.transaction(async (tx) => {
      await tx
        .update(Batches)
        .set({ charge, sheetNumber, internalCharge: newInternalCharge })
        .where(eq(Batches.uuid, batch.uuid));

      const lotUuids = (
        await tx
          .select({ stockUuid: StockBatches.stockUuid })
          .from(StockBatches)
          .where(eq(StockBatches.batchUuid, batch.uuid))
      ).map((link) => link.stockUuid);

      if (lotUuids.length > 0 && batch.internalCharge) {
        await tx
          .update(Stock)
          .set({ charge, plateNumber: sheetNumber, internalCharge: newInternalCharge })
          .where(
            and(
              inArray(Stock.uuid, lotUuids),
              eq(Stock.internalCharge, batch.internalCharge),
            ),
          );
      }
    });
  } catch (error) {
    return { error: describeError(error, "Failed to adjust the charge") };
  }

  revalidatePath("/batches");
  revalidatePath(`/batches/${input.batchUuid}`);
  return { success: true };
};
