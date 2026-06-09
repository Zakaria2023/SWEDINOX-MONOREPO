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
import {
  communicationSettingDocumentTypes,
  communicationSettingShapes,
  communicationSettingTypes,
} from "../../lib/enums";

export const CommunicationSettings = mysqlTable(
  "communication_settings",
  {
    id: int("id").primaryKey().autoincrement(),
    // Company code comes from Companies.id and company name from Companies.companyName.
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

    // TODO: Connect this to the contacts schema later when the UI supports selecting an existing contact.
    contact: varchar("contact", { length: 255 }),
    // Used when communicationType = "email".
    email: varchar("email", { length: 255 }),
    // Used when communicationType = "fax".
    fax: varchar("fax", { length: 100 }),
    // For printing and EDI communication types, no contact selector/value is stored here.

    // Stores the Clerk user ID of the user who created or last updated this record.
    // TODO: Replace with a foreign key when the app has a local users table.
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
    foreignKey({
      name: "fk_communication_settings_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);
