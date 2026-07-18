import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { deliveryTimeUnits, processingEditings } from "../../lib/enums";
import { Companies } from "./companies";

// Processing options a processor company offers. `supplierUuid` points at the
// supplier company that performs the editing (shown as a supplier dropdown, the
// "supplier code"); `editing` is the processing type.
export const Processings = mysqlTable(
  "Processings",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    companyUuid: char("company_uuid", { length: 36 }).notNull(),
    editing: mysqlEnum("editing", processingEditings),
    preference: boolean("preference").default(false),
    supplierUuid: char("supplier_uuid", { length: 36 }),
    deliveryTime: int("delivery_time").default(0),
    deliveryTimeUnit: mysqlEnum("delivery_time_unit", deliveryTimeUnits),
    processorLocation: varchar("processor_location", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_processings_company_uuid").on(table.companyUuid),
    index("idx_processings_supplier_uuid").on(table.supplierUuid),
    foreignKey({
      name: "fk_processings_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_processings_supplier",
      columns: [table.supplierUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectProcessings = InferSelectModel<typeof Processings>;
export type InsertProcessings = InferInsertModel<typeof Processings>;
