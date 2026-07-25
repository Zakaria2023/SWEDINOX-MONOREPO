"use server";

import { db } from "@/db";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { Batches, SelectBatches } from "@/db/schema/batches";
import {
  BatchCertificates,
  SelectBatchCertificates,
} from "@/db/schema/batch-certificates";
import { describeError } from "@/lib/helpers";
import { and, asc, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";

export type DeliveryCertificateMode = "certificate-received" | "missing-batch";

// Delivered sales line joined to the batch its stock came from and that batch's
// mill certificate. Shared by the "Sending certificates" and "Deliveries from
// the missing batch" overviews, which differ only in whether a received
// certificate is required (sending) or the batch link is absent (missing).
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
    const deliveredLines = inArray(OrderItems.status, ["delivered", "invoiced"]);
    const filter =
      mode === "certificate-received"
        ? and(deliveredLines, isNotNull(BatchCertificates.receivedDate))
        : and(deliveredLines, isNull(Batches.uuid));

    return await db
      .select({
        key: OrderItems.uuid,
        salesOrder: Orders.id,
        salesLine: OrderItems.lineNumber,
        customerCode: Companies.id,
        customerName: Companies.companyName,
        customerRef: Orders.customerRef,
        productCode: Products.productCode,
        productName: Products.name,
        deliveryDate: OrderItems.deliveryDate,
        billOfLading: BatchCertificates.billOfLading,
        lengthMm: OrderItems.lengthMm,
        widthMm: OrderItems.widthMm,
        qtyActual: OrderItems.qtyActual,
        unit: OrderItems.unit,
        kgActual: OrderItems.kgActual,
        charge: Batches.charge,
        internalCharge: Batches.internalCharge,
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
      .leftJoin(Batches, eq(OrderItems.stockUuid, Batches.stockUuid))
      .leftJoin(
        BatchCertificates,
        eq(Batches.uuid, BatchCertificates.batchUuid),
      )
      .where(filter)
      .orderBy(desc(Orders.id), asc(OrderItems.lineNumber));
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch delivery certificates"),
    );
  }
};

// Delivered lines whose mill certificate has arrived and can be sent to the
// customer.
export const getSendingCertificates = async (): Promise<
  DeliveryCertificateRow[]
> => getDeliveryCertificateRows("certificate-received");
