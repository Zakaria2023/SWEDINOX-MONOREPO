"use server";

import {
  DeliveryCertificateRow,
  getDeliveryCertificateRows,
} from "@/app/(dashboard)/sending-certificates/actions";

// Delivered lines whose stock has no linked batch — the batch (and therefore
// its certificate) is missing.
export const getDeliveriesFromMissingBatch = async (): Promise<
  DeliveryCertificateRow[]
> => getDeliveryCertificateRows("missing-batch");
