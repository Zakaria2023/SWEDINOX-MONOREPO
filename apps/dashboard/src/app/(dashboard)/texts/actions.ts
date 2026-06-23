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
import { desc, eq } from "drizzle-orm";

export type TextListItem = SelectTexts & {
  companyId: SelectCompanies["id"] | null;
  companyName: SelectCompanies["companyName"] | null;
  roles: SelectCompanies["roles"] | null;
  city: SelectCompanyAddresses["city"] | null;
  textCategoryName: SelectTextCategories["name"] | null;
};

export const getTexts = async (): Promise<TextListItem[]> => {
  const rows = await db
    .select({
      text: Texts,
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

  return rows.map((r) => ({
    ...r.text,
    companyId: r.companyId,
    companyName: r.companyName,
    roles: r.roles,
    city: r.city,
    textCategoryName: r.textCategoryName,
  }));
};
