"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  Check,
  ClipboardList,
  Info,
  Package,
  Printer,
  Tag,
} from "lucide-react";
import {
  approveWarehouseWorkOrderLine,
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
import { LocationOption } from "@/app/(dashboard)/locations/actions";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import { FormError } from "@/components/ui/form-error";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { CancelWorkOrderDialog } from "@/components/work-orders/cancel-work-order-dialog";
import {
  LineDetailDialog,
  LineDetailPanel,
} from "@/components/work-orders/line-detail-dialog";
import { PackagingDialog } from "@/components/work-orders/packaging-dialog";
import {
  TreeColumn,
  WorkOrderTree,
} from "@/components/work-orders/work-order-tree";
import { WorkOrderStatus } from "@/lib/enums";
import { orDash } from "@/lib/helpers";
import { ClerkUserOption } from "@/lib/server/clerk";
import { TableFilterControl } from "@/lib/table-query";
import { PrepareLineDialog } from "./prepare-line-dialog";
import { ReportCompletionDialog } from "./report-completion-dialog";

type Props = {
  tree: WarehouseWorkOrderTree;
  filters: TableFilterControl[];
  locations: LocationOption[];
  users: ClerkUserOption[];
};

const num = (value: string | null) => Number(value ?? 0);

// The columns the reference shows to the right of the tree, in its order
// (Magazijn opdrachten, 9-10-2026): Order · Opties · Interne charge · Bedrijf
// · Van · Naar · Artikelcode · Voorraadcategorie · Lengte · Breedte · Dikte ·
// Hvh(p) · Hvh(w) · Kg(p) · Kg(w) — then the charge.
const COLUMNS: TreeColumn<WarehouseTreeRow>[] = [
  { key: "order", header: "Order", cell: (row) => orDash(row.orderNumber) },
  { key: "options", header: "Options", cell: (row) => orDash(row.options) },
  {
    key: "internalCharge",
    header: "Internal charge",
    cell: (row) => orDash(row.internalCharge),
  },
  {
    key: "company",
    header: "Company",
    cell: (row) => orDash(row.companyName),
  },
  // An empty side is the company boundary, not a gap in the record: the goods
  // came from outside, or they left.
  { key: "from", header: "From", cell: (row) => row.fromLocationName ?? "—" },
  { key: "to", header: "To", cell: (row) => row.toLocationName ?? "—" },
  {
    key: "productCode",
    header: "Product code",
    cell: (row) => orDash(row.productCode),
  },
  { key: "quality", header: "Stock cat.", cell: (row) => orDash(row.quality) },
  { key: "length", header: "Length", cell: (row) => orDash(row.length) },
  { key: "width", header: "Width", cell: (row) => orDash(row.width) },
  { key: "thickness", header: "Thickness", cell: (row) => orDash(row.thickness) },
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
  { key: "charge", header: "Charge", cell: (row) => orDash(row.charge) },
];

export const WarehouseWorkOrdersTable = ({
  tree,
  filters,
  locations,
  users,
}: Props) => {
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
  const [preparingLine, setPreparingLine] = useState<WarehouseTreeRow | null>(
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
  // Gereedmelden stays greyed until the slip is released, an unloading
  // included (327402, 9-10-2026): Vrijgeven on the order node first.
  const canReport =
    !!oneLine && oneLine.status !== "approved" && only("released");

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
        {/* `Alles Selecteren` — every line on the page, or none. */}
        <label className="flex items-center gap-2 px-1 text-sm">
          <Checkbox
            checked={tree.rows.length > 0 && selected.size === tree.rows.length}
            onChange={(event) =>
              setSelected(
                event.target.checked
                  ? new Set(tree.rows.map((row) => row.lineUuid))
                  : new Set(),
              )
            }
          />
          Select all
        </label>
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
        {/* `Voorbereiden`: the picks a line will be drawn from, chosen
            before the floor goes to fetch them. */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setPreparingLine(oneLine)}
          disabled={!oneLine || !only("released") || isPending}
        >
          <ClipboardList className="size-4" />
          Prepare
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setReportingLine(oneLine)}
          disabled={!canReport || isPending}
        >
          Report completion
        </Button>
        {/* Only products that tick `Always approve manually` ever leave a line
            at `ready`, so this stays greyed on everything else — which is
            exactly how the reference's own `Approve` button behaves. */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            if (oneLine) {
              run(() => approveWarehouseWorkOrderLine(oneLine.lineUuid));
            }
          }}
          disabled={!oneLine || oneLine.status !== "ready" || isPending}
        >
          <Check className="size-4" />
          Approve
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
        levelsHeader="Day / Type / Order / Line"
        emptyMessage="No warehouse work orders found."
      />

      <TablePagination
        page={tree.page}
        singular="work order"
        plural="work orders"
      />

      {/* The reference's footer: Voorraad · Order · Opties · Teksten for the
          selected line, under the tree rather than in a window. */}
      <div className="rounded-lg border p-3">
        <LineDetailPanel line={oneLine} load={getWarehouseWorkOrderLineDetail} />
      </div>

      <LineDetailDialog
        line={detailLine}
        load={getWarehouseWorkOrderLineDetail}
        onOpenChange={(open) => {
          if (!open) {
            setDetailLine(null);
          }
        }}
      />
      <PrepareLineDialog
        line={preparingLine}
        onOpenChange={(open) => {
          if (!open) {
            setPreparingLine(null);
          }
        }}
      />
      <ReportCompletionDialog
        line={reportingLine}
        workOrderType={reportingLine?.type ?? "picking"}
        workOrderNumber={reportingLine?.workOrderNumber ?? null}
        locations={locations}
        users={users}
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
