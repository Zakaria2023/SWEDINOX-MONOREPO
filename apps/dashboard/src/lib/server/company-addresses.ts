import "server-only";

import { db } from "@/db";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { AddressCategory } from "@/lib/enums";
import { eq, sql } from "drizzle-orm";

/**
 * A company's address for one role, as a subquery to left-join on
 * `companyUuid`.
 *
 * The reference proves a company has **exactly one** visiting and one
 * correspondence address (3 414 of 3 414 companies, C4), and that every
 * contact row prints those same company addresses (2 188 of 2 188, C3). So a
 * screen that shows a customer's city reads the company's visiting address —
 * not the copy stored on whichever contact happens to be first.
 *
 * Should old data hold two rows for the role, the oldest wins. `name` makes the
 * alias unique so one query can join both roles.
 */
export const companyAddressFor = (role: AddressCategory, name: string) => {
  const firstId = db
    .select({
      companyUuid: CompanyAddresses.companyUuid,
      minId: sql<number>`MIN(${CompanyAddresses.id})`.as(`${name}_min_id`),
    })
    .from(CompanyAddresses)
    .where(sql`JSON_CONTAINS(${CompanyAddresses.category}, ${JSON.stringify(role)})`)
    .groupBy(CompanyAddresses.companyUuid)
    .as(`${name}_first`);

  return db
    .select({
      companyUuid: CompanyAddresses.companyUuid,
      streetAndNo: CompanyAddresses.streetAndNo,
      postalCode: CompanyAddresses.postalCode,
      city: CompanyAddresses.city,
      country: CompanyAddresses.country,
      telephone: CompanyAddresses.telephone,
      fax: CompanyAddresses.fax,
      poBox: CompanyAddresses.poBox,
    })
    .from(CompanyAddresses)
    .innerJoin(firstId, eq(CompanyAddresses.id, firstId.minId))
    .as(name);
};
