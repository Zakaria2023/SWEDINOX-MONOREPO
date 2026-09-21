import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  date,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
} from "drizzle-orm/mysql-core";
import {
  reservationStatuses,
  reservationTypes,
  stockUnits,
} from "../../lib/enums";
import { OrderItems } from "./order-items";
import { PurchaseOrderItems } from "./purchase-order-items";
import { Stock } from "./stock";

// A claim on one lot by one order line — the reference's `Reservations` screen,
// and specifically the panel behind its right-click `Toon reserveringen`.
//
// `Stock.reservedQuantity` already held the number. What it could not hold is
// *who*, and the reference's panel is a list rather than a field, so one lot can
// be spoken for by several lines at once:
//
//   Type  Status      Quantity  Unit  Order/line   Company           Date
//   Sale  Definitive        64  ST    O100742/50   Holland Dak Acc.  1-12-2025
//
// That row was read off product 6010015315 standing at location `Laad` on
// 10-9-2026, and it reconciles exactly with the same lot on the order's own
// Stock panel: 64 ST technical, 64 ST reserved, 1.190 Kg reserved, 0 available.
// So a reservation binds a **specific physical lot**, not a quantity of a
// product — the question this table was built to answer.
//
// The reference's panel offers `Order` and `Delete` and nothing else: a
// reservation is not edited, it is followed to its order or dropped.
export const Reservations = mysqlTable(
  "Reservations",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // The lot being held. Not the product — the reference titles the panel with
    // the location as well as the article ("Reservations Laad Aluminium plate
    // semi-rigid 1S"), and an empty panel on a different location of the same
    // product proves the two are counted apart.
    // 🔴 Nullable since 21-9-2026, and it has to be.
    //
    // Purchase order 401141's own Stock panel read `Qty(p) 100 · Qty(r) 90 ·
    // Available 10` while the metal was still at the mill, and the receipt then
    // handed the warehouseman exactly that 20/25/20/25 + 10 allocation to
    // confirm. So goods are committed to customers before any lot exists to
    // bind — the `Purchase` tab of the stock window is where that is done.
    //
    // **Exactly one of `stockUuid` and `purchaseOrderItemUuid` is set.** A hold
    // on the shelf names a lot; a hold on incoming supply names the purchase
    // line it is coming in on. Neither set is the `Temporary` case below, which
    // the reference also has — 5 of its 435 reservations hold metal with no
    // document behind them at all.
    stockUuid: char("stock_uuid", { length: 36 }).references(() => Stock.uuid, {
      onDelete: "cascade",
    }),

    // What is holding it, and it is polymorphic — the same shape as a stock
    // movement's cause. `O100742/50` is sales order 100742, line 50; a purchase
    // reservation names a `4xxxxx` purchase line instead.
    //
    // **Both are nullable, and exactly one is normally set.** Two independent
    // reasons, each from the reference's own 435-row export:
    //
    //   * 23 reservations are on the **purchase** side — a coil out at an
    //     external processor, held by the purchase order for the work.
    //   * 5 are `Temporary` and their `Order` column reads **0**. Somebody is
    //     holding metal with no document behind it at all, and a notNull column
    //     would make that unrecordable.
    orderItemUuid: char("order_item_uuid", { length: 36 }).references(
      () => OrderItems.uuid,
      { onDelete: "cascade" },
    ),
    purchaseOrderItemUuid: char("purchase_order_item_uuid", {
      length: 36,
    }).references(() => PurchaseOrderItems.uuid, { onDelete: "cascade" }),

    // `Company` on the panel is the customer behind that order line. It is not
    // stored: it is one join away and storing it would let the two disagree.
    type: mysqlEnum("type", reservationTypes).notNull().default("sale"),
    status: mysqlEnum("status", reservationStatuses)
      .notNull()
      .default("definitive"),

    // Held in the lot's own unit, which is why the unit travels with it — the
    // reference prints `64 ST` and the same reservation weighs 1.190 Kg.
    quantity: decimal("quantity", { precision: 15, scale: 3 })
      .notNull()
      .default("0.000"),
    unit: mysqlEnum("unit", stockUnits).notNull().default("st"),
    quantityKg: decimal("quantity_kg", { precision: 15, scale: 2 })
      .notNull()
      .default("0.00"),

    // `Date` on the panel — the delivery date of the line that is holding the
    // lot, and the reason a warehouse can tell a reservation that is about to
    // ship from one that has been sitting for a year.
    // A `Date`, not a string: it is copied straight from `Orders.deliveryDate`,
    // and the two disagreeing about their own type would be a trap.
    reservedFor: date("reserved_for"),

    // `Changed` on the panel, blank on the row that was read. Kept nullable
    // rather than defaulted so that blank stays blank.
    changedAt: timestamp("changed_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_reservations_stock_uuid").on(table.stockUuid),
    index("idx_reservations_order_item_uuid").on(table.orderItemUuid),
    index("idx_reservations_purchase_order_item_uuid").on(
      table.purchaseOrderItemUuid,
    ),
    index("idx_reservations_reserved_for").on(table.reservedFor),
  ],
);

export type SelectReservations = InferSelectModel<typeof Reservations>;
export type InsertReservations = InferInsertModel<typeof Reservations>;
