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
import { companyCertificateTypes } from "../../lib/enums";
import { Companies } from "./companies";
import { CompanyDocuments } from "./company-documents";

export const CompanyCertificates = mysqlTable(
  "company_certificates",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }).notNull(),

    certificateType: mysqlEnum(
      "certificate_type",
      companyCertificateTypes,
    ).notNull(),

    certificateCode: varchar("certificate_code", { length: 100 }),
    certificateName: varchar("certificate_name", { length: 255 }).notNull(),

    issuedBy: varchar("issued_by", { length: 255 }),

    validFrom: date("valid_from"),
    validUntil: date("valid_until"),

    documentUuid: char("document_uuid", { length: 36 }),

    isVerified: boolean("is_verified").default(false),
    isActive: boolean("is_active").default(true),

    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_company_certificates_company_uuid").on(table.companyUuid),
    index("idx_company_certificates_document_uuid").on(table.documentUuid),
    index("idx_company_certificates_certificate_type").on(
      table.certificateType,
    ),
    foreignKey({
      name: "fk_company_certificates_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_company_certificates_document",
      columns: [table.documentUuid],
      foreignColumns: [CompanyDocuments.uuid],
    }),
  ],
);
