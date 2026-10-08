import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  date,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { certificaatOptions, receiptDocumentKinds } from "../../lib/enums";
import { Batches } from "./batches";
import { PurchaseOrders } from "./purchase-orders";
import { PurchaseOrderItems } from "./purchase-order-items";

// The mill certificate expected for a received batch, and whether it has
// actually arrived. Backs the "Certificates received" overview; a row with no
// `receivedDate` is a certificate still to be linked.
export const BatchCertificates = mysqlTable(
  "BatchCertificates",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // 🔴 Null until the goods arrive: a document entered on the purchase
    // order's `Product Receipt Documents` panel (C19) exists before the batch
    // it certifies. The receipt fills it in.
    batchUuid: char("batch_uuid", { length: 36 }),
    // `Soort` — DoP, Certificate or Other.
    kind: mysqlEnum("kind", receiptDocumentKinds).default("certificate"),
    // `Ontvangst regel`: the reception the document belongs to, when it is
    // tied to one rather than to the whole line.
    purchaseLineReceivalUuid: char("purchase_line_receival_uuid", {
      length: 36,
    }),
    purchaseOrderUuid: char("purchase_order_uuid", { length: 36 }),
    purchaseOrderItemUuid: char("purchase_order_item_uuid", { length: 36 }),

    // The purchase line the certified goods came in on, and the reference
    // printed on that line.
    purchaseLineNumber: int("purchase_line_number"),
    lineReference: varchar("line_reference", { length: 255 }),
    billOfLading: varchar("bill_of_lading", { length: 255 }),

    // Which certificate the goods were bought with, and the document itself.
    documentCertificate: mysqlEnum("document_certificate", certificaatOptions),
    documentCode: varchar("document_code", { length: 100 }),
    fileName: varchar("file_name", { length: 255 }),
    // "Mandatory, ignore document": the certificate is required, but the goods
    // may be released before the file is on hand.
    mandatoryIgnoreDocument: boolean("mandatory_ignore_document").default(
      false,
    ),
    producer: varchar("producer", { length: 255 }),

    // Null until the certificate actually arrives.
    receivedDate: date("received_date", { mode: "string" }),

    documents:
      json("documents").$type<Array<{ id: string; fileName: string }>>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_batch_certificates_batch_uuid").on(table.batchUuid),
    index("idx_batch_certificates_purchase_order_uuid").on(
      table.purchaseOrderUuid,
    ),
    index("idx_batch_certificates_purchase_order_item_uuid").on(
      table.purchaseOrderItemUuid,
    ),
    index("idx_batch_certificates_received_date").on(table.receivedDate),
    foreignKey({
      name: "fk_batch_certificates_batch",
      columns: [table.batchUuid],
      foreignColumns: [Batches.uuid],
    }),
    foreignKey({
      name: "fk_batch_certificates_purchase_order",
      columns: [table.purchaseOrderUuid],
      foreignColumns: [PurchaseOrders.uuid],
    }),
    foreignKey({
      name: "fk_batch_certificates_purchase_order_item",
      columns: [table.purchaseOrderItemUuid],
      foreignColumns: [PurchaseOrderItems.uuid],
    }),
  ],
);

export type SelectBatchCertificates = InferSelectModel<
  typeof BatchCertificates
>;
export type InsertBatchCertificates = InferInsertModel<
  typeof BatchCertificates
>;
