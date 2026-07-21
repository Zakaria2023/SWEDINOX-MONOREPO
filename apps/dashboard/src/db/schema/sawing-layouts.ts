import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  date,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { sawingLayoutFetchStatuses, sawingStatuses } from "../../lib/enums";

// Sawing layouts — the Logistics "Sawing layouts" overview. Each row is a
// cutting plan for a sawing machine: the raw length fetched from stock (the
// "fetch" side), the sawing operation itself (the "sawing" side) and the fixed
// ten qty/length slots describing the pieces the layout produces.
export const SawingLayouts = mysqlTable(
  "SawingLayouts",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // Which saw the layout runs on.
    machine: varchar("machine", { length: 100 }),

    // Fetch side — retrieving the raw bar/length from stock to bring to the saw.
    fetchDate: date("fetch_date"),
    fetchCode: varchar("fetch_code", { length: 50 }),
    fetchStatus: mysqlEnum("fetch_status", sawingLayoutFetchStatuses),
    fetchQty: decimal("fetch_qty", { precision: 15, scale: 3 }),

    // Where the raw length is stored.
    warehouse: varchar("warehouse", { length: 100 }),
    section: varchar("section", { length: 100 }),
    location: varchar("location", { length: 100 }),

    // The raw product being sawn, its description and its length, plus the
    // residual length left over after the layout is cut.
    product: varchar("product", { length: 100 }),
    description: varchar("description", { length: 255 }),
    length: decimal("length", { precision: 15, scale: 3 }),
    residualLength: decimal("residual_length", { precision: 15, scale: 3 }),

    // Sawing side — the sawing operation and the product it yields.
    sawingDate: date("sawing_date"),
    sawingCode: varchar("sawing_code", { length: 50 }),
    sawingStatus: mysqlEnum("sawing_status", sawingStatuses),
    sawingProduct: varchar("sawing_product", { length: 100 }),
    sawingProductDescription: varchar("sawing_product_description", {
      length: 255,
    }),
    totalPiecesToBeSawn: int("total_pieces_to_be_sawn"),
    sawingOfTl: varchar("sawing_of_tl", { length: 100 }),
    sawingAccordingToLayout: boolean("sawing_according_to_layout"),
    layoutIncludesCutoff: boolean("layout_includes_cutoff"),
    followUpProcessing: varchar("follow_up_processing", { length: 255 }),
    toLocations: varchar("to_locations", { length: 255 }),

    // The layout's fixed ten piece slots: quantity and length for each cut.
    qty1: int("qty_1"),
    length1: decimal("length_1", { precision: 15, scale: 3 }),
    qty2: int("qty_2"),
    length2: decimal("length_2", { precision: 15, scale: 3 }),
    qty3: int("qty_3"),
    length3: decimal("length_3", { precision: 15, scale: 3 }),
    qty4: int("qty_4"),
    length4: decimal("length_4", { precision: 15, scale: 3 }),
    qty5: int("qty_5"),
    length5: decimal("length_5", { precision: 15, scale: 3 }),
    qty6: int("qty_6"),
    length6: decimal("length_6", { precision: 15, scale: 3 }),
    qty7: int("qty_7"),
    length7: decimal("length_7", { precision: 15, scale: 3 }),
    qty8: int("qty_8"),
    length8: decimal("length_8", { precision: 15, scale: 3 }),
    qty9: int("qty_9"),
    length9: decimal("length_9", { precision: 15, scale: 3 }),
    qty10: int("qty_10"),
    length10: decimal("length_10", { precision: 15, scale: 3 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_sawing_layouts_sawing_date").on(table.sawingDate),
    index("idx_sawing_layouts_machine").on(table.machine),
  ],
);

export type SelectSawingLayouts = InferSelectModel<typeof SawingLayouts>;
export type InsertSawingLayouts = InferInsertModel<typeof SawingLayouts>;
