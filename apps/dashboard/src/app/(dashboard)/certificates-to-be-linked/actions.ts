"use server";

import { SelectBatchCertificates } from "@/db/schema/batch-certificates";
import { SelectCompanies } from "@/db/schema/companies";

export type CertificateToLinkRow = {
  key: string;
  createdOn: SelectBatchCertificates["createdAt"];
  adjustedOn: SelectBatchCertificates["updatedAt"];
  specification: SelectBatchCertificates["documentCode"];
  supplierName: SelectCompanies["companyName"] | null;
};

// The inbox of an electronic certificate exchange: certificate messages a
// supplier sent that still have to be linked to a received batch. Its columns
// in the reference say so — `Receive data`, `Invoked method`, `Retry possible`,
// `Last error message`, `User interaction required` — and it is empty there.
//
// No exchange is connected to this system, so there is nothing to list. It
// used to show every BatchCertificates row without a received date, which is
// not this screen: a certificate not yet received is not a message waiting to
// be linked (decision E3, 14-9-2026: keep the screen, say why it is empty).
export const getCertificatesToBeLinked = async (): Promise<
  CertificateToLinkRow[]
> => [];
