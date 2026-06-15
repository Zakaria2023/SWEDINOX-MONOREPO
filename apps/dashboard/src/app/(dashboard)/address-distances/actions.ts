"use server";

import {
  db,
  AddressDistances,
  Companies,
  type SelectAddressDistances,
  type SelectCompanies,
} from "@/db";
import { desc, eq } from "drizzle-orm";

export type AddressDistanceListItem = SelectAddressDistances & {
  companyName: SelectCompanies["companyName"] | null;
};

export const getAddressDistances = async (): Promise<AddressDistanceListItem[]> => {
  const rows = await db
    .select({
      addressDistance: AddressDistances,
      companyName: Companies.companyName,
    })
    .from(AddressDistances)
    .leftJoin(Companies, eq(Companies.uuid, AddressDistances.companyUuid))
    .orderBy(desc(AddressDistances.createdAt));

  return rows.map((r) => ({
    ...r.addressDistance,
    companyName: r.companyName,
  }));
};
