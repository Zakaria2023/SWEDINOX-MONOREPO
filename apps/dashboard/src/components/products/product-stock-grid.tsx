"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ProductStockRow } from "@/app/(dashboard)/products/actions";
import {
  getLocationTreeForPicker,
  getSawOrdersForLot,
  getStockLotDialog,
  getSupplierDeliveriesForLot,
  LocationTreeRow,
  SawOrderRow,
  StockLotDialogData,
  SupplierDeliveryRow,
} from "@/app/(dashboard)/stock/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { StockLotToolbar } from "@/components/stock/stock-lot-toolbar";
import { cn, formatNumber, orDash, yesNo } from "@/lib/helpers";
import { STOCK_UNIT_LABELS } from "@/lib/labels";

// The article screen's stock grid, in the reference's order (230/249/252).
// `Charge` is ours, kept beside the internal charge.
const HEADERS = [
  "Location",
  "Blocked",
  "Quality",
  "Stock cat.",
  "Length",
  "Width",
  "Thickness",
  "Options",
  "Technical",
  "Reserved",
  "Available",
  "StkU",
  "Kg (tech)",
  "Kg (res)",
  "Kg (avail)",
  "Remark",
  "M1",
  "Charge",
  "Internal charge",
  "Bundle",
];

type Props = {
  rows: ProductStockRow[];
};

/** What the `Voorraad` toolbar needs for the selected lot. */
type LoadedLot = {
  dialog: StockLotDialogData | null;
  locations: LocationTreeRow[];
  deliveries: SupplierDeliveryRow[];
  sawOrders: SawOrderRow[];
};

/**
 * The `Voorraad` grid on an article, with the lot toolbar above it.
 *
 * 🔑 The reference puts the toolbar over this grid, acting on the selected row
 * (230, 249, 252) — not only on a lot's own page. Clicking a row selects it and
 * loads what its dialogs open with; until then every button is greyed.
 *
 * Loaded one call after another rather than together: the shared database caps
 * connections.
 */
export const ProductStockGrid = ({ rows }: Props) => {
  const router = useRouter();
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<LoadedLot | null>(null);
  const [, startLoading] = useTransition();
  // The last lot asked for, so a slow answer for an earlier click is dropped.
  const requested = useRef<string | null>(null);

  const load = (stockUuid: string) => {
    requested.current = stockUuid;
    startLoading(async () => {
      const dialog = await getStockLotDialog(stockUuid);
      const locations = await getLocationTreeForPicker();
      const deliveries = await getSupplierDeliveriesForLot(stockUuid);
      const sawOrders = await getSawOrdersForLot(stockUuid);
      if (requested.current === stockUuid) {
        setLoaded({ dialog, locations, deliveries, sawOrders });
      }
    });
  };

  const select = (stockUuid: string) => {
    setSelectedUuid(stockUuid);
    setLoaded(null);
    load(stockUuid);
  };

  // A dialog may have changed the lot or made a new one: re-read both the lot
  // and the grid.
  const refresh = () => {
    router.refresh();
    if (selectedUuid) {
      load(selectedUuid);
    }
  };

  return (
    <div className="space-y-2">
      <StockLotToolbar
        data={loaded?.dialog ?? null}
        locations={loaded?.locations ?? []}
        deliveries={loaded?.deliveries ?? []}
        sawOrders={loaded?.sawOrders ?? []}
        onDialogClosed={refresh}
      />
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              {HEADERS.map((header) => (
                <TableHead key={header} className="whitespace-nowrap">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={HEADERS.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No stock on hand.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const quantity = Number(row.quantity ?? 0);
                const reserved = Number(row.reservedQuantity ?? 0);
                const technicalKg = Number(row.quantityKg ?? 0);
                // The reserved share of the theoretical weight, by quantity.
                const reservedKg =
                  quantity > 0 ? (technicalKg * reserved) / quantity : 0;

                return (
                  <TableRow
                    key={row.uuid}
                    aria-selected={row.uuid === selectedUuid}
                    onClick={() => select(row.uuid)}
                    className={cn(
                      "cursor-pointer",
                      row.uuid === selectedUuid && "bg-accent",
                    )}
                  >
                    <TableCell className="font-medium">
                      {orDash(row.locationName)}
                    </TableCell>
                    <TableCell>{yesNo(row.blocked)}</TableCell>
                    <TableCell>{orDash(row.quality)}</TableCell>
                    <TableCell>{orDash(row.stockCategory)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(row.lengthMm)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(row.widthMm)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(row.thicknessMm)}
                    </TableCell>
                    <TableCell>{orDash(row.options)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(quantity)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(reserved)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Math.max(quantity - reserved, 0))}
                    </TableCell>
                    <TableCell>
                      {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(technicalKg)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(reservedKg)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Math.max(technicalKg - reservedKg, 0))}
                    </TableCell>
                    <TableCell>{orDash(row.remark)}</TableCell>
                    {/* Running metres: quantity × length. */}
                    <TableCell className="text-right tabular-nums">
                      {row.lengthMm
                        ? formatNumber((quantity * row.lengthMm) / 1000)
                        : "—"}
                    </TableCell>
                    <TableCell>{orDash(row.charge)}</TableCell>
                    <TableCell>{orDash(row.internalCharge)}</TableCell>
                    <TableCell>{orDash(row.internalBatch)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
