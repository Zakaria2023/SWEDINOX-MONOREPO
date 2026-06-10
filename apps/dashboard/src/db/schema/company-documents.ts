import {
  boolean,
  char,
  date,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { companyDocumentTypes, companyRoleTypes } from "../../lib/enums";
import { CompanyAddresses } from "./company-addresses";
import { Companies } from "./companies";
import { Contacts } from "./contacts";

export const CompanyDocuments = mysqlTable(
  "company_documents",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }).notNull(),
    contactUuid: char("contact_uuid", { length: 36 }),
    addressUuid: char("address_uuid", { length: 36 }),

    documentType: mysqlEnum("document_type", companyDocumentTypes).notNull(),

    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),

    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileUrl: text("file_url").notNull(),
    fileExtension: varchar("file_extension", { length: 50 }),
    fileSizeBytes: int("file_size_bytes"),

    issuedAt: date("issued_at"),
    expiresAt: date("expires_at"),

    // Stores the Clerk user ID of the user who uploaded the file.
    // TODO: Replace with a foreign key when the app has a local users table.
    uploadedByUserId: varchar("uploaded_by_user_id", { length: 255 }).notNull(),

    isActive: boolean("is_active").default(true),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_company_documents_company_uuid").on(table.companyUuid),
    index("idx_company_documents_contact_uuid").on(table.contactUuid),
    index("idx_company_documents_address_uuid").on(table.addressUuid),
    index("idx_company_documents_document_type").on(table.documentType),
    foreignKey({
      name: "fk_company_documents_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_company_documents_contact",
      columns: [table.contactUuid],
      foreignColumns: [Contacts.uuid],
    }),
    foreignKey({
      name: "fk_company_documents_address",
      columns: [table.addressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
  ],
);

export const CompanyRoles = mysqlTable(
  "company_roles",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }).notNull(),
    role: mysqlEnum("role", companyRoleTypes).notNull(),

    isPrimary: boolean("is_primary").default(false),
    isActive: boolean("is_active").default(true),

    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_company_roles_company_uuid").on(table.companyUuid),
    index("idx_company_roles_role").on(table.role),
    foreignKey({
      name: "fk_company_roles_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);
