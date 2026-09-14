"use server";

import { SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { describeError, profitMarginPercent } from "@/lib/helpers";
import {
  getRevenueCompanies,
  getRevenueFacts,
} from "@/lib/server/customer-revenue";

export type CustomerRevenuePerRevenueGroupRow = {
  debtorNumber: SelectCompanies["debtorNumber"] | null;
  customerName: SelectCompanies["companyName"] | null;
  city: SelectCompanyAddresses["city"] | null;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  year: number;
  month: number;
  weightKg: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  invoiceLines: number;
};

// Invoiced revenue per customer × revenue group × month. Product revenue lands
// under the product's group and every charge under its own — the reference's
// C10, which reconciles with its invoice lines to the cent on every group. Our
// screen used to put everything under the product's group and dropped charges.
export const getCustomerRevenuePerRevenueGroup = async (): Promise<
  CustomerRevenuePerRevenueGroupRow[]
> => {
  try {
    const [facts, companies] = await Promise.all([
      getRevenueFacts(),
      getRevenueCompanies(),
    ]);

    const rows = new Map<string, CustomerRevenuePerRevenueGroupRow>();
    for (const fact of facts) {
      const key = `${fact.companyUuid}|${fact.revenueGroupNumber}|${fact.year}|${fact.month}`;
      const company = companies.get(fact.companyUuid);
      const row = rows.get(key) ?? {
        debtorNumber: company?.debtorNumber ?? null,
        customerName: company?.companyName ?? null,
        city: company?.city ?? null,
        revenueGroupNumber: fact.revenueGroupNumber,
        revenueGroupName: fact.revenueGroupName,
        year: fact.year,
        month: fact.month,
        weightKg: 0,
        revenue: 0,
        profit: 0,
        profitMargin: 0,
        invoiceLines: 0,
      };
      row.revenue += fact.revenue;
      row.profit += fact.profit;
      row.weightKg += fact.weightKg;
      row.invoiceLines += fact.lines;
      rows.set(key, row);
    }

    return [...rows.values()]
      .map((row) => ({
        ...row,
        profitMargin: profitMarginPercent(row.revenue, row.profit),
      }))
      .sort(
        (a, b) =>
          (a.customerName ?? "").localeCompare(b.customerName ?? "") ||
          b.year - a.year ||
          b.month - a.month ||
          (a.revenueGroupNumber ?? 0) - (b.revenueGroupNumber ?? 0),
      );
  } catch (error) {
    throw new Error(
      describeError(
        error,
        "Failed to fetch customer revenue per revenue group",
      ),
    );
  }
};
