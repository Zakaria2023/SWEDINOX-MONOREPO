"use server";

import { SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { describeError, profitMarginPercent } from "@/lib/helpers";
import {
  getInvoiceCountsByCompanyMonth,
  getRevenueCompanies,
  getRevenueFacts,
} from "@/lib/server/customer-revenue";

export type CustomerRevenueRow = {
  customerName: SelectCompanies["companyName"] | null;
  customerCode: SelectCompanies["id"] | null;
  city: SelectCompanyAddresses["city"] | null;
  country: SelectCompanyAddresses["country"] | null;
  active: boolean;
  year: number;
  month: number;
  materialRevenue: number;
  optionsRevenue: number;
  surchargesRevenue: number;
  revenue: number;
  materialProfit: number;
  optionsProfit: number;
  surchargesProfit: number;
  profit: number;
  profitMargin: number;
  weightKg: number;
  invoices: number;
  invoiceLines: number;
};

// Invoiced revenue per customer and month, split the way the reference's C8
// splits it: material, options and surcharges, each with its profit. Proved on
// May 2025 — material and options exact on 90 of 90 customers. `#Invoice lines`
// counts order lines only, and kilos are whole kilos, as the reference prints
// them. `Active` is the company's archive flag.
export const getCustomerRevenue = async (): Promise<CustomerRevenueRow[]> => {
  try {
    const [facts, companies, invoiceCounts] = await Promise.all([
      getRevenueFacts(),
      getRevenueCompanies(),
      getInvoiceCountsByCompanyMonth(),
    ]);

    const rows = new Map<string, CustomerRevenueRow>();
    for (const fact of facts) {
      const key = `${fact.companyUuid}|${fact.year}|${fact.month}`;
      const company = companies.get(fact.companyUuid);
      const row = rows.get(key) ?? {
        customerName: company?.companyName ?? null,
        customerCode: company?.id ?? null,
        city: company?.city ?? null,
        country: company?.country ?? null,
        active: !company?.isInactive,
        year: fact.year,
        month: fact.month,
        materialRevenue: 0,
        optionsRevenue: 0,
        surchargesRevenue: 0,
        revenue: 0,
        materialProfit: 0,
        optionsProfit: 0,
        surchargesProfit: 0,
        profit: 0,
        profitMargin: 0,
        weightKg: 0,
        invoices: invoiceCounts.get(key) ?? 0,
        invoiceLines: 0,
      };
      if (fact.kind === "product") {
        row.materialRevenue += fact.revenue;
        row.materialProfit += fact.profit;
        row.optionsRevenue += fact.optionRevenue;
        row.optionsProfit += fact.optionProfit;
        row.weightKg += fact.weightKg;
        row.invoiceLines += fact.lines;
      } else {
        row.surchargesRevenue += fact.revenue;
        row.surchargesProfit += fact.profit;
      }
      rows.set(key, row);
    }

    return [...rows.values()]
      .map((row) => {
        const revenue =
          row.materialRevenue + row.optionsRevenue + row.surchargesRevenue;
        const profit =
          row.materialProfit + row.optionsProfit + row.surchargesProfit;
        return {
          ...row,
          revenue,
          profit,
          profitMargin: profitMarginPercent(revenue, profit),
          weightKg: Math.round(row.weightKg),
        };
      })
      .sort(
        (a, b) =>
          (a.customerName ?? "").localeCompare(b.customerName ?? "") ||
          b.year - a.year ||
          b.month - a.month,
      );
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch customer revenue"));
  }
};
