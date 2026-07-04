"use server";

import {
  db,
  Companies,
  CompanyAddresses,
  TextCategories,
  Texts,
  SelectTexts,
  SelectCompanies,
  SelectCompanyAddresses,
  SelectTextCategories,
} from "@/db";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type TextListItem = SelectTexts & {
  companyId: SelectCompanies["id"] | null;
  companyName: SelectCompanies["companyName"] | null;
  roles: SelectCompanies["roles"] | null;
  city: SelectCompanyAddresses["city"] | null;
  textCategoryName: SelectTextCategories["name"] | null;
};

export const getTexts = async (): Promise<TextListItem[]> =>
  db
    .select({
      ...getTableColumns(Texts),
      companyId: Companies.id,
      companyName: Companies.companyName,
      roles: Companies.roles,
      city: CompanyAddresses.city,
      textCategoryName: TextCategories.name,
    })
    .from(Texts)
    .leftJoin(Companies, eq(Companies.uuid, Texts.companyUuid))
    .leftJoin(
      CompanyAddresses,
      eq(CompanyAddresses.companyUuid, Texts.companyUuid),
    )
    .leftJoin(TextCategories, eq(TextCategories.uuid, Texts.textCategoryUuid))
    .orderBy(desc(Texts.createdAt));
