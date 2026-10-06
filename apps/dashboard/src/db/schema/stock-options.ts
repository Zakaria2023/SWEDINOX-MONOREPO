import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";
import { stockOptions, stockOptionStatuses } from "../../lib/enums";
import { Products } from "./products";
import { Stock } from "./stock";

/**
 * What has been — or can be — done to metal, as rows.
 *
 * 🔴 This is the biggest model change the 5-10-2026 lot capture forced. We held
 * a lot's options as `Stock.options`, a single `varchar`. The reference's
 * `Voorraad opties` is a grid of three columns:
 *
 *   Optie            Specificatie     Status
 *   2.1 Certificate  …                …
 *
 * A text column cannot carry a specification, cannot say whether the work is
 * outstanding, and cannot hold two options at once without inventing a
 * separator that nothing validates.
 *
 * **There are two different lists, and that is why one table serves both.**
 * The reference shows the same grid in two places:
 *
 *   * on the **product**, every row `Possible` — what this article *can* have
 *     done to it. The capture read six there: Duplo, Decoilen, Grinding,
 *     Brushing, ShearCut, Laser Foil.
 *   * on the **lot**, what has actually been done to *these pieces*. The
 *     capture read fourteen in that dropdown, and the two lists barely overlap.
 *
 * So exactly one of `productUuid` and `stockUuid` is set. A row against a
 * product is a capability; a row against a lot is a fact about metal.
 *
 * 🔑 **`certificate_2_1` is one of the options**, which resolves a
 * contradiction that was going to be chased across 2.910 batch rows: every
 * certificate column on the batch screens is empty because the certificate was
 * never recorded there. EN 10204 2.1 is a declaration of compliance — a thing
 * you ask for, not a file you attach — and the reference models it exactly that
 * way.
 *
 * ⚠️ `option` is an enum of nineteen members read off two dropdowns that were
 * **both still scrolling**. It is a floor, not a ceiling; expect to add to it.
 */
export const StockOptions = mysqlTable(
  "StockOptions",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // Exactly one of these two is set — see the note above. Neither is
    // `notNull`, because either shape is legal; both set, or neither, is
    // refused by the action rather than by the column.
    stockUuid: char("stock_uuid", { length: 36 }),
    productUuid: char("product_uuid", { length: 36 }),

    option: mysqlEnum("option", stockOptions).notNull(),

    // `Specificatie` — a second dropdown beside the option on the reference's
    // `Toevoegen` block, empty on the captured lot. Free text here rather than
    // an enum: its values were never seen, and an enum nobody has read is a
    // guess that would start rejecting legitimate rows.
    specification: varchar("specification", { length: 255 }),

    status: mysqlEnum("status", stockOptionStatuses)
      .notNull()
      .default("requested"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_stock_options_stock_uuid").on(table.stockUuid),
    index("idx_stock_options_product_uuid").on(table.productUuid),
    // The same option twice on one lot is the duplicate this prevents. It is
    // scoped by specification, because `Slitting` to two different widths is
    // two genuine rows while `Slitting` twice to the same width is a mistake.
    unique("uq_stock_options_stock_option").on(
      table.stockUuid,
      table.option,
      table.specification,
    ),
    foreignKey({
      name: "fk_stock_options_stock",
      columns: [table.stockUuid],
      foreignColumns: [Stock.uuid],
    }),
    foreignKey({
      name: "fk_stock_options_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
  ],
);

export type SelectStockOptions = InferSelectModel<typeof StockOptions>;
export type InsertStockOptions = InferInsertModel<typeof StockOptions>;
