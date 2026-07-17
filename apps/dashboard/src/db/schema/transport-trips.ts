import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  date,
  decimal,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// Transport trips ("Trip data") — a vehicle run with a number of stops and
// the total load carried.
export const TransportTrips = mysqlTable("TransportTrips", {
  id: int("id").primaryKey().autoincrement(),
  uuid: char("uuid", { length: 36 }).notNull().unique(),
  tripNumber: int("trip_number"),
  tripDate: date("trip_date", { mode: "string" }),
  vehicle: varchar("vehicle", { length: 255 }),
  stops: int("stops").default(0),
  kg: decimal("kg", { precision: 15, scale: 2 }).default("0.00"),
  colli: int("colli").default(0),
  ordersPerStop: varchar("orders_per_stop", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SelectTransportTrips = InferSelectModel<typeof TransportTrips>;
export type InsertTransportTrips = InferInsertModel<typeof TransportTrips>;
