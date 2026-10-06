"use client";

import { useState } from "react";
import {
  ArrowRightLeft,
  ListChecks,
  Lock,
  MoveRight,
  PencilLine,
  Scissors,
  Tag,
  Boxes,
} from "lucide-react";
import {
  LocationTreeRow,
  SawOrderRow,
  StockLotDialogData,
  SupplierDeliveryRow,
} from "@/app/(dashboard)/stock/actions";
import { Button } from "@/components/shadcn/button";
import { StockBatchRegistrationDialog } from "@/components/stock/stock-batch-registration-dialog";
import { StockCorrectionDialog } from "@/components/stock/stock-correction-dialog";
import { StockLabelDialog } from "@/components/stock/stock-label-dialog";
import { StockOptionsDialog } from "@/components/stock/stock-options-dialog";
import { StockRelocateDialog } from "@/components/stock/stock-relocate-dialog";
import { StockReservationsDialog } from "@/components/stock/stock-reservations-dialog";
import { StockSplitDialog } from "@/components/stock/stock-split-dialog";
import { StockTransferDialog } from "@/components/stock/stock-transfer-dialog";

type Props = {
  data: StockLotDialogData;
  locations: LocationTreeRow[];
  deliveries: SupplierDeliveryRow[];
  sawOrders: SawOrderRow[];
};

type OpenDialog =
  | "relocate"
  | "correct"
  | "transfer"
  | "batch"
  | "reservations"
  | "label"
  | "options"
  | "split"
  | null;

/**
 * The reference's `Voorraad` toolbar, as it sits above the stock panel on a
 * product record:
 *
 *   + New · Verplaatsen… · Aanvullen… · Correctie… · Verschrotten… ·
 *   Overboeken… · Partijregistratie… · Reserveringen… · Voorraadlabel ·
 *   Opties bewerken · Splits
 *
 * Buttons act on the lot, in a toolbar above the grid — never a column of
 * actions per row.
 *
 * ⚠️ **`Aanvullen…` (Replenish) and `Verschrotten…` (Scrap) are not here**, and
 * that is deliberate. Both are **greyed in the reference** with a lot selected,
 * and grey is an answer: neither is reachable on a normal lot, so neither gets
 * built until something shows them enabled. Scrapping already has a route
 * through a warehouse work order.
 */
export const StockLotToolbar = ({
  data,
  locations,
  deliveries,
  sawOrders,
}: Props) => {
  const [open, setOpen] = useState<OpenDialog>(null);
  const close = () => setOpen(null);

  const { reservations, options } = data;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen("relocate")}
        >
          <MoveRight className="size-4" />
          Relocate…
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen("correct")}
        >
          <PencilLine className="size-4" />
          Correct…
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen("transfer")}
        >
          <ArrowRightLeft className="size-4" />
          Transfer…
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen("split")}
        >
          <Scissors className="size-4" />
          Split
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen("batch")}
        >
          <Boxes className="size-4" />
          Batch registration…
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen("reservations")}
        >
          <Lock className="size-4" />
          Reservations…
          {reservations.length > 0 ? (
            <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">
              {reservations.length}
            </span>
          ) : null}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen("options")}
        >
          <ListChecks className="size-4" />
          Edit options
          {options.length > 0 ? (
            <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">
              {options.length}
            </span>
          ) : null}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen("label")}
        >
          <Tag className="size-4" />
          Stock label
        </Button>
      </div>

      <StockRelocateDialog
        data={data}
        locations={locations}
        open={open === "relocate"}
        onOpenChange={(next) => (next ? setOpen("relocate") : close())}
      />
      <StockCorrectionDialog
        data={data}
        sawOrders={sawOrders}
        open={open === "correct"}
        onOpenChange={(next) => (next ? setOpen("correct") : close())}
      />
      <StockTransferDialog
        data={data}
        locations={locations}
        open={open === "transfer"}
        onOpenChange={(next) => (next ? setOpen("transfer") : close())}
      />
      <StockSplitDialog
        data={data}
        locations={locations}
        open={open === "split"}
        onOpenChange={(next) => (next ? setOpen("split") : close())}
      />
      <StockBatchRegistrationDialog
        data={data}
        deliveries={deliveries}
        open={open === "batch"}
        onOpenChange={(next) => (next ? setOpen("batch") : close())}
      />
      <StockReservationsDialog
        data={data}
        open={open === "reservations"}
        onOpenChange={(next) => (next ? setOpen("reservations") : close())}
      />
      <StockOptionsDialog
        data={data}
        open={open === "options"}
        onOpenChange={(next) => (next ? setOpen("options") : close())}
      />
      <StockLabelDialog
        data={data}
        open={open === "label"}
        onOpenChange={(next) => (next ? setOpen("label") : close())}
      />
    </>
  );
};
