import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  decimal,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  time,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { availableAtOptions, type AddressCategory } from "../../lib/enums";
import { Companies } from "./companies";

export const CompanyAddresses = mysqlTable(
  "CompanyAddresses",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }),

    altName: varchar("alt_name", { length: 255 }),
    poBox: boolean("po_box").default(false),

    streetAndNo: varchar("street_and_no", { length: 255 }),
    postalCode: varchar("postal_code", { length: 50 }),
    country: varchar("country", { length: 100 }),
    city: varchar("city", { length: 150 }),
    region: varchar("region", { length: 150 }),
    house: varchar("house", { length: 100 }),

    telephone: varchar("telephone", { length: 100 }),
    fax: varchar("fax", { length: 100 }),
    email: varchar("email", { length: 255 }),
    website: varchar("website", { length: 255 }),
    billingAttention: varchar("billing_attention", { length: 255 }),
    billingAttentionAdditional: varchar("billing_attention_additional", {
      length: 255,
    }),

    gln: varchar("gln", { length: 13 }),
    peopleId: varchar("gln", { length: 13 }),

    sequenceNumber: int("sequence_number"),

    category: json("category").$type<AddressCategory[]>().notNull(),

    needCrane: boolean("need_crane").default(false),
    canopyRequired: boolean("canopy_required").default(false),
    bundleSeparately: boolean("bundle_separately").default(false),
    addressComplete: boolean("address_complete").default(false),
    specialTransport: boolean("special_transport").default(false),

    availableAt: mysqlEnum(availableAtOptions),

    unloadingStartTime: time("unloading_start_time"),
    unloadingEndTime: time("unloading_end_time"),

    maxLength: decimal("max_length", { precision: 10, scale: 2 }),
    maxBundleWeight: decimal("max_bundle_weight", { precision: 10, scale: 2 }),

    loadingInstructions: text("loading_instructions"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_company_addresses_company_uuid").on(table.companyUuid),
    foreignKey({
      name: "fk_company_addresses_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectCompanyAddresses = InferSelectModel<typeof CompanyAddresses>;
export type InsertCompanyAddresses = InferInsertModel<typeof CompanyAddresses>;
