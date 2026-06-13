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
import { Contracts } from "./contracts";
import {
  communicationSettingDocumentTypes,
  communicationSettingShapes,
  communicationSettingTypes,
} from "../../lib/enums";

export const CommunicationSettings = mysqlTable(
  "communication_settings",
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
    contractUuid: char("contract_uuid", { length: 36 }),
    email: varchar("email", { length: 255 }),
    fax: varchar("fax", { length: 100 }),
    modifiedByUserId: varchar("modified_by_user_id", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_communication_settings_company_uuid").on(table.companyUuid),
    index("idx_communication_settings_contract_uuid").on(table.contractUuid),
    index("idx_communication_settings_document_type").on(table.documentType),
    index("idx_communication_settings_communication_type").on(
      table.communicationType,
    ),
    foreignKey({
      name: "fk_communication_settings_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_communication_settings_contract",
      columns: [table.contractUuid],
      foreignColumns: [Contracts.uuid],
    }),
  ],
);

export type SelectCommunicationSettings = InferSelectModel<typeof CommunicationSettings>;
export type InsertCommunicationSettings = InferInsertModel<typeof CommunicationSettings>;
