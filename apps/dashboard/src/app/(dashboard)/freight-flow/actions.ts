"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { FreightMovements } from "@/db/schema/freight-movements";
import { Products } from "@/db/schema/products";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { SfnCounterpartyRole } from "@/lib/enums";
import { describeError, currentYear, isDomesticCountry, toKilograms } from "@/lib/helpers";
import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// One reported period for one revenue group. Every figure is in kilograms, the
// unit the federation return is filed in.
export type FreightFlowRow = {
  year: number;
  month: number;
  revenueGroupUuid: string | null;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  startingStock: number;
  receivedFromProducers: number;
  receivedFromProducersAbroad: number;
  receivedFromSfnMembers: number;
  receivedFromNonMembers: number;
  suppliedSfn: number;
  suppliedNonSfn: number;
  deliveredAbroad: number;
  endingInventory: number;
  stockDifference: number;
  toOrderManufacturers: number;
  onOrderNonProducers: number;
  onOrderAbroad: number;
};

type Counterparty = {
  role: SfnCounterpartyRole;
  domestic: boolean;
};

export type SfnCounterpartyRow = {
  uuid: SelectCompanies["uuid"];
  code: SelectCompanies["id"];
  companyName: SelectCompanies["companyName"];
  sfnRole: SelectCompanies["sfnRole"];
  country: string | null;
  domestic: boolean;
};

export type SfnRoleActionResult = {
  error?: string;
  success?: boolean;
};

// The reasons that make a movement a purchase receipt or a sale. Everything
// else — corrections, damage, production output, cancellations — is neither
// bought in nor sold out, so it lands in "Stock difference".
const RECEIPT_REASONS = new Set(["purchase_receipt"]);
const SUPPLY_REASONS = new Set(["invoice_consumption", "sale_consumption"]);

const emptyRow = (
  year: number,
  month: number,
  group: {
    uuid: string | null;
    number: SelectRevenueGroups["number"] | null;
    name: SelectRevenueGroups["name"] | null;
  },
): FreightFlowRow => ({
  year,
  month,
  revenueGroupUuid: group.uuid,
  revenueGroupNumber: group.number,
  revenueGroupName: group.name,
  startingStock: 0,
  receivedFromProducers: 0,
  receivedFromProducersAbroad: 0,
  receivedFromSfnMembers: 0,
  receivedFromNonMembers: 0,
  suppliedSfn: 0,
  suppliedNonSfn: 0,
  deliveredAbroad: 0,
  endingInventory: 0,
  stockDifference: 0,
  toOrderManufacturers: 0,
  onOrderNonProducers: 0,
  onOrderAbroad: 0,
});

// Every company with the two things that decide which column it feeds: its
// federation role and whether it sits at home or abroad. A company with no role
// recorded counts as a non-member.
const loadCounterparties = async (): Promise<Map<string, Counterparty>> => {
  const country = sql<
    string | null
  >`(SELECT ${CompanyAddresses.country} FROM ${CompanyAddresses} WHERE ${CompanyAddresses.companyUuid} = ${Companies.uuid} ORDER BY ${CompanyAddresses.sequenceNumber} ASC LIMIT 1)`;

  const rows = await db
    .select({ uuid: Companies.uuid, sfnRole: Companies.sfnRole, country })
    .from(Companies);

  return new Map(
    rows.map((row) => [
      row.uuid,
      {
        role: row.sfnRole ?? "non_member",
        domestic: isDomesticCountry(row.country),
      },
    ]),
  );
};

const resolveCounterparty = (
  counterparties: Map<string, Counterparty>,
  uuid: string | null,
): Counterparty =>
  (uuid ? counterparties.get(uuid) : undefined) ?? {
    role: "non_member",
    domestic: true,
  };

const clampMonth = (month: number) => Math.min(12, Math.max(1, month));

// The report covers the current month.
const buildPeriods = (): Array<{ year: number; month: number }> => {
  const now = new Date();
  return [{ year: currentYear(), month: clampMonth(now.getMonth() + 1) }];
};

const periodKey = (year: number, month: number) => `${year}-${month}`;

// The monthly goods flow behind the federation (SFN) return: what was in stock
// at the start of the month, what came in and from whom, what went out and to
// whom, what is left, and what is still on order. Grouped per revenue group,
// per month, in kilograms.
//
// Receipts and sales are read off the freight-movement ledger; the residual —
// corrections, damage, production, cancellations — is reported as the stock
// difference, so starting + received − supplied + difference always equals the
// ending inventory.
export const getFreightFlow = async (): Promise<FreightFlowRow[]> => {
  try {
    const periods = buildPeriods();
    if (periods.length === 0) {
      return [];
    }

    const first = periods[0];
    const last = periods[periods.length - 1];
    const rangeStart = new Date(Date.UTC(first.year, first.month - 1, 1));
    // Exclusive upper bound: the first instant of the month after the last one.
    const rangeEnd = new Date(Date.UTC(last.year, last.month, 1));

    const counterparties = await loadCounterparties();

    // Signed movement quantity in kilograms. The ledger stores the quantity
    // unsigned, but it also stores the running balance either side of the
    // mutation, so the direction is the difference between the two.
    const movementColumns = {
      revenueGroupUuid: FreightMovements.revenueGroupUuid,
      revenueGroupNumber: RevenueGroups.number,
      revenueGroupName: RevenueGroups.name,
      reason: FreightMovements.reason,
      stockUnit: FreightMovements.stockUnit,
      supplierUuid: FreightMovements.supplierUuid,
      companyUuid: FreightMovements.companyUuid,
      theoreticalWeight: Products.theoreticalWeight,
      signedQuantity: sql<string>`(${FreightMovements.closingStockQty} - ${FreightMovements.startingStockQty})`,
      year: sql<number>`YEAR(${FreightMovements.mutationDate})`,
      month: sql<number>`MONTH(${FreightMovements.mutationDate})`,
    };

    const [openingRows, movementRows] = await Promise.all([
      // Everything that happened before the reported range, which is what the
      // first month opens with.
      db
        .select({
          revenueGroupUuid: FreightMovements.revenueGroupUuid,
          stockUnit: FreightMovements.stockUnit,
          theoreticalWeight: Products.theoreticalWeight,
          signedQuantity: sql<string>`(${FreightMovements.closingStockQty} - ${FreightMovements.startingStockQty})`,
        })
        .from(FreightMovements)
        .innerJoin(Products, eq(FreightMovements.productUuid, Products.uuid))
        .where(lt(FreightMovements.mutationDate, rangeStart)),
      db
        .select(movementColumns)
        .from(FreightMovements)
        .innerJoin(Products, eq(FreightMovements.productUuid, Products.uuid))
        .leftJoin(
          RevenueGroups,
          eq(FreightMovements.revenueGroupUuid, RevenueGroups.uuid),
        )
        .where(
          and(
            gte(FreightMovements.mutationDate, rangeStart),
            lt(FreightMovements.mutationDate, rangeEnd),
          ),
        ),
    ]);

    // Revenue groups seen anywhere in the data, so a group that only has an
    // opening balance or only outstanding orders still gets a row.
    const groups = new Map<
      string,
      {
        uuid: string | null;
        number: SelectRevenueGroups["number"] | null;
        name: SelectRevenueGroups["name"] | null;
      }
    >();
    const groupKey = (uuid: string | null) => uuid ?? "";

    const runningBalance = new Map<string, number>();
    for (const row of openingRows) {
      const key = groupKey(row.revenueGroupUuid);
      const kg = toKilograms(
        Number(row.signedQuantity ?? 0),
        row.stockUnit,
        Number(row.theoreticalWeight ?? 0),
      );
      runningBalance.set(key, (runningBalance.get(key) ?? 0) + kg);
      if (!groups.has(key)) {
        groups.set(key, {
          uuid: row.revenueGroupUuid,
          number: null,
          name: null,
        });
      }
    }

    // Movements bucketed by period and revenue group.
    const buckets = new Map<string, FreightFlowRow>();
    const bucketKey = (year: number, month: number, group: string) =>
      `${periodKey(year, month)}::${group}`;

    for (const row of movementRows) {
      const key = groupKey(row.revenueGroupUuid);
      groups.set(key, {
        uuid: row.revenueGroupUuid,
        number: row.revenueGroupNumber,
        name: row.revenueGroupName,
      });

      const year = Number(row.year);
      const month = Number(row.month);
      const cell = bucketKey(year, month, key);
      const bucket =
        buckets.get(cell) ??
        emptyRow(year, month, {
          uuid: row.revenueGroupUuid,
          number: row.revenueGroupNumber,
          name: row.revenueGroupName,
        });

      const kg = toKilograms(
        Number(row.signedQuantity ?? 0),
        row.stockUnit,
        Number(row.theoreticalWeight ?? 0),
      );

      if (RECEIPT_REASONS.has(row.reason) && kg > 0) {
        const supplier = resolveCounterparty(counterparties, row.supplierUuid);
        if (supplier.role === "producer" && supplier.domestic) {
          bucket.receivedFromProducers += kg;
        } else if (supplier.role === "producer") {
          bucket.receivedFromProducersAbroad += kg;
        } else if (supplier.role === "sfn_member") {
          bucket.receivedFromSfnMembers += kg;
        } else {
          bucket.receivedFromNonMembers += kg;
        }
      } else if (SUPPLY_REASONS.has(row.reason) && kg < 0) {
        const customer = resolveCounterparty(counterparties, row.companyUuid);
        const supplied = Math.abs(kg);
        if (!customer.domestic) {
          bucket.deliveredAbroad += supplied;
        } else if (customer.role === "sfn_member") {
          bucket.suppliedSfn += supplied;
        } else {
          bucket.suppliedNonSfn += supplied;
        }
      } else {
        // Neither bought in nor sold out — a correction, a write-off, a
        // production output or a cancelled document.
        bucket.stockDifference += kg;
      }

      buckets.set(cell, bucket);
    }

    // What is still on order with suppliers, split the same way. Outstanding
    // means ordered but not yet received; it is a position, not a movement, so
    // it is reported against the last period rather than accumulated.
    const outstanding = await db
      .select({
        revenueGroupUuid: Products.revenueGroupUuid,
        supplierUuid: PurchaseOrders.supplierUuid,
        unit: PurchaseOrderItems.unit,
        theoreticalWeight: Products.theoreticalWeight,
        openQuantity: sql<string>`(${PurchaseOrderItems.quantity} - ${PurchaseOrderItems.qtyReceived})`,
      })
      .from(PurchaseOrderItems)
      .innerJoin(
        PurchaseOrders,
        eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .innerJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
      .where(
        sql`(${PurchaseOrderItems.quantity} - ${PurchaseOrderItems.qtyReceived}) > 0`,
      );

    const onOrderByGroup = new Map<
      string,
      { producers: number; nonProducers: number; abroad: number }
    >();

    for (const row of outstanding) {
      const key = groupKey(row.revenueGroupUuid);
      const kg = toKilograms(
        Number(row.openQuantity ?? 0),
        row.unit,
        Number(row.theoreticalWeight ?? 0),
      );
      if (kg <= 0) {
        continue;
      }
      const supplier = resolveCounterparty(counterparties, row.supplierUuid);
      const totals = onOrderByGroup.get(key) ?? {
        producers: 0,
        nonProducers: 0,
        abroad: 0,
      };
      if (!supplier.domestic) {
        totals.abroad += kg;
      } else if (supplier.role === "producer") {
        totals.producers += kg;
      } else {
        totals.nonProducers += kg;
      }
      onOrderByGroup.set(key, totals);
      if (!groups.has(key)) {
        groups.set(key, {
          uuid: row.revenueGroupUuid,
          number: null,
          name: null,
        });
      }
    }

    // Walk the periods in order per revenue group, carrying the balance
    // forward so each month opens where the previous one closed.
    const result: FreightFlowRow[] = [];

    for (const [key, group] of groups) {
      let balance = runningBalance.get(key) ?? 0;

      periods.forEach((period, index) => {
        const cell = bucketKey(period.year, period.month, key);
        const row =
          buckets.get(cell) ?? emptyRow(period.year, period.month, group);

        row.startingStock = balance;
        const received =
          row.receivedFromProducers +
          row.receivedFromProducersAbroad +
          row.receivedFromSfnMembers +
          row.receivedFromNonMembers;
        const supplied =
          row.suppliedSfn + row.suppliedNonSfn + row.deliveredAbroad;
        row.endingInventory =
          balance + received - supplied + row.stockDifference;
        balance = row.endingInventory;

        // The outstanding order book is a position as at today, so it belongs
        // on the last reported period only.
        if (index === periods.length - 1) {
          const totals = onOrderByGroup.get(key);
          row.toOrderManufacturers = totals?.producers ?? 0;
          row.onOrderNonProducers = totals?.nonProducers ?? 0;
          row.onOrderAbroad = totals?.abroad ?? 0;
        }

        result.push(row);
      });
    }

    return result.sort(
      (a, b) =>
        a.year - b.year ||
        a.month - b.month ||
        (a.revenueGroupNumber ?? 0) - (b.revenueGroupNumber ?? 0),
    );
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch the freight flow"));
  }
};

// The companies the goods flow actually reports on — everyone we have bought
// from or sold to — so the classification list stays as short as the return
// needs it to be.
export const getSfnCounterparties = async (): Promise<SfnCounterpartyRow[]> => {
  const country = sql<
    string | null
  >`(SELECT ${CompanyAddresses.country} FROM ${CompanyAddresses} WHERE ${CompanyAddresses.companyUuid} = ${Companies.uuid} ORDER BY ${CompanyAddresses.sequenceNumber} ASC LIMIT 1)`;

  const traded = sql`EXISTS (SELECT 1 FROM ${FreightMovements} WHERE ${FreightMovements.supplierUuid} = ${Companies.uuid} OR ${FreightMovements.companyUuid} = ${Companies.uuid})`;

  const rows = await db
    .select({
      uuid: Companies.uuid,
      code: Companies.id,
      companyName: Companies.companyName,
      sfnRole: Companies.sfnRole,
      country,
    })
    .from(Companies)
    .where(traded)
    .orderBy(asc(Companies.companyName));

  return rows.map((row) => ({
    ...row,
    domestic: isDomesticCountry(row.country),
  }));
};

export const setSfnRole = async (
  companyUuid: string,
  role: SfnCounterpartyRole,
): Promise<SfnRoleActionResult> => {
  try {
    const [company] = await db
      .select({ uuid: Companies.uuid })
      .from(Companies)
      .where(eq(Companies.uuid, companyUuid))
      .limit(1);

    if (!company) {
      return { error: "Company not found." };
    }

    await db
      .update(Companies)
      .set({ sfnRole: role })
      .where(eq(Companies.uuid, companyUuid));

    revalidatePath("/freight-flow");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to set the SFN classification",
    };
  }
};
