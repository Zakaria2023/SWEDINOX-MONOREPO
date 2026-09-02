"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Info, Package, Printer, Tag } from "lucide-react";
import {
  cancelWarehouseWorkOrder,
  exportWarehouseWorkOrders,
  getWarehouseWorkOrderDetail,
  getWarehouseWorkOrderLineDetail,
  releaseWarehouseWorkOrder,
  saveWarehouseWorkOrderPackaging,
  WarehouseTreeRow,
  WarehouseWorkOrderTree,
  WorkOrderDetail,
} from "@/app/(dashboard)/warehouse-work-orders/actions";
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
import { TableFilterControl } from "@/lib/table-query";
import { ReportCompletionDialog } from "./report-completion-dialog";

type Props = {
  tree: WarehouseWorkOrderTree;
  filters: TableFilterControl[];
};

const num = (value: string | null) => Number(value ?? 0);

// The columns the reference system shows to the right of the tree.
const COLUMNS: TreeColumn<WarehouseTreeRow>[] = [
  {
    key: "productCode",
    header: "Product",
    cell: (row) => orDash(row.productCode),
  },
  { key: "order", header: "Order", cell: (row) => orDash(row.orderNumber) },
  { key: "length", header: "Length", cell: (row) => orDash(row.length) },
  { key: "width", header: "Width", cell: (row) => orDash(row.width) },
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
  // An empty side is the company boundary, not a gap in the record: the goods
  // came from outside, or they left.
  { key: "from", header: "From", cell: (row) => row.fromLocationName ?? "—" },
  { key: "to", header: "To", cell: (row) => row.toLocationName ?? "—" },
  { key: "charge", header: "Charge", cell: (row) => orDash(row.charge) },
  {
    key: "company",
    header: "Company",
    cell: (row) => orDash(row.companyName),
  },
];

export const WarehouseWorkOrdersTable = ({ tree, filters }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | undefined>();
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [packaging, setPackaging] = useState<WorkOrderDetail | null>(null);
  const [detailLine, setDetailLine] = useState<WarehouseTreeRow | null>(null);
  const [reportingLine, setReportingLine] = useState<WarehouseTreeRow | null>(
    null,
  );

  const picked = useMemo(
    () => tree.rows.filter((row) => selected.has(row.lineUuid)),
    [tree.rows, selected],
  );

  // The toolbar acts on work orders even though the ticks are on lines: release
  // and cancel are decisions about the whole job, which is why the reference
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

  const release = (printStockLabels: boolean) =>
    run(async () => {
      for (const uuid of pickedOrders) {
        const result = await releaseWarehouseWorkOrder(uuid, printStockLabels);
        if (!result.success) {
          return result;
        }
      }
      return { success: true };
    });

  // Packaging is entered against the job and needs what it already holds, which
  // the overview does not carry.
  const openPackaging = () => {
    if (!oneOrder) {
      return;
    }
    setActionError(undefined);
    startTransition(async () => {
      const detail = await getWarehouseWorkOrderDetail(oneOrder);
      if (!detail) {
        setActionError("That work order could not be loaded.");
        return;
      }
      setPackaging(detail);
    });
  };

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
          onClick={() => release(true)}
          disabled={pickedOrders.length === 0 || !only("new") || isPending}
        >
          <Printer className="size-4" />
          Release
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => release(false)}
          disabled={pickedOrders.length === 0 || !only("new") || isPending}
        >
          <Tag className="size-4" />
          Release without stock labels
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setReportingLine(oneLine)}
          disabled={
            !oneLine ||
            !only("released") ||
            oneLine.status === "approved" ||
            isPending
          }
        >
          Report completion
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={openPackaging}
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
            fileName="warehouse-work-orders"
            action={exportWarehouseWorkOrders}
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
        workOrderHref={(row) => `/warehouse-work-orders/${row.workOrderUuid}`}
        emptyMessage="No warehouse work orders found."
      />

      <TablePagination
        page={tree.page}
        singular="work order"
        plural="work orders"
      />

      <LineDetailDialog
        line={detailLine}
        load={getWarehouseWorkOrderLineDetail}
        onOpenChange={(open) => {
          if (!open) {
            setDetailLine(null);
          }
        }}
      />
      <ReportCompletionDialog
        line={reportingLine}
        workOrderType={reportingLine?.type ?? "picking"}
        onOpenChange={(open) => {
          if (!open) {
            setReportingLine(null);
          }
        }}
      />
      <PackagingDialog
        workOrderUuid={packaging?.uuid ?? null}
        existing={packaging?.packagings ?? []}
        save={saveWarehouseWorkOrderPackaging}
        onOpenChange={(open) => {
          if (!open) {
            setPackaging(null);
          }
        }}
      />
      <CancelWorkOrderDialog
        workOrderUuid={cancelling}
        cancel={cancelWarehouseWorkOrder}
        returnTo="/warehouse-work-orders"
        onOpenChange={(open) => {
          if (!open) {
            setCancelling(null);
          }
        }}
      />
    </div>
  );
};
