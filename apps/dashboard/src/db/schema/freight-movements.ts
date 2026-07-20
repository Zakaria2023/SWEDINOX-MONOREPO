import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  date,
  decimal,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { stockMovementReasons, stockUnits } from "../../lib/enums";
import { Products } from "./products";
import { RevenueGroups } from "./revenue-groups";
import { Companies } from "./companies";
import { Orders } from "./orders";
import { PurchaseOrders } from "./purchase-orders";
import { Charges } from "./charges";

// Freight movement — the goods-flow ledger behind the Logistics "Freight
// movement" overview. Each row is a single stock mutation carrying its
// running balances (starting/closing stock) and the accounting dimensions
// (general ledger, revenue group, charge) captured at mutation time.
export const FreightMovements = mysqlTable(
  "FreightMovements",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // "Mutation date / time" and the operator ("Mutation operator") who
    // triggered it.
    mutationDate: timestamp("mutation_date").notNull(),
    mutationOperator: varchar("mutation_operator", { length: 255 }),

    // Product being moved — backs the Product code, Description, Length (mm),
    // Width (mm), Standard product and Stock product columns via join.
    productUuid: char("product_uuid", { length: 36 }).notNull(),

    // "MutationQty" and the stock unit it is counted in ("StkU").
    mutationQuantity: decimal("mutation_quantity", {
      precision: 15,
      scale: 3,
    }).notNull(),
    stockUnit: mysqlEnum("stock_unit", stockUnits),

    // "Mutation reason" — reuses the stock-movement reason vocabulary.
    reason: mysqlEnum("reason", stockMovementReasons).notNull(),

    // "Internal charge" cost-centre code and the referenced work order.
    internalCharge: varchar("internal_charge", { length: 100 }),
    workOrderNumber: varchar("work_order_number", { length: 100 }),

    // Running-balance window: quantity and value of stock before ("Starting
    // stock") and after ("Closing stock") this mutation.
    startDate: date("start_date"),
    startingStockQty: decimal("starting_stock_qty", {
      precision: 15,
      scale: 3,
    }),
    startingStockValue: decimal("starting_stock_value", {
      precision: 15,
      scale: 2,
    }),
    endDate: date("end_date"),
    closingStockQty: decimal("closing_stock_qty", { precision: 15, scale: 3 }),
    closingStockValue: decimal("closing_stock_value", {
      precision: 15,
      scale: 2,
    }),

    // Accounting dimensions — "General ledger" account and the revenue group
    // this mutation posts to.
    generalLedger: varchar("general_ledger", { length: 50 }),
    revenueGroupUuid: char("revenue_group_uuid", { length: 36 }),

    // "Company" / "Company code" and the sales "Order" the movement serves.
    companyUuid: char("company_uuid", { length: 36 }),
    orderUuid: char("order_uuid", { length: 36 }),
    // Free-text remark shown in the "Text" column.
    text: varchar("text", { length: 255 }),
    // "Charge" reference.
    chargeUuid: char("charge_uuid", { length: 36 }),

    // Purchase side — the "Purchase order", "Receipt date" and "Supplier".
    purchaseOrderUuid: char("purchase_order_uuid", { length: 36 }),
    receiptDate: date("receipt_date"),
    supplierUuid: char("supplier_uuid", { length: 36 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_freight_movements_product_uuid").on(table.productUuid),
    index("idx_freight_movements_mutation_date").on(table.mutationDate),
    index("idx_freight_movements_revenue_group_uuid").on(
      table.revenueGroupUuid,
    ),
    index("idx_freight_movements_company_uuid").on(table.companyUuid),
    index("idx_freight_movements_order_uuid").on(table.orderUuid),
    index("idx_freight_movements_charge_uuid").on(table.chargeUuid),
    index("idx_freight_movements_purchase_order_uuid").on(
      table.purchaseOrderUuid,
    ),
    index("idx_freight_movements_supplier_uuid").on(table.supplierUuid),
    foreignKey({
      name: "fk_freight_movements_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_freight_movements_revenue_group",
      columns: [table.revenueGroupUuid],
      foreignColumns: [RevenueGroups.uuid],
    }),
    foreignKey({
      name: "fk_freight_movements_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_freight_movements_order",
      columns: [table.orderUuid],
      foreignColumns: [Orders.uuid],
    }),
    foreignKey({
      name: "fk_freight_movements_charge",
      columns: [table.chargeUuid],
      foreignColumns: [Charges.uuid],
    }),
    foreignKey({
      name: "fk_freight_movements_purchase_order",
      columns: [table.purchaseOrderUuid],
      foreignColumns: [PurchaseOrders.uuid],
    }),
    foreignKey({
      name: "fk_freight_movements_supplier",
      columns: [table.supplierUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectFreightMovements = InferSelectModel<typeof FreightMovements>;
export type InsertFreightMovements = InferInsertModel<typeof FreightMovements>;
