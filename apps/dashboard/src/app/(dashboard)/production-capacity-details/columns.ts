import type { ProductionCapacityDetailListItem } from "@/app/(dashboard)/production-capacity-details/actions";
import {
  dateCell,
  ExportCellValue,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import {
  DELIVERY_STATUS_LABELS,
  ORDER_LINE_STATUS_LABELS,
  ORDER_SOURCE_TYPE_LABELS,
  ORDER_TYPE_LABELS,
  SALES_UNIT_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

/**
 * Production capacity details — all 48 columns of the reference's export
 * (1 970 rows), in its order, with `Dikte`, `Kwaliteit` and `Categorie`
 * translated. `Sawing speed` and `Sawing method`, which this screen has always
 * carried, follow hidden.
 *
 * `Planned Delivery`, `Delivered` and `Delivery date (a)` are read from the
 * transport work orders, the way Deliveries reads them. `Sawing specification`,
 * `Sawing workorder status` and `Sawing machine` are `False` or empty on every
 * reference row and are not stored here, so they print blank.
 */

export type ProductionCapacityDetailColumnKey =
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
  | "fixedDimension"
  | "sawingSpec"
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
  | "sawingMachine"
  | "drillingHoles"
  | "leftSawAngle"
  | "bundles"
  | "bundlesPlusRemainder"
  | "sawing"
  | "drilling"
  | "rightSawAngle"
  | "standing"
  | "sawingType"
  | "transportDate"
  | "sawingAngles"
  | "sawingSpeed"
  | "sawingMethod";

type Row = ProductionCapacityDetailListItem;

type Column = ExportColumn<Row, ProductionCapacityDetailColumnKey>;

const column = (
  key: ProductionCapacityDetailColumnKey,
  label: string,
  defaultVisible: boolean,
  value: (row: Row) => ExportCellValue,
): Column => ({ key, label, defaultVisible, value });

const unitLabel = (unit: Row["unit"]) => (unit ? STOCK_UNIT_LABELS[unit] : null);

export const PRODUCTION_CAPACITY_DETAIL_COLUMNS: Column[] = [
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
  column("category", "Category", false, (row) => textCell(row.category)),
  column("fixedDimension", "Fixed dimensions", true, (row) =>
    yesNoCell(row.fixedDimension),
  ),
  column("sawingSpec", "Sawing specification", false, () => null),
  column("pickup", "Pick-up", true, (row) => yesNoCell(row.isPickup)),
  column("toSaw", "To saw", false, (row) => numberCell(row.toSaw)),
  column("sawingWorkOrderStatus", "Sawing workorder status", false, () => null),
  column("productionStartingDate", "Production starting date", true, (row) =>
    dateCell(row.productionStartingDate),
  ),
  column("plannedDelivery", "Planned Delivery", true, (row) =>
    numberCell(row.plannedDeliveryQty),
  ),
  column("delivered", "Delivered", true, (row) =>
    numberCell(row.deliveredQty),
  ),
  column("deliveryUnit", "U(delivery)", true, (row) => unitLabel(row.unit)),
  column("deliveryDatePlanned", "Delivery date (p)", true, (row) =>
    dateCell(row.plannedDeliveryDate),
  ),
  column("deliveryDateActual", "Delivery date (a)", true, (row) =>
    dateCell(row.deliveredOn),
  ),
  column("deliveryStatus", "Delivery status", true, (row) =>
    row.deliveryStatus ? DELIVERY_STATUS_LABELS[row.deliveryStatus] : null,
  ),
  column("kgPlanned", "Kg(p)", true, (row) => numberCell(row.kgPlanned)),
  column("kgActual", "Kg(a)", true, (row) => numberCell(row.kgActual)),
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
  column("lineQtyActual", "Line Qty(a)", true, (row) =>
    numberCell(row.qtyActual),
  ),
  column("lineQtyPlanned", "Line Qty(p)", true, (row) =>
    numberCell(row.qtyPlanned),
  ),
  column("lineQtyUnit", "Line QtyU", true, (row) => unitLabel(row.unit)),
  column("optionQty", "Option Qty", false, (row) => numberCell(row.optionQty)),
  column("lineStatus", "Line status", true, (row) =>
    row.lineStatus ? ORDER_LINE_STATUS_LABELS[row.lineStatus] : null,
  ),
  column("lineType", "Line type", true, (row) =>
    row.sourceType ? ORDER_SOURCE_TYPE_LABELS[row.sourceType] : null,
  ),
  column("sawingWorkOrder", "Sawing workorder", false, (row) =>
    textCell(row.sawingWorkOrder),
  ),
  column("sawingWorkOrderLine", "Sawing workorder line", false, (row) =>
    textCell(row.sawingWorkOrderLine),
  ),
  column("sawingMachine", "Sawing machine", false, () => null),
  column("drillingHoles", "Drilling holes", false, (row) =>
    numberCell(row.drillingHoles),
  ),
  column("leftSawAngle", "L.Saw angle", false, (row) =>
    numberCell(row.leftSawAngle),
  ),
  column("bundles", "Bls", false, (row) => numberCell(row.bundles)),
  column("bundlesPlusRemainder", "Bls+P", false, (row) =>
    numberCell(row.bundlesPlusRemainder),
  ),
  column("sawing", "Sawing", false, (row) => yesNoCell(row.sawing)),
  column("drilling", "Drilling", false, (row) => yesNoCell(row.drilling)),
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
  column("sawingSpeed", "Sawing speed", false, (row) =>
    numberCell(row.sawingSpeed),
  ),
  column("sawingMethod", "Sawing method", false, (row) =>
    textCell(row.sawingMethod),
  ),
];
