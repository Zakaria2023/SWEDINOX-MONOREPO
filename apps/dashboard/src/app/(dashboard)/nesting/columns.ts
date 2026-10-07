import type { NestingListItem } from "@/app/(dashboard)/nesting/actions";
import {
  dateCell,
  ExportCellValue,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import {
  ORDER_LINE_STATUS_LABELS,
  ORDER_SOURCE_TYPE_LABELS,
  ORDER_TYPE_LABELS,
  SALES_UNIT_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

/**
 * Nesting — all 58 columns of the reference's export (10 rows,
 * docs/reference-system/nesting.md), in its order, with `Dikte`, `Kwaliteit`
 * and `Categorie` translated.
 *
 * `Bls+P`, `Sawing` and `Drilling` are processing flags that read `False` on
 * every reference row and are not stored on a nesting row here, so they print
 * blank rather than claim a `No`. `Bls` is the bundle count this screen has
 * always carried.
 */

export type NestingColumnKey =
  | "order"
  | "orderType"
  | "line"
  | "company"
  | "productCode"
  | "product"
  | "lengthMm"
  | "widthMm"
  | "thicknessMm"
  | "quality"
  | "category"
  | "sawingSpec"
  | "fixedDimension"
  | "pickup"
  | "toSaw"
  | "sawingWorkOrderStatus"
  | "productionStartingDate"
  | "plannedDelivery"
  | "delivered"
  | "deliveryUnit"
  | "deliveryDatePlanned"
  | "deliveryDateActual"
  | "deliveryStatus"
  | "kgPlanned"
  | "kgActual"
  | "theoreticalWeight"
  | "theoreticalWeightUnit"
  | "orderLineDeliveryDate"
  | "lineQtyActual"
  | "lineQtyPlanned"
  | "lineQtyUnit"
  | "optionQty"
  | "lineStatus"
  | "lineType"
  | "sawingWorkOrder"
  | "sawingWorkOrderLine"
  | "nest"
  | "sawingMachine"
  | "drillingHoles"
  | "leftSawAngle"
  | "bundles"
  | "bundlesAndPacking"
  | "sawing"
  | "drilling"
  | "rightSawAngle"
  | "standing"
  | "sawingType"
  | "transportDate"
  | "sawingAngles"
  | "fetchDate"
  | "fetchCode"
  | "fetchLine"
  | "fetchStatus"
  | "fetchQty"
  | "fetchProduct"
  | "fetchDescription"
  | "fetchLength"
  | "residualLength";

type Column = ExportColumn<NestingListItem, NestingColumnKey>;

const column = (
  key: NestingColumnKey,
  label: string,
  defaultVisible: boolean,
  value: (row: NestingListItem) => ExportCellValue,
): Column => ({ key, label, defaultVisible, value });

export const NESTING_COLUMNS: Column[] = [
  column("order", "Order", true, (row) => numberCell(row.orderId)),
  column("orderType", "Order type", true, (row) =>
    row.orderType ? ORDER_TYPE_LABELS[row.orderType] : null,
  ),
  column("line", "Line", true, (row) => numberCell(row.lineNumber)),
  column("company", "Company", true, (row) => textCell(row.companyName)),
  column("productCode", "Product code", true, (row) =>
    textCell(row.productCode),
  ),
  column("product", "Product", true, (row) => textCell(row.productName)),
  column("lengthMm", "Length (mm)", true, (row) => numberCell(row.lengthMm)),
  column("widthMm", "Width (mm)", true, (row) => numberCell(row.widthMm)),
  column("thicknessMm", "Thickness", true, (row) =>
    numberCell(row.thicknessMm),
  ),
  column("quality", "Quality", true, (row) => textCell(row.quality)),
  column("category", "Category", true, (row) => textCell(row.category)),
  column("sawingSpec", "Sawing specification", true, (row) =>
    yesNoCell(row.sawingSpec),
  ),
  column("fixedDimension", "Fixed dimensions", true, (row) =>
    yesNoCell(row.fixedDimension),
  ),
  column("pickup", "Pick-up", true, (row) => yesNoCell(row.isPickup)),
  column("toSaw", "To saw", false, (row) => numberCell(row.toSaw)),
  column("sawingWorkOrderStatus", "Sawing workorder status", true, (row) =>
    textCell(row.sawingWorkOrderStatus),
  ),
  column("productionStartingDate", "Production starting date", true, (row) =>
    dateCell(row.productionStartingDate),
  ),
  column("plannedDelivery", "Planned Delivery", true, (row) =>
    numberCell(row.plannedDeliveredQty),
  ),
  column("delivered", "Delivered", false, (row) =>
    numberCell(row.deliveredQty),
  ),
  column("deliveryUnit", "U(delivery)", true, (row) =>
    textCell(row.deliveryUnit),
  ),
  column("deliveryDatePlanned", "Delivery date (p)", true, (row) =>
    dateCell(row.deliveryDatePlanned),
  ),
  column("deliveryDateActual", "Delivery date (a)", false, (row) =>
    dateCell(row.deliveryDateActual),
  ),
  column("deliveryStatus", "Delivery status", true, (row) =>
    textCell(row.deliveryStatus),
  ),
  column("kgPlanned", "Kg(p)", true, (row) => numberCell(row.kgPlanned)),
  column("kgActual", "Kg(a)", false, (row) => numberCell(row.kgActual)),
  column(
    "theoreticalWeight",
    "Theor. Weight (kg per Theor. Weight U.)",
    false,
    (row) => numberCell(row.theoreticalWeight),
  ),
  column("theoreticalWeightUnit", "Theor. Weight U.", false, (row) =>
    row.theoreticalWeightUnit
      ? SALES_UNIT_LABELS[row.theoreticalWeightUnit]
      : null,
  ),
  column("orderLineDeliveryDate", "Order line Deliv. Date", true, (row) =>
    dateCell(row.orderLineDeliveryDate),
  ),
  column("lineQtyActual", "Line Qty(a)", false, (row) =>
    numberCell(row.qtyActual),
  ),
  column("lineQtyPlanned", "Line Qty(p)", true, (row) =>
    numberCell(row.qtyPlanned),
  ),
  column("lineQtyUnit", "Line QtyU", true, (row) =>
    row.unit ? STOCK_UNIT_LABELS[row.unit] : null,
  ),
  column("optionQty", "Option Qty", true, (row) => numberCell(row.optionQty)),
  column("lineStatus", "Line status", true, (row) =>
    row.lineStatus ? ORDER_LINE_STATUS_LABELS[row.lineStatus] : null,
  ),
  column("lineType", "Line type", true, (row) =>
    row.sourceType ? ORDER_SOURCE_TYPE_LABELS[row.sourceType] : null,
  ),
  column("sawingWorkOrder", "Sawing workorder", true, (row) =>
    textCell(row.sawingWorkOrder),
  ),
  column("sawingWorkOrderLine", "Sawing workorder line", true, (row) =>
    textCell(row.sawingWorkOrderLine),
  ),
  column("nest", "Nest", true, (row) => textCell(row.nest)),
  column("sawingMachine", "Sawing machine", true, (row) =>
    textCell(row.sawingMachine),
  ),
  column("drillingHoles", "Drilling holes", false, (row) =>
    numberCell(row.drillingHoles),
  ),
  column("leftSawAngle", "L.Saw angle", false, (row) =>
    numberCell(row.leftSawAngle),
  ),
  column("bundles", "Bls", false, (row) => numberCell(row.bundles)),
  column("bundlesAndPacking", "Bls+P", false, () => null),
  column("sawing", "Sawing", false, () => null),
  column("drilling", "Drilling", false, () => null),
  column("rightSawAngle", "R.Saw angle", false, (row) =>
    numberCell(row.rightSawAngle),
  ),
  column("standing", "Standing", false, (row) => yesNoCell(row.standing)),
  column("sawingType", "Sawing type", false, (row) =>
    textCell(row.sawingType),
  ),
  column("transportDate", "Transport date", true, (row) =>
    dateCell(row.transportDate),
  ),
  column("sawingAngles", "Sawing angle(s)", false, (row) =>
    textCell(row.sawingAngles),
  ),
  column("fetchDate", "Fetch date", true, (row) => dateCell(row.fetchDate)),
  column("fetchCode", "Fetch code", true, (row) => textCell(row.fetchCode)),
  column("fetchLine", "Fetch line", true, (row) => numberCell(row.fetchLine)),
  column("fetchStatus", "Fetch status", true, (row) =>
    textCell(row.fetchStatus),
  ),
  column("fetchQty", "Fetch qty", true, (row) => numberCell(row.fetchQty)),
  column("fetchProduct", "Fetch product code", true, (row) =>
    textCell(row.fetchProduct),
  ),
  column("fetchDescription", "Fetch description", true, (row) =>
    textCell(row.fetchDescription),
  ),
  column("fetchLength", "Fetch length", true, (row) =>
    numberCell(row.fetchLength),
  ),
  column("residualLength", "Residual length (p)", false, (row) =>
    numberCell(row.residualLength),
  ),
];
