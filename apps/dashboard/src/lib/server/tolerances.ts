import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { Products } from "@/db/schema/products";
import { isWithinTolerance, tolerancePercent } from "@/lib/helpers";

// Which row of the reference's tolerance table governs a report.
//
// 🔴 `Warehouse control → Tolerances when reporting as completed`, read off
// product `PK44115025125` on 2-10-2026:
//
// ```
// Workorder type        Qty    Kg
// Unloading wo          5%     5%
// Count workorder       0%     0%
// Picking workorder     5%     5%
// Production workorder   —     0%
// ```
//
// Four rows, three different rules, and the differences carry the meaning.
export type ToleranceKind = "unloading" | "count" | "picking" | "production";

type ToleranceBand = {
  qty: number | null;
  kg: number | null;
};

type ReportedRow = {
  qtyActual: string;
  // A weight the floor may simply not have given. The warehouse dialog carries
  // `null` for an untouched cell and the production one `undefined`, and both
  // mean the same thing: this row says nothing about kilos.
  kgActual?: string | null;
};

type ToleranceCheckParams = {
  productUuid: string | null;
  kind: ToleranceKind;
  qtyPlanned: number;
  kgPlanned: number;
  reported: ReportedRow[];
};

const KIND_LABELS: Record<ToleranceKind, string> = {
  unloading: "unloading",
  count: "count",
  picking: "picking",
  production: "production",
};

const sum = (values: number[]) => values.reduce((total, n) => total + n, 0);

const bandFor = (
  product: {
    toleranceUnloadingQty: string | null;
    toleranceUnloadingKg: string | null;
    toleranceCountQty: string | null;
    toleranceCountKg: string | null;
    tolerancePickingQty: string | null;
    tolerancePickingKg: string | null;
    toleranceProductionQty: string | null;
    toleranceProductionKg: string | null;
  },
  kind: ToleranceKind,
): ToleranceBand => {
  if (kind === "unloading") {
    return {
      qty: tolerancePercent(product.toleranceUnloadingQty),
      kg: tolerancePercent(product.toleranceUnloadingKg),
    };
  }
  if (kind === "count") {
    return {
      qty: tolerancePercent(product.toleranceCountQty),
      kg: tolerancePercent(product.toleranceCountKg),
    };
  }
  if (kind === "production") {
    return {
      qty: tolerancePercent(product.toleranceProductionQty),
      kg: tolerancePercent(product.toleranceProductionKg),
    };
  }
  return {
    qty: tolerancePercent(product.tolerancePickingQty),
    kg: tolerancePercent(product.tolerancePickingKg),
  };
};

const offBy = (planned: number, reported: number) => {
  if (planned === 0) {
    return "100";
  }
  return ((Math.abs(reported - planned) / Math.abs(planned)) * 100).toFixed(2);
};

/**
 * Refuse a report that strays further from its plan than the product allows,
 * and say by how much.
 *
 * Returns the message to show, or `null` when the report is acceptable.
 *
 * ⚠️ A tolerance of `null` is the reference leaving that cell **blank** — no
 * rule — and is not the same as `0`, which demands an exact match. Production
 * has no quantity rule at all, which is why a job may report 9 of 10 pieces and
 * still be accepted.
 */
export const breachedTolerance = async (
  params: ToleranceCheckParams,
): Promise<string | null> => {
  if (!params.productUuid) {
    return null;
  }

  const [product] = await db
    .select({
      toleranceUnloadingQty: Products.toleranceUnloadingQty,
      toleranceUnloadingKg: Products.toleranceUnloadingKg,
      toleranceCountQty: Products.toleranceCountQty,
      toleranceCountKg: Products.toleranceCountKg,
      tolerancePickingQty: Products.tolerancePickingQty,
      tolerancePickingKg: Products.tolerancePickingKg,
      toleranceProductionQty: Products.toleranceProductionQty,
      toleranceProductionKg: Products.toleranceProductionKg,
    })
    .from(Products)
    .where(eq(Products.uuid, params.productUuid))
    .limit(1);

  if (!product) {
    return null;
  }

  const band = bandFor(product, params.kind);
  const label = KIND_LABELS[params.kind];

  const qtyReported = sum(params.reported.map((row) => Number(row.qtyActual)));

  // A line with no planned quantity has nothing to be measured against. That is
  // a gap in the plan, not a breach by the floor.
  if (band.qty !== null && params.qtyPlanned > 0) {
    if (!isWithinTolerance(params.qtyPlanned, qtyReported, band.qty)) {
      return `This ${label} reports ${qtyReported} against a planned ${params.qtyPlanned} — ${offBy(params.qtyPlanned, qtyReported)} % out, where the product allows ${band.qty} %. Correct the quantity, or change the product's tolerance.`;
    }
  }

  // Weight is optional on the dialog, so a report that says nothing about kilos
  // is not a report of zero kilos.
  const weighed = params.reported.flatMap((row) =>
    typeof row.kgActual === "string" && row.kgActual.trim() !== ""
      ? [Number(row.kgActual)]
      : [],
  );
  if (band.kg === null || weighed.length === 0 || params.kgPlanned <= 0) {
    return null;
  }

  const kgReported = sum(weighed);

  // 🔑 Production scales its plan to what was actually made; the warehouse does
  // not.
  //
  // Production work order `324792` line 1 reported 9 pieces against a planned
  // 10, and its kilos went 960,00 → 864,00 — exactly `960 × 9 ÷ 10`. With no
  // quantity rule to stop it, a short run is legitimate, and the 0 % weight rule
  // then means *in equals out, piece for piece* rather than *report the full
  // plan*. A picking has a quantity rule of its own, so its kilos answer to the
  // plan as written.
  const kgTarget =
    params.kind === "production" && params.qtyPlanned > 0
      ? (params.kgPlanned * qtyReported) / params.qtyPlanned
      : params.kgPlanned;

  if (!isWithinTolerance(kgTarget, kgReported, band.kg)) {
    const target = kgTarget.toFixed(2);
    return band.kg === 0
      ? `This ${label} reports ${kgReported.toFixed(2)} kg where the balance requires ${target} kg. A ${label} work order has to close its kilos exactly.`
      : `This ${label} reports ${kgReported.toFixed(2)} kg against ${target} kg — ${offBy(kgTarget, kgReported)} % out, where the product allows ${band.kg} %.`;
  }

  return null;
};
