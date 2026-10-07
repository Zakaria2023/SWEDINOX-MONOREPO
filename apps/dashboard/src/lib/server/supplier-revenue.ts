import "server-only";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { Products } from "@/db/schema/products";
import { PurchaseInvoiceItems } from "@/db/schema/purchase-invoice-items";
import {
  PurchaseInvoices,
  PurchaseInvoiceSurcharges,
} from "@/db/schema/purchase-invoices";
import {
  PurchaseOrderItems,
  SelectPurchaseOrderItems,
} from "@/db/schema/purchase-order-items";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { INVOICE_SURCHARGE_REVENUE_GROUP_NUMBERS } from "@/lib/constants";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { eq, inArray, sql } from "drizzle-orm";

/**
 * One slice of purchased value: supplier × invoice month × revenue group ×
 * order type × price unit.
 *
 * The reference's two supplier revenue screens read the same money and differ
 * only in grain — `Supplier revenue` is `Supplier revenue per revenue group`
 * summed per supplier and month (Acciai Speciali Terni, January 2025:
 * 78 534.45 and 36 185 kg both ways).
 *
 * The money is what the supplier invoiced: the purchase invoice line's own
 * amount, plus every surcharge on the invoice under its own revenue group —
 * `Prijsverschillen` (8600), `Vrachtkosten` (8100), `Overige toeslagen`
 * (8900) — with no order type, no unit and no weight, which is how 85 of the
 * reference's 361 rows look. It used to be the lot's valuation price times the
 * invoiced quantity, which is neither what was paid nor in the right unit.
 */
export type SupplierRevenueFact = {
  supplierUuid: string;
  year: number;
  month: number;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  /** Stock or cross-dock; null on a surcharge. */
  sourceType: SelectPurchaseOrderItems["sourceType"] | null;
  /** The unit the line was priced in, upper-cased as the reference prints it. */
  priceUnit: string | null;
  quantity: number;
  weightKg: number;
  revenue: number;
};

export type SupplierRevenueCompany = Pick<
  SelectCompanies,
  "uuid" | "id" | "companyName" | "creditorNumber"
> & {
  city: SelectCompanyAddresses["city"] | null;
  country: SelectCompanyAddresses["country"] | null;
};

const invoiceYear = sql<number>`YEAR(${PurchaseInvoices.invoiceDate})`;
const invoiceMonth = sql<number>`MONTH(${PurchaseInvoices.invoiceDate})`;

// The surcharge's revenue group, resolved from its description the same way
// the sales side resolves its charges.
const surchargeGroupNumber = sql<number>`CASE ${PurchaseInvoiceSurcharges.description} ${sql.join(
  Object.entries(INVOICE_SURCHARGE_REVENUE_GROUP_NUMBERS).map(
    ([description, number]) => sql`WHEN ${description} THEN ${number}`,
  ),
  sql` `,
)} ELSE 8900 END`;

export const getSupplierRevenueFacts = async (): Promise<
  SupplierRevenueFact[]
> => {
  // The invoiced share of the line's weight: a part invoice carries the part
  // of the kilos it bills, the same rule the invoice itself books the lot by.
  const invoicedKg = sql<string>`COALESCE(SUM(
    CASE WHEN ${PurchaseOrderItems.qtyPlanned} > 0
      THEN ${PurchaseOrderItems.kgPurchased} * ${PurchaseInvoiceItems.quantity} / ${PurchaseOrderItems.qtyPlanned}
      ELSE ${PurchaseOrderItems.kgPurchased} END
  ), 0)`;
  const priceUnit = sql<string | null>`UPPER(${PurchaseOrderItems.priceUnit})`;

  const lines = await db
    .select({
      supplierUuid: PurchaseInvoices.companyUuid,
      year: invoiceYear,
      month: invoiceMonth,
      revenueGroupNumber: RevenueGroups.number,
      revenueGroupName: RevenueGroups.name,
      sourceType: PurchaseOrderItems.sourceType,
      priceUnit,
      quantity: sql<string>`COALESCE(SUM(${PurchaseInvoiceItems.quantity}), 0)`,
      weightKg: invoicedKg,
      revenue: sql<string>`COALESCE(SUM(${PurchaseInvoiceItems.amount}), 0)`,
    })
    .from(PurchaseInvoiceItems)
    .innerJoin(
      PurchaseInvoices,
      eq(PurchaseInvoiceItems.purchaseInvoiceUuid, PurchaseInvoices.uuid),
    )
    .innerJoin(Products, eq(PurchaseInvoiceItems.productUuid, Products.uuid))
    .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
    .leftJoin(
      PurchaseOrderItems,
      eq(PurchaseInvoiceItems.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
    )
    .groupBy(
      PurchaseInvoices.companyUuid,
      invoiceYear,
      invoiceMonth,
      RevenueGroups.number,
      RevenueGroups.name,
      PurchaseOrderItems.sourceType,
      priceUnit,
    );

  const surcharges = await db
    .select({
      supplierUuid: PurchaseInvoices.companyUuid,
      year: invoiceYear,
      month: invoiceMonth,
      revenueGroupNumber: RevenueGroups.number,
      revenueGroupName: RevenueGroups.name,
      revenue: sql<string>`COALESCE(SUM(${PurchaseInvoiceSurcharges.amount}), 0)`,
    })
    .from(PurchaseInvoiceSurcharges)
    .innerJoin(
      PurchaseInvoices,
      eq(PurchaseInvoiceSurcharges.purchaseInvoiceUuid, PurchaseInvoices.uuid),
    )
    .leftJoin(RevenueGroups, eq(RevenueGroups.number, surchargeGroupNumber))
    .groupBy(
      PurchaseInvoices.companyUuid,
      invoiceYear,
      invoiceMonth,
      RevenueGroups.number,
      RevenueGroups.name,
    );

  return [
    ...lines.map(
      (row): SupplierRevenueFact => ({
        supplierUuid: row.supplierUuid ?? "",
        year: Number(row.year),
        month: Number(row.month),
        revenueGroupNumber: row.revenueGroupNumber,
        revenueGroupName: row.revenueGroupName,
        sourceType: row.sourceType,
        priceUnit: row.priceUnit,
        quantity: Number(row.quantity),
        weightKg: Number(row.weightKg),
        revenue: Number(row.revenue),
      }),
    ),
    ...surcharges.map(
      (row): SupplierRevenueFact => ({
        supplierUuid: row.supplierUuid ?? "",
        year: Number(row.year),
        month: Number(row.month),
        revenueGroupNumber: row.revenueGroupNumber,
        revenueGroupName: row.revenueGroupName,
        sourceType: null,
        priceUnit: null,
        quantity: 0,
        weightKg: 0,
        revenue: Number(row.revenue),
      }),
    ),
  ].filter((fact) => fact.supplierUuid !== "");
};

/** The supplier columns both screens print, keyed by company uuid. */
export const getSupplierRevenueCompanies = async (
  supplierUuids: string[],
): Promise<Map<string, SupplierRevenueCompany>> => {
  if (supplierUuids.length === 0) {
    return new Map();
  }

  const visiting = companyAddressFor("visit", "visiting_address");
  const rows = await db
    .select({
      uuid: Companies.uuid,
      id: Companies.id,
      companyName: Companies.companyName,
      creditorNumber: Companies.creditorNumber,
      city: visiting.city,
      country: visiting.country,
    })
    .from(Companies)
    .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
    .where(inArray(Companies.uuid, supplierUuids));

  return new Map(
    rows.map((row) => [
      row.uuid,
      { ...row, city: row.city ?? null, country: row.country ?? null },
    ]),
  );
};
