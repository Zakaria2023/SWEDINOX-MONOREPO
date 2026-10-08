"use server";

import { db } from "@/db";
import {
  BatchCertificates,
  SelectBatchCertificates,
} from "@/db/schema/batch-certificates";
import { Batches, SelectBatches } from "@/db/schema/batches";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import {
  certificateIsMandatory,
  describeError,
  generateUuid,
  requiredCertificateFor,
  resolveCertificateFromOptions,
  todayDateString,
} from "@/lib/helpers";
import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type CertificateRow = SelectBatchCertificates & {
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  supplierCode: SelectCompanies["id"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  receiptDate: SelectBatches["receiptDate"] | null;
  internalCharge: SelectBatches["internalCharge"] | null;
  charge: SelectBatches["charge"] | null;
  sheetNumber: SelectBatches["sheetNumber"] | null;
  stockCategory: SelectBatches["stockCategory"] | null;
  qualityCode: SelectBatches["qualityCode"] | null;
  options: SelectBatches["options"] | null;
  lengthMm: SelectBatches["lengthMm"] | null;
  widthMm: SelectBatches["widthMm"] | null;
  thicknessMm: SelectBatches["thicknessMm"] | null;
  qty: SelectBatches["qty"] | null;
  unit: SelectBatches["unit"] | null;
  kg: SelectBatches["kg"] | null;
};

export type CertificateActionResult = {
  error?: string;
  success?: boolean;
  createdCertificates?: number;
};

export type CertificateDetail = CertificateRow & {
  batchId: SelectBatches["id"] | null;
  producerOnBatch: SelectBatches["producer"] | null;
};

// Every expected certificate with the batch it belongs to, that batch's
// purchase order, supplier and product.
export const getCertificatesReceived = async (): Promise<CertificateRow[]> => {
  try {
    const rows = await db
      .select({
        certificate: BatchCertificates,
        purchaseOrderId: PurchaseOrders.id,
        supplierCode: Companies.id,
        supplierName: Companies.companyName,
        productCode: Products.productCode,
        productName: Products.name,
        receiptDate: Batches.receiptDate,
        internalCharge: Batches.internalCharge,
        charge: Batches.charge,
        sheetNumber: Batches.sheetNumber,
        stockCategory: Batches.stockCategory,
        qualityCode: Batches.qualityCode,
        options: Batches.options,
        lengthMm: Batches.lengthMm,
        widthMm: Batches.widthMm,
        thicknessMm: Batches.thicknessMm,
        qty: Batches.qty,
        unit: Batches.unit,
        kg: Batches.kg,
      })
      .from(BatchCertificates)
      .innerJoin(Batches, eq(BatchCertificates.batchUuid, Batches.uuid))
      .leftJoin(
        PurchaseOrders,
        eq(BatchCertificates.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(Companies, eq(Batches.supplierUuid, Companies.uuid))
      .leftJoin(Products, eq(Batches.productUuid, Products.uuid))
      .orderBy(desc(Batches.receiptDate), asc(Batches.internalCharge));

    return rows.map((row) => ({
      ...row.certificate,
      purchaseOrderId: row.purchaseOrderId,
      supplierCode: row.supplierCode,
      supplierName: row.supplierName,
      productCode: row.productCode,
      productName: row.productName,
      receiptDate: row.receiptDate,
      internalCharge: row.internalCharge,
      charge: row.charge,
      sheetNumber: row.sheetNumber,
      stockCategory: row.stockCategory,
      qualityCode: row.qualityCode,
      options: row.options,
      lengthMm: row.lengthMm,
      widthMm: row.widthMm,
      thicknessMm: row.thicknessMm,
      qty: row.qty,
      unit: row.unit,
      kg: row.kg,
    }));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch certificates"));
  }
};

/**
 * One certificate with the batch it belongs to and that batch's purchase order,
 * supplier and product — everything needed to tell which shipment the document
 * covers.
 */
export const getCertificateDetail = async (
  uuid: string,
): Promise<CertificateDetail | null> => {
  const [row] = await db
    .select({
      certificate: BatchCertificates,
      batchId: Batches.id,
      purchaseOrderId: PurchaseOrders.id,
      supplierCode: Companies.id,
      supplierName: Companies.companyName,
      productCode: Products.productCode,
      productName: Products.name,
      receiptDate: Batches.receiptDate,
      internalCharge: Batches.internalCharge,
      charge: Batches.charge,
      sheetNumber: Batches.sheetNumber,
      stockCategory: Batches.stockCategory,
      qualityCode: Batches.qualityCode,
      options: Batches.options,
      producerOnBatch: Batches.producer,
      lengthMm: Batches.lengthMm,
      widthMm: Batches.widthMm,
      thicknessMm: Batches.thicknessMm,
      qty: Batches.qty,
      unit: Batches.unit,
      kg: Batches.kg,
    })
    .from(BatchCertificates)
    .innerJoin(Batches, eq(BatchCertificates.batchUuid, Batches.uuid))
    .leftJoin(
      PurchaseOrders,
      eq(BatchCertificates.purchaseOrderUuid, PurchaseOrders.uuid),
    )
    .leftJoin(Companies, eq(Batches.supplierUuid, Companies.uuid))
    .leftJoin(Products, eq(Batches.productUuid, Products.uuid))
    .where(eq(BatchCertificates.uuid, uuid))
    .limit(1);

  if (!row) {
    return null;
  }

  const { certificate, ...joined } = row;

  return { ...certificate, ...joined };
};

// Opens the certificate every registered batch is owed.
//
// Which certificate is owed comes from the article and from the options the
// purchase line was ordered under. A CE-marked product needs its 3.1 whatever
// the line said; otherwise the processing options name the certificate directly,
// so a line bought with a 3.1 gets a 3.1 and everything else gets the 2.1
// declaration that always accompanies the goods. A 3.1 already promised is
// never downgraded. The purchase line number, its reference and the
// order's own reference (used as the bill of lading) are carried across so the
// certificate can be matched to the shipment it arrived with.
//
// The certificate starts as outstanding — `receivedDate` is empty until the
// document actually turns up and is marked received.
//
// Batches that already have a certificate are skipped, so it can be re-run.
export const generateCertificates =
  async (): Promise<CertificateActionResult> => {
    try {
      const batches = await db
        .select({
          batch: Batches,
          lineNumber: PurchaseOrderItems.lineNumber,
          lineOptions: PurchaseOrderItems.options,
          orderReference: PurchaseOrders.reference,
          orderInternalReference: PurchaseOrders.internalReference,
          // What the article itself is held to. A CE-marked product may not
          // leave without its inspection certificate — the certificate is part
          // of what makes the marking true.
          ceStandard: Products.ce,
          productCertificate: Products.certificaat,
        })
        .from(Batches)
        .leftJoin(
          PurchaseOrderItems,
          eq(Batches.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
        )
        .leftJoin(
          PurchaseOrders,
          eq(Batches.purchaseOrderUuid, PurchaseOrders.uuid),
        )
        .leftJoin(Products, eq(Batches.productUuid, Products.uuid));

      if (batches.length === 0) {
        return {
          error: "No batches yet. Register them on /batches first.",
        };
      }

      const certified = new Set(
        (
          await db
            .select({ batchUuid: BatchCertificates.batchUuid })
            .from(BatchCertificates)
        ).map((row) => row.batchUuid),
      );

      const openBatches = batches.filter(
        (row) => !certified.has(row.batch.uuid),
      );
      if (openBatches.length === 0) {
        return { error: "Every batch already has a certificate." };
      }

      const rows = openBatches.map((row) => ({
        uuid: generateUuid(),
        batchUuid: row.batch.uuid,
        purchaseOrderUuid: row.batch.purchaseOrderUuid,
        purchaseOrderItemUuid: row.batch.purchaseOrderItemUuid,
        purchaseLineNumber: row.lineNumber,
        lineReference: row.orderInternalReference,
        billOfLading: row.orderReference,
        documentCertificate: requiredCertificateFor({
          ceStandard: row.ceStandard,
          productCertificate: row.productCertificate,
          orderedCertificate: resolveCertificateFromOptions(
            row.lineOptions ?? row.batch.options,
          ),
        }),
        producer: row.batch.producer,
        // Goods under a CE standard are held until the document is on hand;
        // everything else is outstanding but travels without it. This was
        // hard-coded true, so nothing was ever held for its paperwork.
        mandatoryIgnoreDocument: !certificateIsMandatory(row.ceStandard),
      }));

      await db.insert(BatchCertificates).values(rows);

      revalidatePath("/certificates-received");
      return { success: true, createdCertificates: rows.length };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate certificates",
      };
    }
  };

// Records that the certificate document has arrived: it is stamped with today's
// date, the batch picks up the same document details, and the goods no longer
// move on without it.
export const markCertificateReceived = async (
  certificateUuid: string,
  documentCode: string,
  fileName: string,
): Promise<CertificateActionResult> => {
  const trimmedCode = documentCode.trim();
  const trimmedFileName = fileName.trim();

  if (trimmedCode === "" || trimmedFileName === "") {
    return { error: "Both a document code and a file name are required." };
  }

  try {
    const [certificate] = await db
      .select()
      .from(BatchCertificates)
      .where(eq(BatchCertificates.uuid, certificateUuid))
      .limit(1);

    if (!certificate) {
      return { error: "Certificate not found." };
    }
    if (certificate.receivedDate) {
      return { error: "This certificate has already been received." };
    }

    const receivedDate = todayDateString();

    await db.transaction(async (tx) => {
      await tx
        .update(BatchCertificates)
        .set({
          documentCode: trimmedCode,
          fileName: trimmedFileName,
          receivedDate,
          mandatoryIgnoreDocument: false,
        })
        .where(eq(BatchCertificates.uuid, certificateUuid));

      // The batch overview prints the certificate alongside the goods, so keep
      // the two in step — once there is a batch: a document entered on the
      // purchase order before the goods arrived has none yet (C19).
      if (certificate.batchUuid) {
        await tx
          .update(Batches)
          .set({
            documentCode: trimmedCode,
            fileName: trimmedFileName,
            documentCertificate: certificate.documentCertificate,
            mandatoryIgnoreDocument: false,
          })
          .where(eq(Batches.uuid, certificate.batchUuid));
      }
    });

    revalidatePath("/certificates-received");
    revalidatePath("/batches");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to mark the certificate received",
    };
  }
};
