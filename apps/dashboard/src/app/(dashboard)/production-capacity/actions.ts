"use server";
import { describeError, productionCapacityStatusFor } from "@/lib/helpers";

import { db } from "@/db";
import {
  ProductionCapacity,
  SelectProductionCapacity,
} from "@/db/schema/production-capacity";
import {
  MachineProducts,
  Machines,
  SelectMachineProducts,
  SelectMachines,
} from "@/db/schema/machines";
import { asc, desc, eq, getTableColumns, sql } from "drizzle-orm";

export type ProductionCapacityListItem = SelectProductionCapacity & {
  machineCode: SelectMachines["code"] | null;
  machineName: SelectMachines["name"] | null;
  machineType: SelectMachines["production"] | null;
  /** `Capacity u.` — the unit the machine counts its work in (M2, M1). */
  capacityUnit: SelectMachineProducts["prodUnit"] | null;
};

export type ProductionCapacityDetail = ProductionCapacityListItem & {
  /** Occupied square capacity as a share of the maximum, when there is one. */
  occupiedPercentOfMaximum: number | null;
  /** Whether occupied square capacity has passed the warning threshold. */
  pastWarning: boolean;
};

export const getProductionCapacity = async (): Promise<
  ProductionCapacityListItem[]
> => {
  try {
    const rows = await db
      .select({
        ...getTableColumns(ProductionCapacity),
        machineCode: Machines.code,
        machineName: Machines.name,
        machineType: Machines.production,
      // The unit on the machine's first-preference product line — the
      // machine itself carries no production unit.
      capacityUnit: sql<string | null>`(
        SELECT ${MachineProducts.prodUnit} FROM ${MachineProducts}
        WHERE ${MachineProducts.machineUuid} = ${Machines.uuid}
          AND ${MachineProducts.prodUnit} IS NOT NULL
        ORDER BY ${MachineProducts.preference} LIMIT 1
      )`,
      })
      .from(ProductionCapacity)
      .leftJoin(Machines, eq(ProductionCapacity.machineUuid, Machines.uuid))
      .orderBy(desc(ProductionCapacity.capacityDate), asc(Machines.code));

    // The traffic light is arithmetic, not an opinion: full at or above the
    // ceiling, warning at or above the warning line. It was a stored column
    // nobody recomputed, so a day that filled up after the row was written went
    // on showing green.
    return rows.map((row) => ({
      ...row,
      status: productionCapacityStatusFor({
        occupied:
          row.occupiedCapacity === null ? null : Number(row.occupiedCapacity),
        warning:
          row.warningCapacity === null ? null : Number(row.warningCapacity),
        maximum:
          row.maximumCapacity === null ? null : Number(row.maximumCapacity),
      }),
    }));
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch production capacity"),
    );
  }
};

/**
 * One machine-day capacity snapshot, with occupancy read against the ceiling and
 * the warning threshold.
 *
 * Both are measured on the square figures, which is the machine's primary
 * capacity measure; the not-square columns are reported alongside but are not
 * comparable to the same maximum. A snapshot with no maximum recorded has no
 * share to report rather than a misleading 0%.
 */
export const getProductionCapacityDetail = async (
  uuid: string,
): Promise<ProductionCapacityDetail | null> => {
  const [row] = await db
    .select({
      ...getTableColumns(ProductionCapacity),
      machineCode: Machines.code,
      machineName: Machines.name,
      machineType: Machines.production,
      // The unit on the machine's first-preference product line — the
      // machine itself carries no production unit.
      capacityUnit: sql<string | null>`(
        SELECT ${MachineProducts.prodUnit} FROM ${MachineProducts}
        WHERE ${MachineProducts.machineUuid} = ${Machines.uuid}
          AND ${MachineProducts.prodUnit} IS NOT NULL
        ORDER BY ${MachineProducts.preference} LIMIT 1
      )`,
    })
    .from(ProductionCapacity)
    .leftJoin(Machines, eq(ProductionCapacity.machineUuid, Machines.uuid))
    .where(eq(ProductionCapacity.uuid, uuid))
    .limit(1);

  if (!row) {
    return null;
  }

  const occupied =
    row.occupiedCapacity === null ? null : Number(row.occupiedCapacity);
  const maximum =
    row.maximumCapacity === null ? null : Number(row.maximumCapacity);
  const warning =
    row.warningCapacity === null ? null : Number(row.warningCapacity);

  return {
    ...row,
    status: productionCapacityStatusFor({ occupied, warning, maximum }),
    occupiedPercentOfMaximum:
      occupied === null || maximum === null || maximum === 0
        ? null
        : (occupied / maximum) * 100,
    pastWarning: occupied !== null && warning !== null && occupied >= warning,
  };
};
