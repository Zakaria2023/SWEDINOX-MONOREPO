"use server";

import { SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { SelectOrderItems } from "@/db/schema/order-items";
import { SelectOrders } from "@/db/schema/orders";
import { SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { describeError, profitMarginPercent } from "@/lib/helpers";
import {
  getRevenueCompanies,
  getRevenueFacts,
} from "@/lib/server/customer-revenue";

export type CustomerRevenueSplitRow = {
  representative: SelectCompanies["representative"] | null;
  customerGroup: SelectCompanies["customerGroup"] | null;
  debtorNumber: SelectCompanies["debtorNumber"] | null;
  customerName: SelectCompanies["companyName"] | null;
  city: SelectCompanyAddresses["city"] | null;
  country: SelectCompanyAddresses["country"] | null;
  accountManager: SelectCompanies["accountManager"] | null;
  region: SelectCompanies["region"] | null;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  orderType: SelectOrders["orderType"];
  sourceType: SelectOrderItems["sourceType"] | null;
  year: number;
  month: number;
  weightKg: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  invoiceLines: number;
};

// C10 with the order split out — and "order type" means two things there, so
// both are columns: the order's type (Normal / Call-off / Rush / Ex works) and
// the line's source (Stk / CD). The reference's C11 sums to C10 cell for cell,
// call-off and rush exact; a charge always counts as Normal and has no source.
// This used to be derived from the consignment/pickup flags, which is not the
// axis the reference splits on.
export const getCustomerRevenueSplit = async (): Promise<
  CustomerRevenueSplitRow[]
> => {
  try {
    const [facts, companies] = await Promise.all([
      getRevenueFacts(),
      getRevenueCompanies(),
    ]);

    const rows = new Map<string, CustomerRevenueSplitRow>();
    for (const fact of facts) {
      const orderType = fact.orderType ?? "normal";
      const key = `${fact.companyUuid}|${fact.revenueGroupNumber}|${orderType}|${fact.sourceType}|${fact.year}|${fact.month}`;
      const company = companies.get(fact.companyUuid);
      const row = rows.get(key) ?? {
        representative: company?.representative ?? null,
        customerGroup: company?.customerGroup ?? null,
        debtorNumber: company?.debtorNumber ?? null,
        customerName: company?.companyName ?? null,
        city: company?.city ?? null,
        country: company?.country ?? null,
        accountManager: company?.accountManager ?? null,
        region: company?.region ?? null,
        revenueGroupNumber: fact.revenueGroupNumber,
        revenueGroupName: fact.revenueGroupName,
        orderType,
        sourceType: fact.sourceType,
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
        "Failed to fetch customer revenue with split order types",
      ),
    );
  }
};
