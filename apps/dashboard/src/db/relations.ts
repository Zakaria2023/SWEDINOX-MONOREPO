import { relations } from "drizzle-orm";
import { Machines } from "./schema/machines";
import { Warehouses } from "./schema/warehouses";

export const machinesRelations = relations(Machines, ({ one }) => ({
  stockLocation: one(Warehouses, {
    fields: [Machines.stockLocationUuid],
    references: [Warehouses.uuid],
  }),
}));
