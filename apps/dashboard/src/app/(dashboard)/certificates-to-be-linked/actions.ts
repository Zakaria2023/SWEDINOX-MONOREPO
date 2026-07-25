"use server";

import { db } from "@/db";
import {
  BatchCertificates,
  SelectBatchCertificates,
} from "@/db/schema/batch-certificates";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { describeError } from "@/lib/helpers";
import { desc, eq, isNull } from "drizzle-orm";

export type CertificateToLinkRow = {
  key: string;
  createdOn: SelectBatchCertificates["createdAt"];
  adjustedOn: SelectBatchCertificates["updatedAt"];
  specification: SelectBatchCertificates["documentCode"];
  supplierName: SelectCompanies["companyName"] | null;
};

// Certificates that have arrived but aren't linked to a batch yet — a
// BatchCertificates row with no receivedDate. The legacy screen also shows the
// electronic certificate-exchange message status (invoked method, retries,
// errors, data sent/received, user interaction), an integration layer this
// system does not model, so those columns have no source.
export const getCertificatesToBeLinked = async (): Promise<
  CertificateToLinkRow[]
> => {
  try {
    return await db
      .select({
        key: BatchCertificates.uuid,
        createdOn: BatchCertificates.createdAt,
        adjustedOn: BatchCertificates.updatedAt,
        specification: BatchCertificates.documentCode,
        supplierName: Companies.companyName,
      })
      .from(BatchCertificates)
      .leftJoin(
        PurchaseOrders,
        eq(BatchCertificates.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
      .where(isNull(BatchCertificates.receivedDate))
      .orderBy(desc(BatchCertificates.createdAt));
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch certificates to be linked"),
    );
  }
};
