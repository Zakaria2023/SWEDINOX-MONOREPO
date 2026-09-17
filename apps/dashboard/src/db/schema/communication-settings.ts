import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { Companies } from "./companies";
import { Contacts } from "./contacts";
import {
  communicationSettingDocumentTypes,
  communicationSettingShapes,
  communicationSettingTypes,
} from "../../lib/enums";

export const CommunicationSettings = mysqlTable(
  "CommunicationSettings",
  {
    id: int("id").primaryKey().autoincrement(),
    companyUuid: char("company_uuid", { length: 36 }).notNull(),
    documentType: mysqlEnum(
      "document_type",
      communicationSettingDocumentTypes,
    ).notNull(),
    communicationType: mysqlEnum(
      "communication_type",
      communicationSettingTypes,
    ).notNull(),
    shape: mysqlEnum("shape", communicationSettingShapes),
    // The reference splits the recipient in three: a contact of the company,
    // whose address it then shows, or a `Custom contact` typed by hand. A
    // contact wins, and its address is read live so it follows the contact.
    contactUuid: char("contact_uuid", { length: 36 }),
    email: varchar("email", { length: 255 }),
    fax: varchar("fax", { length: 100 }),
    modifiedByUserId: varchar("modified_by_user_id", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_communication_settings_company_uuid").on(table.companyUuid),
    index("idx_communication_settings_document_type").on(table.documentType),
    index("idx_communication_settings_communication_type").on(
      table.communicationType,
    ),
    index("idx_communication_settings_contact_uuid").on(table.contactUuid),
    foreignKey({
      name: "fk_communication_settings_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_communication_settings_contact",
      columns: [table.contactUuid],
      foreignColumns: [Contacts.uuid],
    }),
  ],
);

export type SelectCommunicationSettings = InferSelectModel<
  typeof CommunicationSettings
>;
export type InsertCommunicationSettings = InferInsertModel<
  typeof CommunicationSettings
>;
