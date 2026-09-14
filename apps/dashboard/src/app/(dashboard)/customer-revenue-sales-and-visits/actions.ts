"use server";

import { SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { describeError } from "@/lib/helpers";
import {
  getRevenueCompanies,
  getRevenueFacts,
} from "@/lib/server/customer-revenue";

export type CustomerRevenueSalesVisitsRow = {
  representative: SelectCompanies["representative"] | null;
  companyCode: SelectCompanies["id"] | null;
  companyName: SelectCompanies["companyName"] | null;
  visitPostalCode: SelectCompanyAddresses["postalCode"] | null;
  visitCity: SelectCompanyAddresses["city"] | null;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  currentYear: number;
  revenueCurrentYear: number;
  revenueLastYear: number;
  revenueTwoYearsAgo: number;
  kgCurrentYear: number;
  kgLastYear: number;
  kgTwoYearsAgo: number;
};

// Three whole years per customer × revenue group, keyed by company code. The
// reference's C12 has no month — `Current year` 2025 is all of 2025 — and its
// 809 cells equal C10 summed over the year, so it reads the same product and
// charge revenue as C10. The address is the company's visiting address.
export const getCustomerRevenueSalesVisits = async (
  currentYear: number = new Date().getFullYear(),
): Promise<CustomerRevenueSalesVisitsRow[]> => {
  try {
    const [facts, companies] = await Promise.all([
      getRevenueFacts(),
      getRevenueCompanies(),
    ]);

    const rows = new Map<string, CustomerRevenueSalesVisitsRow>();
    for (const fact of facts) {
      const offset = currentYear - fact.year;
      if (offset < 0 || offset > 2) {
        continue;
      }
      const key = `${fact.companyUuid}|${fact.revenueGroupNumber}`;
      const company = companies.get(fact.companyUuid);
      const row = rows.get(key) ?? {
        representative: company?.representative ?? null,
        companyCode: company?.id ?? null,
        companyName: company?.companyName ?? null,
        visitPostalCode: company?.postalCode ?? null,
        visitCity: company?.city ?? null,
        revenueGroupNumber: fact.revenueGroupNumber,
        revenueGroupName: fact.revenueGroupName,
        currentYear,
        revenueCurrentYear: 0,
        revenueLastYear: 0,
        revenueTwoYearsAgo: 0,
        kgCurrentYear: 0,
        kgLastYear: 0,
        kgTwoYearsAgo: 0,
      };
      if (offset === 0) {
        row.revenueCurrentYear += fact.revenue;
        row.kgCurrentYear += fact.weightKg;
      } else if (offset === 1) {
        row.revenueLastYear += fact.revenue;
        row.kgLastYear += fact.weightKg;
      } else {
        row.revenueTwoYearsAgo += fact.revenue;
        row.kgTwoYearsAgo += fact.weightKg;
      }
      rows.set(key, row);
    }

    return [...rows.values()].sort(
      (a, b) =>
        (a.companyName ?? "").localeCompare(b.companyName ?? "") ||
        (a.revenueGroupNumber ?? 0) - (b.revenueGroupNumber ?? 0),
    );
  } catch (error) {
    throw new Error(
      describeError(
        error,
        "Failed to fetch customer revenue, sales and visits",
      ),
    );
  }
};
