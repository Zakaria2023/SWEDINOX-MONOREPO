import { db } from "@/db";
import { SelectStock, Stock } from "@/db/schema/stock";
import { StockMovements } from "@/db/schema/stock-movements";
import { StockMovementReason } from "@/lib/enums";
import {
  generateUuid,
  moneyString,
  normaliseCharge,
  restateLotValue,
  todayDateString,
} from "@/lib/helpers";
import { carryLotBatches, registerBatchForLot } from "@/lib/server/batches";
import { and, eq, ne } from "drizzle-orm";

// The Drizzle transaction handle passed into db.transaction(async (tx) => ...).
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type ApplyMoveParams = {
  source: SelectStock;
  quantity: number;
  toLocationUuid: string;
  committedToOrder: boolean;
  reason: "warehouse_transfer";
  userId: string;
  orderUuid: string | null;
  /**
   * The work order line that moved the metal. The reference puts this in a
   * column of its own and fills it on 10.464 of its 10.584 real movements,
   * leaving it empty on every one of its 2.978 corrections — so an empty one
   * means somebody adjusted the books rather than shifted anything.
   */
  warehouseWorkOrderLineUuid?: string | null;
};

type ApplyProductionConsumeParams = {
  source: SelectStock;
  quantity: number;
  userId: string;
  orderUuid: string | null;
  /** The production line that took this material to the machine. */
  productionWorkOrderLineUuid?: string | null;
};

type ApplyProductionOutputParams = {
  productUuid: string;
  quantity: number;
  quantityKg: number;
  locationUuid: string | null;
  /** The lot the material came off, whose attributes the new lot inherits. */
  template: SelectStock | null;
  /** What the whole new lot is worth. */
  value: number;
  /** Spoken for by the order it was made for, so nobody can sell it away. */
  reserved: boolean;
  reason: Extract<
    StockMovementReason,
    "production_output" | "production_remnant" | "sawing_waste"
  >;
  charge: string | null;
  internalCharge: string | null;
  remark: string | null;
  userId: string;
  orderUuid: string | null;
  /** The production line that made it. */
  productionWorkOrderLineUuid?: string | null;
};

export type ProductionConsumption = {
  /** What the material drawn out was carried at. */
  cost: number;
  /** Cost per unit of the lot it came from. */
  unitCost: number;
};

/**
 * Move a lot from one location to another.
 *
 * The quantity leaves the source lot and joins a lot of the same material
 * standing at the destination, or starts one if none is there. Value travels
 * with it, so the two lots together are worth exactly what the one was — which
 * is why an internal move posts nothing to the ledger.
 *
 * The reservation travels too. A lot picked for a customer arrives at the
 * staging shelf spoken for, which is what stops the same steel being sold twice
 * while it waits to be loaded.
 */
export const applyMove = async (
  tx: Transaction,
  params: ApplyMoveParams,
): Promise<void> => {
  const { source, quantity } = params;
  const previousQuantity = Number(source.quantity);

  if (quantity > previousQuantity) {
    throw new Error(
      `Cannot move ${quantity} — the lot only holds ${previousQuantity}.`,
    );
  }

  // Moving a lot to where it already stands would split it in two for no
  // reason. Nothing has to happen, so nothing does.
  if (source.locationUuid === params.toLocationUuid) {
    return;
  }

  const unitCost = Number(source.valuationPrice ?? 0);
  const previousValue = Number(source.valuationEuro ?? 0);
  const remainingQuantity = previousQuantity - quantity;
  const remainingValue = restateLotValue({
    previousQuantity,
    remainingQuantity,
    unitCost,
    previousValue,
  });
  const valueMoved = previousValue - remainingValue;

  // The reservation follows the goods, capped at what is actually there to
  // release. A lot picked for a customer arrives spoken for even when the bin
  // it came out of held no reservation at all — being picked is what commits
  // it, which is what stops the same steel being sold twice while it waits on
  // the staging shelf.
  const carried = Math.min(quantity, Number(source.reservedQuantity ?? 0));
  const arrivingReserved = params.committedToOrder ? quantity : carried;

  const [updated] = await tx
    .update(Stock)
    .set({
      quantity: remainingQuantity.toFixed(3),
      reservedQuantity: (
        Number(source.reservedQuantity ?? 0) - carried
      ).toFixed(3),
      valuationEuro: moneyString(remainingValue),
    })
    .where(
      and(eq(Stock.uuid, source.uuid), eq(Stock.quantity, source.quantity)),
    );

  if (updated.affectedRows === 0) {
    throw new Error(
      "The lot changed while moving it — please refresh and try again.",
    );
  }

  // Candidates are narrowed in SQL and matched in code: a lot is the same lot
  // as this one when its charge and internal charge agree, and NULL does not
  // compare equal to NULL in SQL.
  const candidates = await tx
    .select()
    .from(Stock)
    .where(
      and(
        eq(Stock.productUuid, source.productUuid),
        eq(Stock.locationUuid, params.toLocationUuid),
        eq(Stock.status, "pending"),
        ne(Stock.uuid, source.uuid),
      ),
    );

  const destination = candidates.find(
    (lot) =>
      lot.charge === source.charge &&
      lot.internalCharge === source.internalCharge &&
      lot.quality === source.quality,
  );

  const destinationUuid = destination?.uuid ?? generateUuid();

  if (destination) {
    await tx
      .update(Stock)
      .set({
        quantity: (Number(destination.quantity) + quantity).toFixed(3),
        reservedQuantity: (
          Number(destination.reservedQuantity ?? 0) + arrivingReserved
        ).toFixed(3),
        valuationEuro: moneyString(
          Number(destination.valuationEuro ?? 0) + valueMoved,
        ),
      })
      .where(eq(Stock.uuid, destination.uuid));
  } else {
    const {
      id: _id,
      uuid: _uuid,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...attributes
    } = source;

    // Everything else about the lot travels with it — its charge, its quality,
    // its supplier, the purchase it arrived on, whether it is blocked — because
    // it is the same steel standing somewhere else. Only where it is, how much
    // of it there is and what that much is worth are new. The status is stated
    // rather than copied: a lot that has just been put down is holding goods.
    await tx.insert(Stock).values({
      ...attributes,
      uuid: destinationUuid,
      locationUuid: params.toLocationUuid,
      status: "pending",
      quantity: quantity.toFixed(3),
      reservedQuantity: arrivingReserved.toFixed(3),
      valuationEuro: moneyString(valueMoved),
    });
  }

  // The batches travel with the steel, so a sheet on its new rack still traces
  // to the receipt it came in on.
  await carryLotBatches(tx, source.uuid, destinationUuid, quantity);

  // Two movements, because two lots changed. Netting them into one would leave
  // the stock ledger unable to say where the material actually went.
  await tx.insert(StockMovements).values([
    {
      uuid: generateUuid(),
      productUuid: source.productUuid,
      stockUuid: source.uuid,
      type: "out",
      reason: params.reason,
      quantity: quantity.toFixed(3),
      orderUuid: params.orderUuid,
      warehouseWorkOrderLineUuid: params.warehouseWorkOrderLineUuid,
      createdByUserId: params.userId,
    },
    {
      uuid: generateUuid(),
      productUuid: source.productUuid,
      stockUuid: destinationUuid,
      type: "in",
      reason: params.reason,
      quantity: quantity.toFixed(3),
      orderUuid: params.orderUuid,
      warehouseWorkOrderLineUuid: params.warehouseWorkOrderLineUuid,
      createdByUserId: params.userId,
    },
  ]);
};

/**
 * Take material off a lot and into the machine.
 *
 * This is the destroying half of a cut: the steel that goes on the bed stops
 * existing as the lot it was, and what comes off is described separately. So
 * the lot is drawn down and restated — a lot that keeps its old total while
 * holding less material is a lot that has quietly become worth more per kilo,
 * and stock valuation drifts up with every run.
 *
 * The reservation is released with the material. It was held for the order this
 * run is for, and that claim is about to be satisfied by the pieces the machine
 * produces, not by the plate it ate.
 *
 * The update is conditional on the lot still holding what it held when it was
 * read. Two people reporting the same run at once would otherwise both consume
 * it; instead the second one fails and is told to report again, which is what
 * the reference system does.
 */
export const applyProductionConsume = async (
  tx: Transaction,
  params: ApplyProductionConsumeParams,
): Promise<ProductionConsumption> => {
  const { source, quantity } = params;
  const previousQuantity = Number(source.quantity);

  if (quantity > previousQuantity) {
    throw new Error(
      `Cannot take ${quantity} to the machine — the lot only holds ${previousQuantity}.`,
    );
  }

  const unitCost = Number(source.valuationPrice ?? 0);
  const previousValue = Number(source.valuationEuro ?? 0);
  const remainingQuantity = previousQuantity - quantity;
  const remainingValue = restateLotValue({
    previousQuantity,
    remainingQuantity,
    unitCost,
    previousValue,
  });

  const released = Math.min(quantity, Number(source.reservedQuantity ?? 0));

  const [updated] = await tx
    .update(Stock)
    .set({
      quantity: remainingQuantity.toFixed(3),
      reservedQuantity: (
        Number(source.reservedQuantity ?? 0) - released
      ).toFixed(3),
      valuationEuro: moneyString(remainingValue),
    })
    .where(
      and(eq(Stock.uuid, source.uuid), eq(Stock.quantity, source.quantity)),
    );

  if (updated.affectedRows === 0) {
    throw new Error(
      "The stock positions changed while reporting — please report the run again.",
    );
  }

  await tx.insert(StockMovements).values({
    uuid: generateUuid(),
    productUuid: source.productUuid,
    stockUuid: source.uuid,
    type: "out",
    reason: "production_input",
    quantity: quantity.toFixed(3),
    orderUuid: params.orderUuid,
    productionWorkOrderLineUuid: params.productionWorkOrderLineUuid,
    createdByUserId: params.userId,
  });

  return { cost: previousValue - remainingValue, unitCost };
};

/**
 * Put what came off the machine on a location, as a lot of its own.
 *
 * A cut mints new material: pieces that did not exist before, in a size nobody
 * stocked, carrying whatever share of the run's cost belongs to them. It is a
 * new lot rather than an addition to an existing one because it has its own
 * dimensions — merging it into the plate it was cut from would lose exactly the
 * thing that makes it sellable.
 *
 * The charge is inherited, not minted. Steel is traceable to the heat it was
 * poured from, and cutting a plate does not change which heat it came out of —
 * a certificate follows the material through the machine.
 */
export const applyProductionOutput = async (
  tx: Transaction,
  params: ApplyProductionOutputParams,
): Promise<string> => {
  const stockUuid = generateUuid();
  const { template, quantity } = params;

  const attributes = template
    ? (() => {
        const {
          id: _id,
          uuid: _uuid,
          createdAt: _createdAt,
          updatedAt: _updatedAt,
          ...rest
        } = template;
        return rest;
      })()
    : null;

  await tx.insert(Stock).values({
    ...attributes,
    uuid: stockUuid,
    productUuid: params.productUuid,
    locationUuid: params.locationUuid,
    status: "pending",
    quantity: quantity.toFixed(3),
    reservedQuantity: params.reserved ? quantity.toFixed(3) : "0.000",
    quantityKg: params.quantityKg.toFixed(2),
    charge: normaliseCharge(params.charge),
    internalCharge: normaliseCharge(params.internalCharge),
    remark: params.remark,
    valuationPrice: (quantity > 0 ? params.value / quantity : 0).toFixed(4),
    valuationEuro: moneyString(params.value),
  });

  // What comes off the machine is a batch row of its own under the heat and
  // internal charge it was cut from, dated today — the reference's decoil and
  // production rows. Waste carries no charge and registers nothing.
  await registerBatchForLot(tx, stockUuid, { date: todayDateString() });

  await tx.insert(StockMovements).values({
    uuid: generateUuid(),
    productUuid: params.productUuid,
    stockUuid,
    type: "in",
    reason: params.reason,
    quantity: quantity.toFixed(3),
    orderUuid: params.orderUuid,
    productionWorkOrderLineUuid: params.productionWorkOrderLineUuid,
    createdByUserId: params.userId,
  });

  return stockUuid;
};
