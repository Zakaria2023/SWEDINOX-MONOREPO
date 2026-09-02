"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, Info, Package, Printer } from "lucide-react";
import {
  approveProductionWorkOrder,
  cancelProductionWorkOrder,
  exportProductionWorkOrders,
  getProductionWorkOrderDetail,
  getProductionWorkOrderLineDetail,
  ProductionTreeRow,
  ProductionWorkOrderDetail,
  ProductionWorkOrderTree,
  releaseProductionWorkOrder,
  saveProductionWorkOrderPackaging,
} from "@/app/(dashboard)/production-workorders/actions";
import { AvailableStockOption } from "@/app/(dashboard)/warehouse-work-orders/actions";
import { LocationOption } from "@/app/(dashboard)/locations/actions";
import { Button } from "@/components/shadcn/button";
import { FormError } from "@/components/ui/form-error";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { CancelWorkOrderDialog } from "@/components/work-orders/cancel-work-order-dialog";
import { LineDetailDialog } from "@/components/work-orders/line-detail-dialog";
import { PackagingDialog } from "@/components/work-orders/packaging-dialog";
import {
  TreeColumn,
  WorkOrderTree,
} from "@/components/work-orders/work-order-tree";
import { WorkOrderStatus } from "@/lib/enums";
import { orDash } from "@/lib/helpers";
import { STOCK_UNIT_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";
import { ReportCutDialog } from "./report-cut-dialog";
import { ReportTreatmentDialog } from "./report-treatment-dialog";

type Props = {
  tree: ProductionWorkOrderTree;
  filters: TableFilterControl[];
  stockOptions: AvailableStockOption[];
  locations: LocationOption[];
};

const num = (value: string | null) => Number(value ?? 0);

// The columns the reference system shows to the right of the tree.
const COLUMNS: TreeColumn<ProductionTreeRow>[] = [
  {
    key: "extraOptions",
    header: "Extra options",
    cell: (row) => orDash(row.extraOptions),
  },
  {
    key: "productCode",
    header: "Product code",
    cell: (row) => orDash(row.productCode),
  },
  { key: "order", header: "Order", cell: (row) => orDash(row.orderNumber) },
  { key: "thickness", header: "Dikte", cell: (row) => orDash(row.thickness) },
  {
    key: "qtyPlanned",
    header: "Qty(p)",
    align: "right",
    cell: (row) => orDash(row.qtyPlanned),
    sum: (row) => num(row.qtyPlanned),
  },
  {
    key: "qtyActual",
    header: "Qty(a)",
    align: "right",
    cell: (row) => orDash(row.qtyActual),
    sum: (row) => num(row.qtyActual),
  },
  {
    key: "unitPlanned",
    header: "U(p)",
    cell: (row) => (row.unitPlanned ? STOCK_UNIT_LABELS[row.unitPlanned] : "—"),
  },
  {
    key: "unitActual",
    header: "U(a)",
    cell: (row) => (row.unitActual ? STOCK_UNIT_LABELS[row.unitActual] : "—"),
  },
  {
    key: "kgPlanned",
    header: "Kg(p)",
    align: "right",
    cell: (row) => orDash(row.kgPlanned),
    sum: (row) => num(row.kgPlanned),
  },
  {
    key: "kgActual",
    header: "Kg(a)",
    align: "right",
    cell: (row) => orDash(row.kgActual),
    sum: (row) => num(row.kgActual),
  },
  { key: "back", header: "Back", cell: (row) => row.backLocationName ?? "—" },
  { key: "from", header: "From", cell: (row) => row.fromLocationName ?? "—" },
  { key: "to", header: "To", cell: (row) => row.toLocationName ?? "—" },
  {
    key: "company",
    header: "Company",
    cell: (row) => orDash(row.companyName),
  },
];

export const ProductionWorkOrdersTable = ({
  tree,
  filters,
  stockOptions,
  locations,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | undefined>();
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [packaging, setPackaging] = useState<ProductionWorkOrderDetail | null>(
    null,
  );
  const [detailLine, setDetailLine] = useState<ProductionTreeRow | null>(null);
  const [reportingLine, setReportingLine] = useState<ProductionTreeRow | null>(
    null,
  );
  const [reportingCut, setReportingCut] =
    useState<ProductionWorkOrderDetail | null>(null);

  const picked = useMemo(
    () => tree.rows.filter((row) => selected.has(row.lineUuid)),
    [tree.rows, selected],
  );

  // The toolbar acts on work orders even though the ticks are on lines: release
  // and approve are decisions about the whole job, which is why the reference
  // system greys them the moment a selection spans two of them.
  const pickedOrders = useMemo(
    () => [...new Set(picked.map((row) => row.workOrderUuid))],
    [picked],
  );
  const oneOrder = pickedOrders.length === 1 ? pickedOrders[0] : null;
  const oneLine = picked.length === 1 ? picked[0] : null;
  const statuses = new Set(picked.map((row) => row.workOrderStatus));
  const only = (status: WorkOrderStatus) =>
    statuses.size === 1 && statuses.has(status);

  const run = (
    action: () => Promise<{ error?: string; success?: boolean }>,
  ) => {
    setActionError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        setSelected(new Set());
        router.refresh();
        return;
      }
      setActionError(result.error);
    });
  };

  const forEachOrder = (
    action: (uuid: string) => Promise<{ error?: string; success?: boolean }>,
  ) =>
    run(async () => {
      for (const uuid of pickedOrders) {
        const result = await action(uuid);
        if (!result.success) {
          return result;
        }
      }
      return { success: true };
    });

  // The cut dialog needs the whole run — its fetched lots and its remainders —
  // which the overview does not carry, so it is fetched on the way in.
  const openWithDetail = (
    uuid: string,
    open: (detail: ProductionWorkOrderDetail) => void,
  ) => {
    setActionError(undefined);
    startTransition(async () => {
      const detail = await getProductionWorkOrderDetail(uuid);
      if (!detail) {
        setActionError("That work order could not be loaded.");
        return;
      }
      open(detail);
    });
  };

  const reportCompletion = () => {
    if (!oneOrder) {
      return;
    }
    const row = picked[0];
    if (row.cuts) {
      openWithDetail(oneOrder, setReportingCut);
      return;
    }
    if (oneLine) {
      setReportingLine(oneLine);
    }
  };

  const canReport =
    oneOrder !== null &&
    only("released") &&
    (picked[0]?.cuts === true || oneLine !== null);

  return (
    <div className="space-y-4">
      {/* The floor selects rows and acts on them from here, rather than opening
          each job in turn. */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setDetailLine(oneLine)}
          disabled={!oneLine || isPending}
        >
          <Info className="size-4" />
          Details
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => forEachOrder(releaseProductionWorkOrder)}
          disabled={pickedOrders.length === 0 || !only("new") || isPending}
        >
          <Printer className="size-4" />
          Release
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={reportCompletion}
          disabled={!canReport || isPending}
        >
          Report completion
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => forEachOrder(approveProductionWorkOrder)}
          disabled={pickedOrders.length === 0 || !only("ready") || isPending}
        >
          <CheckCircle2 className="size-4" />
          Approve
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => oneOrder && openWithDetail(oneOrder, setPackaging)}
          disabled={!oneOrder || isPending}
        >
          <Package className="size-4" />
          Package
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setCancelling(oneOrder)}
          disabled={!oneOrder || only("approved") || isPending}
        >
          <Ban className="size-4" />
          Cancel
        </Button>
        <div className="ms-auto">
          {/* "Print" in the reference system saves the selection as a document;
              this is the same thing in the form this application already has. */}
          <PagedTableExportButton
            fileName="production-work-orders"
            action={exportProductionWorkOrders}
          />
        </div>
      </div>

      <FormError>{actionError}</FormError>

      <TableToolbar
        searchPlaceholder="Search number, order or product…"
        filters={filters}
      />

      <WorkOrderTree
        rows={tree.rows}
        columns={COLUMNS}
        selected={selected}
        onSelectedChange={setSelected}
        workOrderHref={(row) => `/production-workorders/${row.workOrderUuid}`}
        emptyMessage="No production work orders found."
      />

      <TablePagination
        page={tree.page}
        singular="work order"
        plural="work orders"
      />

      <LineDetailDialog
        line={detailLine}
        load={getProductionWorkOrderLineDetail}
        onOpenChange={(open) => {
          if (!open) {
            setDetailLine(null);
          }
        }}
      />
      <ReportTreatmentDialog
        line={reportingLine}
        onOpenChange={(open) => {
          if (!open) {
            setReportingLine(null);
          }
        }}
      />
      <ReportCutDialog
        workOrder={reportingCut}
        stockOptions={stockOptions}
        locations={locations}
        onOpenChange={(open) => {
          if (!open) {
            setReportingCut(null);
          }
        }}
      />
      <PackagingDialog
        workOrderUuid={packaging?.uuid ?? null}
        existing={packaging?.packagings ?? []}
        save={saveProductionWorkOrderPackaging}
        onOpenChange={(open) => {
          if (!open) {
            setPackaging(null);
          }
        }}
      />
      <CancelWorkOrderDialog
        workOrderUuid={cancelling}
        cancel={cancelProductionWorkOrder}
        returnTo="/production-workorders"
        onOpenChange={(open) => {
          if (!open) {
            setCancelling(null);
          }
        }}
      />
    </div>
  );
};
