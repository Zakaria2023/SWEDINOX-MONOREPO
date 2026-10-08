import { db } from "@/db";
import { SelectStock, Stock } from "@/db/schema/stock";
import {
  InsertStockMovements,
  StockMovements,
} from "@/db/schema/stock-movements";
import {
  StockCorrectionReason,
  StockMovementReason,
  TransferReason,
} from "@/lib/enums";
import {
  generateUuid,
  lotLedger,
  lotOrigin,
  moneyString,
  normaliseCharge,
  restateLotValue,
  stockAttributeChanges,
  StockAttributeChange,
  StockCorrectableValues,
  stockCorrectionReasonRules,
  todayDateString,
  unitCostString,
  STOCK_QUANTITY_SCALE,
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

type ApplyStockCorrectionParams = {
  source: SelectStock;
  /** The reference's `Reden`, which it will not let you leave empty. */
  reason: StockCorrectionReason;
  /** Its `Voorraadmutatie omschrijving` — free text, carried onto every row. */
  description: string | null;
  /**
   * The quantity leg, from `Voorraad hoeveelheid correctie`. Left out when that
   * checkbox is unticked, which is not the same as correcting to the figure the
   * lot already holds.
   */
  quantity?: number;
  quantityKg?: number;
  /**
   * The attributes the dialog offered, and only those.
   *
   * Partial on purpose: an absent key means the dialog never asked about that
   * field, which is different from asking and being given nothing. See
   * `stockAttributeChanges`.
   */
  attributes?: Partial<StockCorrectableValues>;
  /**
   * `Zaagopdracht` on the dialog — the saw order this correction is blamed on.
   *
   * 🔑 The missing link between a correction and the job that caused it. When a
   * cut loses material, the correction that writes the loss off points at the
   * work order that ate it, which is what makes sawing waste attributable
   * instead of just absent. The reference offers it as a two-column picker
   * (`Opdracht` / `Ordernr`), empty on the captured lot.
   */
  sawOrderUuid?: string | null;
  userId: string;
};

type StockCorrectionOutcome = {
  /** How many rows went into the ledger — the reference writes none. */
  movements: number;
  attributeChanges: StockAttributeChange[];
  /** The ledger rows themselves, which is what a simulation shows. */
  rows: InsertStockMovements[];
};

type ApplyStockSplitParams = {
  source: SelectStock;
  /** `Hoeveelheid` — how many pieces come off. Never the whole lot. */
  quantity: number;
  /**
   * `Gewogen gewicht` — what the pieces coming off actually read on the scale.
   *
   * Stated rather than apportioned, which is the entire reason the reference's
   * dialog carries a weight box. `null` means nobody weighed them.
   */
  weighedWeightKg?: number | null;
  /** `Naar locatie`, optional — two lots on one shelf is a legal outcome. */
  toLocationUuid?: string | null;
  /** `Ind. reserveringen` — whether the claim travels with the pieces. */
  includeReservations: boolean;
  /** `Met onderhanden opdrachten` in the dialog's header ledger. */
  onOpenWorkOrders?: number;
  /** `Geplande verplaatsingen` in the dialog's header ledger. */
  plannedMoves?: number;
};

type StockSplitOutcome = {
  splitStockUuid: string;
  remainingQuantity: number;
  /** `Totaal splitsbaar`, so the caller can report what the ceiling was. */
  totalSplittable: number;
};

type ApplyStockTransferParams = {
  source: SelectStock;
  quantity: number;
  /** `Naar Artikel` — the field that makes this a transfer and not a move. */
  toProductUuid: string;
  /** `Naar locatie`, optional: a transfer may re-shelve at the same time. */
  toLocationUuid?: string | null;
  /** `Reden`, whose one legal value is `transfer`. */
  reason: TransferReason;
  /** `Vooraadmutatie omschrijving` — carried onto both ledger rows. */
  description: string | null;
  // 🔑 Deliberately **no** quality or dimensions.
  //
  // It is tempting to stamp the receiving article's nominal shape onto the lot,
  // since a transfer re-declares what the metal is. It would be wrong: a lot's
  // `lengthMm`/`widthMm`/`thicknessMm` are **its own measurements**, and every
  // kilo derived from the row has to come from them rather than from the
  // article's nominal ones. A plate of nominal 1,50 mm measuring 1,44 weighs
  // what 1,44 weighs, and overwriting it with 1,50 would silently restate the
  // bundle's weight.
  //
  // Re-classifying says "this metal was booked under the wrong code". It does
  // not say the tape measure was wrong.
  onOpenWorkOrders?: number;
  plannedMoves?: number;
  userId: string;
};

type StockTransferOutcome = {
  transferredStockUuid: string;
  remainingQuantity: number;
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
 * Moving **all** of it relocates the row — same uuid, same valuation, same
 * everything, standing somewhere else. Moving **part** of it splits a new lot
 * off for the part that travelled. Value travels either way, so what stands
 * afterwards is worth exactly what stood before, which is why an internal move
 * posts nothing to the ledger.
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

  // 🔴 A relocation moves the row. It does not mint a new identity.
  //
  // Proved on 30-9-2026 by driving picking work order `323526` end to end and
  // exporting `Stock on location` before and after: **14 rows before, 14 rows
  // after**. Three lots left their shelves for `Laad` and three rows changed
  // location. Nothing was created, nothing was left behind at zero, and every
  // lot kept its valuation price and its stock category.
  //
  // Splitting the whole lot in two — drawing the source down to nothing and
  // inserting a fresh uuid at the destination — is how this used to work, and
  // it was wrong twice over. It left a zero-quantity ghost at the old location
  // for every pick ever made, and it silently changed the lot's uuid, which is
  // the one identifier we have that the reference does not. Everything holding
  // that uuid — the order line that reserved it, its batch certificates, its
  // movements — would have been left pointing at an empty row.
  if (remainingQuantity === 0) {
    const [relocated] = await tx
      .update(Stock)
      .set({
        locationUuid: params.toLocationUuid,
        reservedQuantity: arrivingReserved.toFixed(STOCK_QUANTITY_SCALE),
      })
      .where(
        and(eq(Stock.uuid, source.uuid), eq(Stock.quantity, source.quantity)),
      );

    if (relocated.affectedRows === 0) {
      throw new Error(
        "The lot changed while moving it — please refresh and try again.",
      );
    }

    // Same lot, so there is nothing to carry and nothing the ledger would
    // learn from two rows naming one uuid twice.
    return;
  }

  const [updated] = await tx
    .update(Stock)
    .set({
      quantity: remainingQuantity.toFixed(STOCK_QUANTITY_SCALE),
      reservedQuantity: (
        Number(source.reservedQuantity ?? 0) - carried
      ).toFixed(STOCK_QUANTITY_SCALE),
      valuationEuro: moneyString(remainingValue),
      // Taking part of a bundle breaks its banding, and nothing puts that back.
      unopened: false,
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

  // 🔴 What the part that travelled is allowed to join.
  //
  // The same 30-9-2026 export settles this too. `Laad` ended the day holding
  // `402156` and `402158` as **two rows** — same heat `SD40826`, same internal
  // charge `26AOCX`, same price — because they are two parcels. And it held
  // `402152` at € 1 537,61789 beside `402155` at € 1 345,19975 under the one
  // internal charge `26AOCW`. So neither the parcel number nor the price may be
  // folded away.
  //
  // Price is the one that costs money. Merging a lot into a neighbour carried
  // at a different price leaves the receiving row's `valuation_euro` no longer
  // equal to its quantity times its `valuation_price`, and every margin drawn
  // off that lot afterwards is taken at a rate nothing on the row justifies.
  const destination = candidates.find(
    (lot) =>
      lot.charge === source.charge &&
      lot.internalCharge === source.internalCharge &&
      lot.internalBatch === source.internalBatch &&
      lot.quality === source.quality &&
      lot.stockCategory === source.stockCategory &&
      Number(lot.valuationPrice ?? 0) === unitCost,
  );

  const destinationUuid = destination?.uuid ?? generateUuid();

  if (destination) {
    await tx
      .update(Stock)
      .set({
        quantity: (Number(destination.quantity) + quantity).toFixed(
          STOCK_QUANTITY_SCALE,
        ),
        reservedQuantity: (
          Number(destination.reservedQuantity ?? 0) + arrivingReserved
        ).toFixed(STOCK_QUANTITY_SCALE),
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
      quantity: quantity.toFixed(STOCK_QUANTITY_SCALE),
      reservedQuantity: arrivingReserved.toFixed(STOCK_QUANTITY_SCALE),
      valuationEuro: moneyString(valueMoved),
      // The part that travelled came out of a bundle somebody cut open, so it
      // is not an intact one either.
      unopened: false,
    });
  }

  // The batches travel with the steel, so a sheet on its new rack still traces
  // to the receipt it came in on.
  await carryLotBatches(tx, source.uuid, destinationUuid, quantity);

  // 🔴 An internal relocation is not a mutation.
  //
  // Proved twice. Watched on 21-9-2026: picking five plates from `Ontvangst` to
  // `Laad` moved the stock and produced **no** row on the reference's `Stock
  // mutations` for that day — the only five rows were that morning's receipt.
  // And its own 13.562-row mutations export carries nineteen reasons, not one
  // of which is a location-to-location move: goods in, goods out, production,
  // conversion, corrections and the two external-processing legs, and nothing
  // else.
  //
  // So the mutations ledger books what changes how much the company holds or
  // what it is worth. Shifting a lot across the yard changes neither. Writing
  // two rows for it inflated the ledger with traffic and made it disagree with
  // the reference on every internal move.
  //
  // The lots still move; `Stock` above is what records where the material is.
  if (params.reason === "warehouse_transfer") {
    return;
  }

  // Two movements, because two lots changed. Netting them into one would leave
  // the stock ledger unable to say where the material actually went.
  await tx.insert(StockMovements).values([
    {
      uuid: generateUuid(),
      productUuid: source.productUuid,
      stockUuid: source.uuid,
      type: "out",
      reason: params.reason,
      quantity: quantity.toFixed(STOCK_QUANTITY_SCALE),
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
      quantity: quantity.toFixed(STOCK_QUANTITY_SCALE),
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
      quantity: remainingQuantity.toFixed(STOCK_QUANTITY_SCALE),
      reservedQuantity: (
        Number(source.reservedQuantity ?? 0) - released
      ).toFixed(STOCK_QUANTITY_SCALE),
      valuationEuro: moneyString(remainingValue),
      // Issuing part of a bundle breaks its banding for good.
      unopened: false,
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
    quantity: quantity.toFixed(STOCK_QUANTITY_SCALE),
    ...lotOrigin(source),
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
 *
 * 🔑 **Proved on the reference's own ledger (G9, 7-10-2026):** all 184
 * `Rest production` offcuts with an internal charge share it with the lot they
 * were cut from, and carry that lot's supplier, heat and purchase order on the
 * mutation row itself. So the lot copies every attribute of its template, and
 * the `in` movement is stamped with the template's origin exactly as a
 * consumption is — an offcut with no mill on its mutation would break the
 * chain the reference keeps.
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
    quantity: quantity.toFixed(STOCK_QUANTITY_SCALE),
    reservedQuantity: params.reserved
      ? quantity.toFixed(STOCK_QUANTITY_SCALE)
      : "0.000",
    quantityKg: params.quantityKg.toFixed(STOCK_QUANTITY_SCALE),
    charge: normaliseCharge(params.charge),
    internalCharge: normaliseCharge(params.internalCharge),
    remark: params.remark,
    valuationPrice: unitCostString(quantity > 0 ? params.value / quantity : 0),
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
    quantity: quantity.toFixed(STOCK_QUANTITY_SCALE),
    ...lotOrigin(template ?? {}),
    orderUuid: params.orderUuid,
    productionWorkOrderLineUuid: params.productionWorkOrderLineUuid,
    createdByUserId: params.userId,
  });

  return stockUuid;
};

/**
 * One of the weighbridge's three figures off a form.
 *
 * `undefined` means the dialog never offered the field, so the lot keeps what
 * it had. An empty string means somebody cleared it on purpose, which is a real
 * instruction and becomes `null` — a bundle whose weight is unknown again.
 */
const weightOrKeep = (
  value: string | number | null | undefined,
  current: string | null,
): string | null => {
  if (value === undefined) {
    return current;
  }
  if (value === null || String(value).trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(3) : current;
};

/** A dimension off a form, as the integer column wants it or not at all. */
const numberOrNull = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
};

/**
 * Correct a lot by hand — the reference's `Correction…`, with the hole in it
 * filled.
 *
 * 🔴 Item 26b. Watched on 29-9-2026: the dialog was run twice on lot `404763`,
 * the second time downgrading it `Standaard` → `2nd choice`. The change took —
 * `Stock on location` reads `2nd choice` on that bundle now — and **no mutation
 * was written either time**, checked with the day's date on both sides of the
 * filter and nothing in the search box. One mutation exists for the whole of
 * that day and it is the return's receipt.
 *
 * So the reference's ledger records quantity and value movement and nothing
 * else. A prime bundle became 2nd choice and the books show who did it: nobody,
 * never, from nothing. That matters because the category decides what the metal
 * may be sold as, it is the basis of the 2nd-choice split in the stock
 * analysis, and item 22 showed the order-line picker offers both choices
 * together unless somebody filters — so a silent downgrade moves tonnage
 * between those buckets invisibly.
 *
 * Ours writes it down. One `adjust` row per attribute that actually changed,
 * carrying the value before, the value after, the reason and the operator.
 *
 * The rest follows the dialog as watched:
 *
 * - **A reason is mandatory.** `OK` stays greyed until `Reden` is chosen, so
 *   this refuses without one rather than defaulting to a catch-all.
 * - **A correction is two corrections**, each with its own checkbox, and either
 *   or both may run. A quantity correction moves metal; a characteristic
 *   correction does not.
 * - **`Opmerking voorraad toevoegen/aanpassen` may not move metal at all.** It
 *   is annotation. A remark edit that wrote a stock movement would put a
 *   phantom row in a ledger finance reconciles against.
 * - **There is no valuation field anywhere in the dialog**, so this does not
 *   offer one either. A correction cannot repair the € 0 on a returned lot;
 *   `Change APP…` or a finance screen has to, which is what makes O9 the only
 *   route left for item 25's zero-valued lot.
 *
 * Reserved quantity is the one thing a quantity correction cannot ignore: a lot
 * corrected down below what is already spoken for would leave reservations
 * pointing at metal that is not there, so it is refused rather than silently
 * releasing somebody's claim.
 */
export const applyStockCorrection = async (
  tx: Transaction,
  params: ApplyStockCorrectionParams,
): Promise<StockCorrectionOutcome> => {
  const { source, reason, userId } = params;
  const rules = stockCorrectionReasonRules[reason];

  const previousQuantity = Number(source.quantity);
  const nextQuantity = params.quantity ?? previousQuantity;
  const quantityDelta = nextQuantity - previousQuantity;

  if (quantityDelta !== 0 && !rules.movesMetal) {
    throw new Error(
      "A stock remark correction cannot change the quantity. Choose a reason that moves metal.",
    );
  }

  if (nextQuantity < 0) {
    throw new Error("A lot cannot be corrected to a negative quantity.");
  }

  const reserved = Number(source.reservedQuantity ?? 0);
  if (nextQuantity < reserved) {
    throw new Error(
      `${reserved} is already reserved on this lot — it cannot be corrected below that. Release the reservations first.`,
    );
  }

  // What the lot says now, which is both the left-hand side of every comparison
  // and the fallback for every field the dialog left alone.
  const currentAttributes: StockCorrectableValues = {
    stock_category: source.stockCategory,
    quality: source.quality,
    length_mm: source.lengthMm,
    width_mm: source.widthMm,
    thickness_mm: source.thicknessMm,
    remark: source.remark,
    weighed_weight_kg: source.weighedWeightKg,
    gross_weight_kg: source.grossWeightKg,
    net_weight_kg: source.netWeightKg,
  };

  const changes = stockAttributeChanges(
    currentAttributes,
    params.attributes ?? {},
  );

  const previousKg = Number(source.quantityKg ?? 0);
  const nextKg = params.quantityKg ?? previousKg;
  const kgDelta = nextKg - previousKg;

  if (quantityDelta === 0 && kgDelta === 0 && changes.length === 0) {
    throw new Error("Nothing was changed, so there is nothing to correct.");
  }

  // The value follows the quantity at the lot's own carried price, which is
  // what every other movement does. A correction has no price field of its own,
  // so it cannot revalue — only restate what the remaining quantity is worth.
  const unitCost = Number(source.valuationPrice ?? 0);
  const previousValue = Number(source.valuationEuro ?? 0);
  const nextValue =
    quantityDelta === 0
      ? previousValue
      : restateLotValue({
          previousQuantity,
          remainingQuantity: nextQuantity,
          unitCost,
          previousValue,
        });

  const [updated] = await tx
    .update(Stock)
    .set({
      quantity: nextQuantity.toFixed(STOCK_QUANTITY_SCALE),
      quantityKg: nextKg.toFixed(STOCK_QUANTITY_SCALE),
      valuationEuro: moneyString(nextValue),
      stockCategory: params.attributes?.stock_category
        ? String(params.attributes.stock_category)
        : source.stockCategory,
      quality: params.attributes?.quality
        ? String(params.attributes.quality)
        : source.quality,
      lengthMm: numberOrNull(params.attributes?.length_mm) ?? source.lengthMm,
      widthMm: numberOrNull(params.attributes?.width_mm) ?? source.widthMm,
      thicknessMm:
        params.attributes?.thickness_mm !== undefined &&
        params.attributes?.thickness_mm !== null &&
        String(params.attributes.thickness_mm).trim() !== ""
          ? String(params.attributes.thickness_mm)
          : source.thicknessMm,
      remark:
        params.attributes?.remark !== undefined
          ? (params.attributes.remark as string | null)
          : source.remark,
      // The weighbridge's three. Blank clears them rather than being ignored:
      // "this bundle has not been weighed" is a state somebody has to be able
      // to get a lot back into after a mis-keyed figure, and `gross − tare =
      // net = weighed` only holds while the numbers on it are real.
      weighedWeightKg: weightOrKeep(
        params.attributes?.weighed_weight_kg,
        source.weighedWeightKg,
      ),
      grossWeightKg: weightOrKeep(
        params.attributes?.gross_weight_kg,
        source.grossWeightKg,
      ),
      netWeightKg: weightOrKeep(
        params.attributes?.net_weight_kg,
        source.netWeightKg,
      ),
    })
    .where(
      and(eq(Stock.uuid, source.uuid), eq(Stock.quantity, source.quantity)),
    );

  if (updated.affectedRows === 0) {
    throw new Error(
      "The lot changed while the correction was open — reload it and correct it again.",
    );
  }

  const rows: InsertStockMovements[] = [];

  // The quantity leg. One row, signed by the direction it went, because a
  // correction that finds less metal than the books say is an issue and one
  // that finds more is a receipt — the reason decides which reason code, the
  // sign decides the type.
  if (quantityDelta !== 0 || kgDelta !== 0) {
    rows.push({
      uuid: generateUuid(),
      productUuid: source.productUuid,
      stockUuid: source.uuid,
      type: quantityDelta < 0 || kgDelta < 0 ? "out" : "in",
      reason: rules.movementReason,
      correctionReason: reason,
      quantity: Math.abs(quantityDelta).toFixed(STOCK_QUANTITY_SCALE),
      quantityKg: Math.abs(kgDelta).toFixed(2),
      valueEur: moneyString(Math.abs(nextValue - previousValue)),
      note: params.description,
      productionWorkOrderLineUuid: params.sawOrderUuid ?? null,
      createdByUserId: userId,
    });
  }

  // 🔴 And the leg the reference does not write at all.
  changes.forEach((change) => {
    rows.push({
      uuid: generateUuid(),
      productUuid: source.productUuid,
      stockUuid: source.uuid,
      type: "adjust",
      reason: rules.movementReason,
      correctionReason: reason,
      attribute: change.attribute,
      valueBefore: change.before,
      valueAfter: change.after,
      // Nothing moved, and that is the point of the row: it is here so the
      // change is on the record, not so the totals shift.
      quantity: "0.000",
      quantityKg: "0.00",
      valueEur: "0.00",
      note: params.description,
      productionWorkOrderLineUuid: params.sawOrderUuid ?? null,
      createdByUserId: userId,
    });
  });

  await tx.insert(StockMovements).values(rows);

  return { movements: rows.length, attributeChanges: changes, rows };
};

/**
 * Split a lot in two — the reference's `Splits voorraad`.
 *
 * Captured 5-10-2026, and it is the one dialog we had already guessed right.
 * Its fields are `Hoeveelheid`, **`Gewogen gewicht`**, `Naar locatie` and
 * ☐ `Ind. reserveringen`, and what matters is what is *missing* against
 * `Verplaatsen`: there is **no `Reden` and no `Uitvoerdatum`**. So a split is
 * not planned warehouse work that becomes an order — it happens when OK is
 * pressed.
 *
 * 🔑 **The weighed weight is stated, not apportioned.** This is the whole
 * reason the dialog has a weight box at all: the pieces coming off the bundle
 * get put on the scale, and what they read is what they read. Apportioning the
 * parent's weight by quantity would invent a figure for metal that was actually
 * weighed — and it is exactly the assumption a live purchase split has already
 * contradicted once, where two receptions of one 151 kg line carried 158 kg and
 * 101 kg.
 *
 * The **theoretical** weight does apportion, because it is arithmetic off the
 * article's dimensions rather than an observation. The two behave differently
 * and that is the point of carrying both.
 *
 * 🔑 **A reserved lot can be split**, same as it can be moved — the ledger read
 * `Gereserveerd en splitsbaar: 25` on a lot reserved in full. `Ind.
 * reserveringen` decides whether the claim travels with the pieces or stays
 * with what is left behind.
 *
 * No movement rows. A split changes neither how much the company holds nor what
 * it is worth, and the reference's own nineteen mutation reasons contain nothing
 * for it — the same rule that keeps an internal relocation out of the ledger.
 */
export const applyStockSplit = async (
  tx: Transaction,
  params: ApplyStockSplitParams,
): Promise<StockSplitOutcome> => {
  const { source, quantity } = params;
  const previousQuantity = Number(source.quantity);
  const reserved = Number(source.reservedQuantity ?? 0);

  if (quantity <= 0) {
    throw new Error("Enter how much to split off.");
  }

  // The whole lot is not a split — it is the lot. The reference greys `OK` out
  // rather than letting somebody create a duplicate and an empty parent.
  if (quantity >= previousQuantity) {
    throw new Error(
      `Splitting off ${quantity} would take the whole lot, which holds ${previousQuantity}. Relocate it instead.`,
    );
  }

  // `Totaal splitsbaar` from the dialog's own header. Metal already committed
  // to an open work order or already scheduled to move cannot be split away
  // underneath the job that is waiting for it.
  const ledger = lotLedger({
    quantity: source.quantity,
    reservedQuantity: source.reservedQuantity,
    onOpenWorkOrders: params.onOpenWorkOrders ?? 0,
    plannedMoves: params.plannedMoves ?? 0,
  });

  if (quantity > ledger.totalMovable) {
    throw new Error(
      `Only ${ledger.totalMovable} of this lot can be split — the rest is on an open work order or already scheduled to move.`,
    );
  }

  // `Ind. reserveringen`: ticked, the claim goes with the pieces; unticked, it
  // stays with the parent. Either way it is capped at what exists to carry, and
  // leaving it behind is refused when the parent would then be holding a claim
  // on more metal than it has.
  const carriedReservation = params.includeReservations
    ? Math.min(quantity, reserved)
    : 0;
  const remainingQuantity = previousQuantity - quantity;
  const remainingReservation = reserved - carriedReservation;

  if (remainingReservation > remainingQuantity) {
    throw new Error(
      `${remainingReservation} would stay reserved on a lot holding only ${remainingQuantity}. Tick "include reservations" so the claim travels with the pieces.`,
    );
  }

  const unitCost = Number(source.valuationPrice ?? 0);
  const previousValue = Number(source.valuationEuro ?? 0);
  const remainingValue = restateLotValue({
    previousQuantity,
    remainingQuantity,
    unitCost,
    previousValue,
  });
  const valueSplit = previousValue - remainingValue;

  // The theoretical weight is arithmetic, so it apportions by quantity.
  const previousTheoretical = Number(source.quantityKg ?? 0);
  const splitTheoretical =
    previousQuantity === 0
      ? 0
      : (previousTheoretical * quantity) / previousQuantity;
  const remainingTheoretical = previousTheoretical - splitTheoretical;

  // 🔑 The weighed weight does not. What the scale said about the pieces coming
  // off is what the new lot carries, and the parent keeps the remainder of what
  // it had — floored at zero rather than going negative, because somebody
  // re-weighing a bundle and finding more than the books said is a real event
  // and not a reason to refuse the split.
  const splitWeighed = params.weighedWeightKg ?? null;
  const previousWeighed =
    source.weighedWeightKg === null ? null : Number(source.weighedWeightKg);
  const remainingWeighed =
    previousWeighed === null
      ? null
      : Math.max(previousWeighed - (splitWeighed ?? 0), 0);

  const [updated] = await tx
    .update(Stock)
    .set({
      quantity: remainingQuantity.toFixed(STOCK_QUANTITY_SCALE),
      reservedQuantity: remainingReservation.toFixed(STOCK_QUANTITY_SCALE),
      quantityKg: remainingTheoretical.toFixed(STOCK_QUANTITY_SCALE),
      weighedWeightKg:
        remainingWeighed === null ? null : remainingWeighed.toFixed(3),
      // The gross and net figures described a bundle that no longer exists as
      // one bundle. Clearing them says "re-weigh this" rather than leaving two
      // halves both claiming the whole bundle's gross weight.
      grossWeightKg: null,
      netWeightKg: null,
      valuationEuro: moneyString(remainingValue),
      // Taking pieces off a bundle breaks its banding, and nothing puts it back.
      unopened: false,
    })
    .where(
      and(eq(Stock.uuid, source.uuid), eq(Stock.quantity, source.quantity)),
    );

  if (updated.affectedRows === 0) {
    throw new Error(
      "The lot changed while the split was open — reload it and split it again.",
    );
  }

  const {
    id: _id,
    uuid: _uuid,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...attributes
  } = source;

  const splitUuid = generateUuid();

  // 🔴 A split always mints a new lot, unlike a relocation, which moves the row
  // it already has. That is the difference between the two acts: relocating
  // asks where one bundle is, splitting says there are now two. It is also why
  // `Naar locatie` is optional here — the halves may well stay on the same
  // shelf and still be two lots.
  await tx.insert(Stock).values({
    ...attributes,
    uuid: splitUuid,
    locationUuid: params.toLocationUuid ?? source.locationUuid,
    status: "pending",
    quantity: quantity.toFixed(STOCK_QUANTITY_SCALE),
    reservedQuantity: carriedReservation.toFixed(STOCK_QUANTITY_SCALE),
    quantityKg: splitTheoretical.toFixed(STOCK_QUANTITY_SCALE),
    weighedWeightKg: splitWeighed === null ? null : splitWeighed.toFixed(3),
    grossWeightKg: null,
    netWeightKg: null,
    valuationEuro: moneyString(valueSplit),
    unopened: false,
  });

  // The batches travel with the steel, so each half still traces to the receipt
  // it arrived on.
  await carryLotBatches(tx, source.uuid, splitUuid, quantity);

  return {
    splitStockUuid: splitUuid,
    remainingQuantity,
    totalSplittable: ledger.totalMovable,
  };
};

/**
 * Transfer a lot to **another article** — the reference's `Overboeken…`,
 * titled `Aanmaken overboekingsopdracht`.
 *
 * 🔑 One field separates this from `Verplaatsen`: **`Naar Artikel`**.
 * Relocating moves a lot to another *location*; transferring moves it to
 * another *article*, optionally to another location at the same time. It is
 * re-classification — the act of deciding a lot is really a different product
 * than it was booked as, which is what happens when a receipt was keyed against
 * the wrong code or a grade is re-read off a certificate.
 *
 * `Reden` has exactly one value, `Transfer`. A one-member enum is still stored,
 * because the mutation reads it.
 *
 * 🔑 **Unlike every other internal act, this one writes to the ledger.** The
 * rule that keeps relocations out is that they change neither how much the
 * company holds nor what it is worth. A transfer breaks that rule in the first
 * clause: article A holds less afterwards and article B holds more, so a stock
 * report totalled by article would disagree with itself across the move. Two
 * rows, `stock_transfer_out` and `stock_transfer_in`, for the same reason a
 * relocation writes two — netting them would hide which article lost.
 *
 * ⚠️ Value travels at the source lot's own carried price. A transfer has no
 * price field, so it cannot revalue: the receiving article inherits what the
 * metal was already carried at, and the company's total stock value is
 * unchanged across the move. That invariant is what makes this safe to run
 * without a finance posting.
 */
export const applyStockTransfer = async (
  tx: Transaction,
  params: ApplyStockTransferParams,
): Promise<StockTransferOutcome> => {
  const { source, quantity } = params;
  const previousQuantity = Number(source.quantity);

  if (quantity <= 0) {
    throw new Error("Enter how much to transfer.");
  }

  if (params.toProductUuid === source.productUuid) {
    throw new Error(
      "The lot is already booked against that article — choose a different one.",
    );
  }

  const ledger = lotLedger({
    quantity: source.quantity,
    reservedQuantity: source.reservedQuantity,
    onOpenWorkOrders: params.onOpenWorkOrders ?? 0,
    plannedMoves: params.plannedMoves ?? 0,
  });

  if (quantity > ledger.totalMovable) {
    throw new Error(
      `Only ${ledger.totalMovable} of this lot can be transferred — the rest is on an open work order or already scheduled to move.`,
    );
  }

  // 🔴 A reservation cannot cross an article boundary, and this is the one place
  // the reference's "reserved stock is movable" finding stops applying.
  //
  // A reservation binds a lot to an order **line**, and that line names an
  // article. Carrying the claim onto a different article would leave the order
  // promising one product and holding another — the customer ordered 304L and
  // would be shipped 316. Moving the shelf a lot stands on breaks nothing;
  // changing what the metal *is* breaks the promise.
  const reserved = Number(source.reservedQuantity ?? 0);
  const free = previousQuantity - reserved;
  if (quantity > free) {
    throw new Error(
      `Only ${free} of this lot is unreserved. Release the claim on the other ${quantity - free} before transferring it to another article — a reservation cannot follow metal onto a different product.`,
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
  const valueMoved = previousValue - remainingValue;

  const previousTheoretical = Number(source.quantityKg ?? 0);
  const movedTheoretical =
    previousQuantity === 0
      ? 0
      : (previousTheoretical * quantity) / previousQuantity;

  const transferUuid = generateUuid();

  if (remainingQuantity === 0) {
    // All of it. The row changes article the way a full relocation changes
    // location — same uuid, same valuation, same charge — so everything
    // pointing at this lot keeps pointing at it.
    const [moved] = await tx
      .update(Stock)
      .set({
        productUuid: params.toProductUuid,
        locationUuid: params.toLocationUuid ?? source.locationUuid,
        remark: params.description ?? source.remark,
      })
      .where(
        and(eq(Stock.uuid, source.uuid), eq(Stock.quantity, source.quantity)),
      );

    if (moved.affectedRows === 0) {
      throw new Error(
        "The lot changed while the transfer was open — reload it and transfer it again.",
      );
    }
  } else {
    const [updated] = await tx
      .update(Stock)
      .set({
        quantity: remainingQuantity.toFixed(STOCK_QUANTITY_SCALE),
        quantityKg: (previousTheoretical - movedTheoretical).toFixed(
          STOCK_QUANTITY_SCALE,
        ),
        valuationEuro: moneyString(remainingValue),
        unopened: false,
      })
      .where(
        and(eq(Stock.uuid, source.uuid), eq(Stock.quantity, source.quantity)),
      );

    if (updated.affectedRows === 0) {
      throw new Error(
        "The lot changed while the transfer was open — reload it and transfer it again.",
      );
    }

    const {
      id: _id,
      uuid: _uuid,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...attributes
    } = source;

    await tx.insert(Stock).values({
      ...attributes,
      uuid: transferUuid,
      productUuid: params.toProductUuid,
      locationUuid: params.toLocationUuid ?? source.locationUuid,
      status: "pending",
      quantity: quantity.toFixed(STOCK_QUANTITY_SCALE),
      // Nothing transferred carries a claim — see the guard above.
      reservedQuantity: "0.000",
      quantityKg: movedTheoretical.toFixed(STOCK_QUANTITY_SCALE),
      // Two articles cannot both be the bundle that was weighed, and the part
      // that changed identity was never weighed as this article at all.
      weighedWeightKg: null,
      grossWeightKg: null,
      netWeightKg: null,
      valuationEuro: moneyString(valueMoved),
      remark: params.description ?? source.remark,
      unopened: false,
    });

    await carryLotBatches(tx, source.uuid, transferUuid, quantity);
  }

  const destinationUuid = remainingQuantity === 0 ? source.uuid : transferUuid;

  await tx.insert(StockMovements).values([
    {
      uuid: generateUuid(),
      productUuid: source.productUuid,
      stockUuid: source.uuid,
      type: "out",
      reason: "stock_transfer_out",
      quantity: quantity.toFixed(STOCK_QUANTITY_SCALE),
      quantityKg: movedTheoretical.toFixed(2),
      valueEur: moneyString(valueMoved),
      note: params.description,
      createdByUserId: params.userId,
    },
    {
      uuid: generateUuid(),
      productUuid: params.toProductUuid,
      stockUuid: destinationUuid,
      type: "in",
      reason: "stock_transfer_in",
      quantity: quantity.toFixed(STOCK_QUANTITY_SCALE),
      quantityKg: movedTheoretical.toFixed(2),
      valueEur: moneyString(valueMoved),
      note: params.description,
      createdByUserId: params.userId,
    },
  ]);

  return { transferredStockUuid: destinationUuid, remainingQuantity };
};
