import type { CombinedWorkOrderLine } from "@/app/(dashboard)/warehouse-and-production-workorders/actions";
import {
  dateCell,
  ExportCellValue,
  ExportColumn,
  numberCell,
  textCell,
} from "@/lib/excel";
import {
  WAREHOUSE_WORK_ORDER_TYPE_LABELS,
  WORK_ORDER_STATUS_LABELS,
} from "@/lib/labels";
import type { WarehouseWorkOrderType, WorkOrderStatus } from "@/lib/enums";

/**
 * `Warehouse- and production workorders` — all 23 columns of the reference's
 * export (13 610 lines), in its own order.
 *
 * ⚪ `Resource` is `-leeg-` on every reference row and `Sawing type` is filled
 * only on Nesting's sawing lines; both read blank here.
 */

export type CombinedWorkOrderColumnKey =
  | "section"
  | "yearReleased"
  | "monthReleased"
  | "releasedAt"
  | "timePeriod"
  | "workOrderNumber"
  | "lineNumber"
  | "qtyActual"
  | "qtyUnit"
  | "kgActual"
  | "resource"
  | "sawingType"
  | "subsection"
  | "workOrderType"
  | "workOrderDate"
  | "qtyPlanned"
  | "kgPlanned"
  | "workOrderStatus"
  | "weightDeviation"
  | "reportedAt"
  | "company"
  | "modifiedBy"
  | "orderNumber";

type Column = ExportColumn<CombinedWorkOrderLine, CombinedWorkOrderColumnKey>;

const column = (
  key: CombinedWorkOrderColumnKey,
  label: string,
  defaultVisible: boolean,
  value: (row: CombinedWorkOrderLine) => ExportCellValue,
): Column => ({ key, label, defaultVisible, value });

const two = (value: number) => String(value).padStart(2, "0");

/** The half-hour the job was released in — `14:30 - 15:00`. */
const timePeriodOf = (at: Date | null): string | null => {
  if (!at) {
    return null;
  }
  const minutes = at.getHours() * 60 + (at.getMinutes() < 30 ? 0 : 30);
  const end = minutes + 30;
  return `${two(Math.floor(minutes / 60))}:${two(minutes % 60)} - ${two(
    Math.floor(end / 60) % 24,
  )}:${two(end % 60)}`;
};

export const COMBINED_WORK_ORDER_COLUMNS: Column[] = [
  column("section", "Warehouse section", true, (row) => textCell(row.sectionName)),
  column("yearReleased", "Year (Date released)", false, (row) =>
    row.releasedAt ? row.releasedAt.getFullYear() : null,
  ),
  column("monthReleased", "Month (Date released)", false, (row) =>
    row.releasedAt ? row.releasedAt.getMonth() + 1 : null,
  ),
  column("releasedAt", "Date released", true, (row) => dateCell(row.releasedAt)),
  column("timePeriod", "Time period (Time released)", true, (row) =>
    timePeriodOf(row.releasedAt),
  ),
  column("workOrderNumber", "Workorder#", true, (row) => row.workOrderNumber),
  column("lineNumber", "Line#", true, (row) => numberCell(row.lineNumber)),
  column("qtyActual", "Qty(a)", true, (row) => row.qtyActual),
  column("qtyUnit", "QtyU", true, (row) => textCell(row.qtyUnit)),
  column("kgActual", "Kg(a)", true, (row) => row.kgActual),
  column("resource", "Resource", false, () => null),
  column("sawingType", "Sawing type", false, () => null),
  column("subsection", "Subsection", false, (row) => textCell(row.subsectionName)),
  column("workOrderType", "Workorder type", true, (row) =>
    row.workOrderType
      ? WAREHOUSE_WORK_ORDER_TYPE_LABELS[row.workOrderType as WarehouseWorkOrderType]
      : null,
  ),
  column("workOrderDate", "Workorder date", true, (row) =>
    dateCell(row.workOrderDate),
  ),
  column("qtyPlanned", "Qty(p)", true, (row) => row.qtyPlanned),
  column("kgPlanned", "Kg(p)", true, (row) => row.kgPlanned),
  column("workOrderStatus", "Workorder status", true, (row) =>
    row.workOrderStatus
      ? WORK_ORDER_STATUS_LABELS[row.workOrderStatus as WorkOrderStatus]
      : null,
  ),
  column("weightDeviation", "Weight deviation (%)", true, (row) =>
    row.weightDeviation === 0 ? null : Math.round(row.weightDeviation * 100) / 100,
  ),
  column("reportedAt", "Reported as completed on", false, (row) =>
    dateCell(row.reportedAt),
  ),
  column("company", "Company", true, (row) =>
    textCell(
      [row.companyName, row.companyCity?.toUpperCase()].filter(Boolean).join(", "),
    ),
  ),
  column("modifiedBy", "Modified by", false, (row) => textCell(row.modifiedByName)),
  column("orderNumber", "Order#", true, (row) => numberCell(row.orderNumber)),
];
