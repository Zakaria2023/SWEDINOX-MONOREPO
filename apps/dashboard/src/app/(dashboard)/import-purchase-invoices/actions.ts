"use server";

// One row of the electronic purchase-invoice import queue.
export type ImportPurchaseInvoiceRow = {
  key: string;
  createdOn: Date;
  adjustedOn: Date;
  specification: string | null;
  invoiceStatus: string | null;
  invoiceNo: string | null;
  supplierName: string | null;
};

// The "Import purchase invoices" screen is the queue of incoming electronic
// purchase-invoice messages (e-invoices to be processed into purchase invoices),
// with their exchange status — invoked method, retries, errors, data
// sent/received, user interaction. That messaging/import subsystem is not
// modelled in this system, so there is no source to list yet. Finalized purchase
// invoices already have their own overview (/purchase-invoices), so this screen
// deliberately does not re-list them.
export const getImportPurchaseInvoices = async (): Promise<
  ImportPurchaseInvoiceRow[]
> => [];
