"use server";

import { db } from "@/db";
import { SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import { Products } from "@/db/schema/products";
import { describeError, profitMarginPercent } from "@/lib/helpers";
import { getRevenueCompanies } from "@/lib/server/customer-revenue";
import { and, count, eq, isNotNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

export type CustomerRevenuePerProductGroupRow = {
  representative: SelectCompanies["representative"] | null;
  customerGroup: SelectCompanies["customerGroup"] | null;
  debtorNumber: SelectCompanies["debtorNumber"] | null;
  customerName: SelectCompanies["companyName"] | null;
  city: SelectCompanyAddresses["city"] | null;
  region: SelectCompanies["region"] | null;
  productGroupName: SelectProductGroups["name"] | null;
  subgroup1Name: SelectProductGroups["name"] | null;
  subgroup2Name: SelectProductGroups["name"] | null;
  sourceType: SelectOrderItems["sourceType"];
  year: number;
  month: number;
  weightKg: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  invoiceLines: number;
};

const parentGroup = alias(ProductGroups, "parent_group");
const grandparentGroup = alias(ProductGroups, "grandparent_group");

// The product half of invoiced revenue per customer × product group × month.
// Options and charges are not in it: the reference's C9 totals exactly the
// invoice lines' `Revenue products` (9 032 601.62) and their product profit.
//
// The group is shown three levels deep, top first — `Roestvast staal` /
// `RVS platen` / `Plaat Koudgewalst 304` — walked up from the product's own
// group, since a product may sit at any of the three levels.
export const getCustomerRevenuePerProductGroup = async (): Promise<
  CustomerRevenuePerProductGroupRow[]
> => {
  try {
    const year = sql<number>`YEAR(${Invoices.invoiceDate})`;
    const month = sql<number>`MONTH(${Invoices.invoiceDate})`;

    const [rows, companies] = await Promise.all([
      db
        .select({
          companyUuid: Invoices.companyUuid,
          ownGroup: ProductGroups.name,
          parentGroup: parentGroup.name,
          grandparentGroup: grandparentGroup.name,
          sourceType: OrderItems.sourceType,
          year,
          month,
          weightKg: sql<string>`COALESCE(SUM(${InvoiceItems.weightKg}), 0)`,
          revenue: sql<string>`COALESCE(SUM(${InvoiceItems.revenueProducts}), 0)`,
          profit: sql<string>`COALESCE(SUM(${InvoiceItems.profitProducts}), 0)`,
          invoiceLines: count(InvoiceItems.uuid),
        })
        .from(InvoiceItems)
        .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
        .innerJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
        .innerJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
        .leftJoin(
          ProductGroups,
          eq(Products.productGroupUuid, ProductGroups.uuid),
        )
        .leftJoin(parentGroup, eq(ProductGroups.parentUuid, parentGroup.uuid))
        .leftJoin(
          grandparentGroup,
          eq(parentGroup.parentUuid, grandparentGroup.uuid),
        )
        .where(
          and(eq(Invoices.cancelled, false), isNotNull(Invoices.companyUuid)),
        )
        .groupBy(
          Invoices.companyUuid,
          ProductGroups.uuid,
          ProductGroups.name,
          parentGroup.name,
          grandparentGroup.name,
          OrderItems.sourceType,
          year,
          month,
        ),
      getRevenueCompanies(),
    ]);

    return rows
      .map((row) => {
        const company = companies.get(row.companyUuid ?? "");
        // Top level first, whatever depth the product's own group sits at.
        const [productGroupName = null, subgroup1Name = null, subgroup2Name = null] =
          [row.grandparentGroup, row.parentGroup, row.ownGroup].filter(
            (name): name is string => name !== null,
          );
        const revenue = Number(row.revenue);
        const profit = Number(row.profit);
        return {
          representative: company?.representative ?? null,
          customerGroup: company?.customerGroup ?? null,
          debtorNumber: company?.debtorNumber ?? null,
          customerName: company?.companyName ?? null,
          city: company?.city ?? null,
          region: company?.region ?? null,
          productGroupName,
          subgroup1Name,
          subgroup2Name,
          sourceType: row.sourceType,
          year: Number(row.year),
          month: Number(row.month),
          weightKg: Number(row.weightKg),
          revenue,
          profit,
          profitMargin: profitMarginPercent(revenue, profit),
          invoiceLines: Number(row.invoiceLines),
        };
      })
      .sort(
        (a, b) =>
          (a.customerName ?? "").localeCompare(b.customerName ?? "") ||
          b.year - a.year ||
          b.month - a.month,
      );
  } catch (error) {
    throw new Error(
      describeError(
        error,
        "Failed to fetch customer revenue per product group",
      ),
    );
  }
};
