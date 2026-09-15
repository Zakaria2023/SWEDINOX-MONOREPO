"use server";

import { db } from "@/db";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { Batches, SelectBatches } from "@/db/schema/batches";
import { StockBatches } from "@/db/schema/stock-batches";
import {
  BatchCertificates,
  SelectBatchCertificates,
} from "@/db/schema/batch-certificates";
import {
  WarehouseWorkOrderLines,
  WarehouseWorkOrderPicks,
} from "@/db/schema/warehouse-work-orders";
import { describeError } from "@/lib/helpers";
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
} from "drizzle-orm";

export type DeliveryCertificateMode = "certificate-received" | "missing-batch";

// A delivered sales line, once per batch it was picked from, with that batch's
// mill certificate. Shared by the "Sending certificates" and "Deliveries from
// the missing batch" overviews.
export type DeliveryCertificateRow = {
  key: string;
  salesOrder: SelectOrders["id"];
  salesLine: SelectOrderItems["lineNumber"];
  customerCode: SelectCompanies["id"] | null;
  customerName: SelectCompanies["companyName"] | null;
  customerRef: SelectOrders["customerRef"];
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  deliveryDate: SelectOrderItems["deliveryDate"];
  billOfLading: SelectBatchCertificates["billOfLading"] | null;
  lengthMm: SelectOrderItems["lengthMm"];
  widthMm: SelectOrderItems["widthMm"];
  qtyActual: SelectOrderItems["qtyActual"];
  unit: SelectOrderItems["unit"];
  kgActual: SelectOrderItems["kgActual"];
  charge: SelectBatches["charge"] | null;
  internalCharge: SelectBatches["internalCharge"] | null;
  sheetNumber: SelectBatches["sheetNumber"] | null;
  purchaseOrder: SelectBatches["purchaseOrderCode"] | null;
  receiptDate: SelectBatches["receiptDate"] | null;
  documentCode: SelectBatchCertificates["documentCode"] | null;
  fileName: SelectBatchCertificates["fileName"] | null;
  mandatoryIgnoreDocument:
    | SelectBatchCertificates["mandatoryIgnoreDocument"]
    | null;
  deliveryStatus: SelectOrderItems["deliveryStatus"];
  options: SelectOrderItems["options"];
  thicknessMm: SelectOrderItems["thicknessMm"];
  stockCategory: SelectBatches["stockCategory"] | null;
  qualityCode: SelectBatches["qualityCode"] | null;
  documentCertificate: SelectBatchCertificates["documentCertificate"] | null;
  producer: SelectBatches["producer"] | null;
};

export const getDeliveryCertificateRows = async (
  mode: DeliveryCertificateMode,
): Promise<DeliveryCertificateRow[]> => {
  try {
    // The lot a line actually shipped from is the one its warehouse pick drew
    // on — 145 of the reference's 1 831 sales lines left from two to five
    // batches. A line never picked through a work order falls back to the lot
    // it was reserved against.
    const shippedLot = sql`COALESCE(${WarehouseWorkOrderPicks.stockUuid}, ${OrderItems.stockUuid})`;
    // The pick carries the internal charge too, so a lot with no Batches row
    // still traces.
    const tracedCharge = or(
      isNotNull(Batches.uuid),
      isNotNull(WarehouseWorkOrderPicks.internalCharge),
    );

    const deliveredLines = inArray(OrderItems.status, ["delivered", "invoiced"]);
    // "Sending certificates" is every delivered line that traces to a batch,
    // certificate or not: the reference lists 3 271 such rows and not one has a
    // certificate document. "Missing batch" is a delivered line that traces to
    // none — correctly empty in the reference.
    const filter =
      mode === "certificate-received"
        ? and(deliveredLines, tracedCharge)
        : and(
            deliveredLines,
            isNull(Batches.uuid),
            isNull(WarehouseWorkOrderPicks.internalCharge),
          );

    const rows = await db
      .select({
        // One row per pick per batch in the lot it drew on.
        key: sql<string>`CONCAT(COALESCE(${WarehouseWorkOrderPicks.uuid}, ${OrderItems.uuid}), '-', COALESCE(${Batches.uuid}, ''))`,
        salesOrder: Orders.id,
        salesLine: OrderItems.lineNumber,
        customerCode: Companies.id,
        customerName: Companies.companyName,
        customerRef: Orders.customerRef,
        productCode: Products.productCode,
        productName: Products.name,
        deliveryDate: OrderItems.deliveryDate,
        lengthMm: OrderItems.lengthMm,
        widthMm: OrderItems.widthMm,
        // A picked row reports what came out of that lot, not the whole line.
        qtyActual: sql<
          SelectOrderItems["qtyActual"]
        >`COALESCE(${WarehouseWorkOrderPicks.qtyActual}, ${OrderItems.qtyActual})`,
        unit: OrderItems.unit,
        kgActual: sql<
          SelectOrderItems["kgActual"]
        >`COALESCE(${WarehouseWorkOrderPicks.kgActual}, ${OrderItems.kgActual})`,
        charge: sql<
          SelectBatches["charge"]
        >`COALESCE(${Batches.charge}, ${WarehouseWorkOrderPicks.charge})`,
        internalCharge: sql<
          SelectBatches["internalCharge"]
        >`COALESCE(${Batches.internalCharge}, ${WarehouseWorkOrderPicks.internalCharge})`,
        sheetNumber: Batches.sheetNumber,
        purchaseOrder: Batches.purchaseOrderCode,
        receiptDate: Batches.receiptDate,
        documentCode: BatchCertificates.documentCode,
        fileName: BatchCertificates.fileName,
        mandatoryIgnoreDocument: BatchCertificates.mandatoryIgnoreDocument,
        deliveryStatus: OrderItems.deliveryStatus,
        options: OrderItems.options,
        thicknessMm: OrderItems.thicknessMm,
        stockCategory: Batches.stockCategory,
        qualityCode: Batches.qualityCode,
        documentCertificate: BatchCertificates.documentCertificate,
        producer: Batches.producer,
      })
      .from(OrderItems)
      .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .leftJoin(
        WarehouseWorkOrderLines,
        eq(WarehouseWorkOrderLines.orderItemUuid, OrderItems.uuid),
      )
      .leftJoin(
        WarehouseWorkOrderPicks,
        and(
          eq(WarehouseWorkOrderPicks.workOrderLineUuid, WarehouseWorkOrderLines.uuid),
          isNotNull(WarehouseWorkOrderPicks.stockUuid),
        ),
      )
      // A lot can hold several batches (the reference's `STOCKBATCH`), so the
      // lot is traced through the link table, not `Batches.stockUuid`.
      .leftJoin(StockBatches, eq(StockBatches.stockUuid, shippedLot))
      .leftJoin(Batches, eq(Batches.uuid, StockBatches.batchUuid))
      .leftJoin(
        BatchCertificates,
        eq(Batches.uuid, BatchCertificates.batchUuid),
      )
      .where(filter)
      .orderBy(desc(Orders.id), asc(OrderItems.lineNumber));

    return rows.map((row) => ({
      ...row,
      // The reference prints the *sales* bill of lading here (`301005`, the
      // trip series); the certificate's is the supplier's. No sales bill of
      // lading is recorded on a delivery yet, so none is shown rather than the
      // wrong one.
      billOfLading: null,
    }));
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch delivery certificates"),
    );
  }
};

// Delivered lines that trace to a batch, ready to have their certificate sent.
export const getSendingCertificates = async (): Promise<
  DeliveryCertificateRow[]
> => getDeliveryCertificateRows("certificate-received");
