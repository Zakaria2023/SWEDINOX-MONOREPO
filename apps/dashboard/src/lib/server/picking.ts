import { db } from "@/db";
import {
  SelectWarehouseWorkOrderLines,
  WarehouseWorkOrderLines,
  WarehouseWorkOrders,
} from "@/db/schema/warehouse-work-orders";
import { Warehouses } from "@/db/schema/warehouses";
import { generateUuid, toDateString, todayDateString } from "@/lib/helpers";
import { nextWorkOrderNumber } from "@/lib/server/work-order-numbers";
import { eq, inArray, sql } from "drizzle-orm";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** The sales order a picking is raised for. */
type PickingOrder = {
  id: number;
  companyUuid: string;
  deliveryDate: Date | null;
};

/** One sales line to pick, already bound to the lot it is drawn from. */
type PickingLine = {
  orderItemUuid: string;
  lineNumber: number | null;
  stockUuid: string;
  productUuid: string;
  productCode: string | null;
  fromLocationUuid: string | null;
  lengthMm: number | null;
  widthMm: number | null;
  thicknessMm: string | null;
  quantity: string;
  kgPlanned: string | null;
  charge: string | null;
  internalCharge: string | null;
  internalBatch: string | null;
  quality: string | null;
  /** A `CD` line names the purchase it was bought on. */
  purchaseOrderItemUuid?: SelectWarehouseWorkOrderLines["purchaseOrderItemUuid"];
};

type RaisePickingInput = {
  order: PickingOrder;
  lines: PickingLine[];
  userId: string | null;
};

/**
 * The warehouse a location belongs to, found by climbing its parents. The
 * bound is a guard against a parent cycle, not a claim about the depth.
 */
const rootWarehouseOf = async (
  tx: Transaction,
  locationUuid: string,
): Promise<string | null> => {
  const seen = new Set<string>();
  const climb = async (uuid: string): Promise<string | null> => {
    if (seen.has(uuid) || seen.size > 16) {
      return null;
    }
    seen.add(uuid);
    const [row] = await tx
      .select({ parentUuid: Warehouses.parentUuid })
      .from(Warehouses)
      .where(eq(Warehouses.uuid, uuid))
      .limit(1);
    if (!row) {
      return null;
    }
    return row.parentUuid ? climb(row.parentUuid) : uuid;
  };
  return climb(locationUuid);
};

/**
 * Raise one `Picking` work order for a sales order's lines — the slip `Make
 * final` raises (102191 → 306697, 21-9-2026), and the one a `CD` line gets
 * once its goods are unloaded (O108307/10, 15-10-2026).
 *
 * Where the picked metal is staged: the reference uses exactly three
 * destinations for a picking, in this order of preference because it is their
 * order of frequency across its own 3 936 picking rows — `Laad` 3 420,
 * `Afhaal` 287, `Afroep` 39.
 *
 * Returns the work order's number.
 */
export const raisePickingWorkOrder = async (
  tx: Transaction,
  { order, lines, userId }: RaisePickingInput,
): Promise<number> => {
  const number = await nextWorkOrderNumber(tx);

  const [loadLocation] = await tx
    .select({ uuid: Warehouses.uuid })
    .from(Warehouses)
    .where(inArray(Warehouses.locationType, ["load", "collection", "call_off"]))
    .orderBy(
      sql`FIELD(${Warehouses.locationType}, 'load', 'collection', 'call_off')`,
    )
    .limit(1);

  if (!loadLocation) {
    throw new Error(
      "No loading, collection or call-off location exists, so there is nowhere to pick this order to. Add one on the warehouses screen first.",
    );
  }

  const firstLocation = lines.find(
    (line) => line.fromLocationUuid,
  )?.fromLocationUuid;
  const warehouseUuid = firstLocation
    ? await rootWarehouseOf(tx, firstLocation)
    : null;

  if (!warehouseUuid) {
    throw new Error(
      "The lots on this order do not sit in any warehouse, so no picking can be planned.",
    );
  }

  const workOrderUuid = generateUuid();

  await tx.insert(WarehouseWorkOrders).values({
    createdByUserId: userId,
    uuid: workOrderUuid,
    number,
    warehouseUuid,
    type: "picking",
    plannedDate: order.deliveryDate
      ? toDateString(order.deliveryDate)
      : todayDateString(),
    status: "new",
  });

  for (const [index, line] of lines.entries()) {
    await tx.insert(WarehouseWorkOrderLines).values({
      modifiedByUserId: userId,
      uuid: generateUuid(),
      workOrderUuid,
      lineNumber: line.lineNumber ?? index + 1,
      orderItemUuid: line.orderItemUuid,
      orderNumber: String(order.id),
      companyUuid: order.companyUuid,
      stockUuid: line.stockUuid,
      productUuid: line.productUuid,
      productCode: line.productCode,
      purchaseOrderItemUuid: line.purchaseOrderItemUuid ?? null,
      fromLocationUuid: line.fromLocationUuid,
      toLocationUuid: loadLocation.uuid,
      length: line.lengthMm,
      width: line.widthMm,
      thickness: line.thicknessMm ? Number(line.thicknessMm) : null,
      qtyPlanned: line.quantity,
      kgPlanned: line.kgPlanned,
      charge: line.charge,
      internalCharge: line.internalCharge,
      internalBatch: line.internalBatch,
      quality: line.quality,
      status: "new",
    });
  }

  return number;
};
