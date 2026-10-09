"use client";

import Link from "next/link";
import {
  getStockLotDialog,
  StockLotDialogData,
} from "@/app/(dashboard)/stock/actions";
import { exportStockOnLocation } from "@/app/(dashboard)/stock-on-location/actions";
import {
  STOCK_LOT_COLUMNS,
  StockLotColumnKey,
} from "@/app/(dashboard)/stock-on-location/columns";
import { Button } from "@/components/shadcn/button";
import { StockReservationsDialog } from "@/components/stock/stock-reservations-dialog";
import { OverviewTable } from "@/components/ui/overview-table";
import { RelatedRecordsBar } from "@/components/ui/related-records-bar";
import type { StockLotOverviewRow } from "@/lib/server/stock-lot-overview";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { useState, useTransition } from "react";

type Props = {
  page: Paged<StockLotOverviewRow>;
  filters: TableFilterControl[];
};

export const STOCK_LOT_SORTABLE: Partial<Record<StockLotColumnKey, string>> = {
  productCode: "productCode",
  location: "location",
  quantity: "quantity",
  quantityKg: "quantityKg",
  receiptDate: "receiptDate",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
};

/** The product code opens the lot, as `Show product` does in the reference. */
export const renderStockLotCell = (
  row: StockLotOverviewRow,
  key: StockLotColumnKey,
) =>
  key === "productCode" ? (
    <Link
      href={`/stock/${row.uuid}`}
      className="font-medium underline-offset-4 hover:underline"
    >
      {row.productCode ?? "—"}
    </Link>
  ) : undefined;

/**
 * The reference's `Stock on location` toolbar acts on the selected lot:
 * `Show Product · Toon reserveringen… | Purchase lines`. Reservations live on
 * the lot's own screen, behind its `Reservations…` button. `Change APP…`
 * revalues stock, which is a valuation (finance) action and is not built here.
 */
export const renderStockLotSelection = (selected: StockLotOverviewRow | null) => (
  <RelatedRecordsBar
    records={[
      {
        label: "Show product",
        href: selected ? `/products/${selected.productUuid}` : null,
      },
      {
        label: "Show lot and reservations",
        href: selected ? `/stock/${selected.uuid}` : null,
      },
      {
        label: "Purchase lines",
        href: selected ? `/purchase-lines?product=${selected.productUuid}` : null,
      },
    ]}
  />
);

/**
 * `Toon reserveringen…` opens the lot's reservations over the grid, as the
 * reference does, rather than navigating away to the lot's own screen — the
 * same dialog the lot screen and the stock search open, with `Order` and
 * `Verwijder` on each reservation.
 */
export const StockOnLocationTable = ({ page, filters }: Props) => {
  const [reservations, setReservations] = useState<StockLotDialogData | null>(
    null,
  );
  const [isLoading, startTransition] = useTransition();

  const showReservations = (stockUuid: string) => {
    startTransition(async () => {
      setReservations(await getStockLotDialog(stockUuid));
    });
  };

  return (
    <>
      <OverviewTable
        page={page}
        filters={filters}
        columns={STOCK_LOT_COLUMNS}
        sortable={STOCK_LOT_SORTABLE}
        rowKey={(row) => row.uuid}
        renderCell={renderStockLotCell}
        selectionToolbar={(selected) => (
          <div className="flex flex-wrap gap-2">
            <RelatedRecordsBar
              records={[
                {
                  label: "Show product",
                  href: selected ? `/products/${selected.productUuid}` : null,
                },
              ]}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!selected || isLoading}
              onClick={() => {
                if (selected) {
                  showReservations(selected.uuid);
                }
              }}
            >
              Show reservations…
            </Button>
            <RelatedRecordsBar
              records={[
                {
                  label: "Purchase lines",
                  href: selected
                    ? `/purchase-lines?product=${selected.productUuid}`
                    : null,
                },
              ]}
            />
          </div>
        )}
        exportAction={exportStockOnLocation}
        fileName="stock-on-location"
        searchPlaceholder="Search product, charge or bundle…"
        emptyText="No stock on location found."
        singular="lot"
        plural="lots"
      />
      {reservations && (
        <StockReservationsDialog
          data={reservations}
          open
          onOpenChange={(next) => {
            if (!next) {
              setReservations(null);
            }
          }}
        />
      )}
    </>
  );
};
