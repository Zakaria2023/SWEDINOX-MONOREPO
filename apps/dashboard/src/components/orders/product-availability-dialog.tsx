"use client";

import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  ProductAvailabilityAction,
  productAvailabilityActions,
} from "@/lib/enums";
import { formatDayMonthYear, formatNumber } from "@/lib/helpers";
import { PRODUCT_AVAILABILITY_ACTION_LABELS } from "@/lib/labels";

/** The line being asked about, as the dialog's first sentence names it. */
export type ProductAvailabilityLine = {
  /** The line's code, `10`. */
  code: number;
  deliveryDate: string | Date | null;
  quantity: number;
  /** `ST`, as the reference prints it. */
  unit: string | null;
  description: string;
  lengthMm: number | null;
  widthMm: number | null;
  /** All matching stock of the article, free to take. */
  availableQuantity: number;
  availableUnit: string | null;
  availableKg: number;
};

type Props = {
  line: ProductAvailabilityLine;
  /** `remember` is `Don't ask this question again`. */
  onChoose: (action: ProductAvailabilityAction, remember: boolean) => void;
  onCancel: () => void;
};

/**
 * `Product availability check order line 10` — what the reference asks when a
 * Stk line's stock window is closed without choosing a lot (O108309/10,
 * 16-10-2026). `Customize delivery yourself` reopens the window, `Leave
 * delivery…` keeps the line without stock and Blocked. `Add ShearCut` would
 * plan the line as a cut from bigger stock; nothing here plans that yet, so it
 * is greyed.
 */
export const ProductAvailabilityDialog = ({
  line,
  onChoose,
  onCancel,
}: Props) => {
  const [remember, setRemember] = useState(false);
  const size =
    line.lengthMm || line.widthMm
      ? ` (${line.lengthMm ?? 0}x${line.widthMm ?? 0} mm)`
      : "";
  const availableUnit = line.availableUnit
    ? line.availableUnit.toUpperCase()
    : "";

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Product availability check order line {line.code}
          </DialogTitle>
          <DialogDescription>
            delivery on {formatDayMonthYear(line.deliveryDate)}:{" "}
            {formatNumber(line.quantity)} {line.unit ?? ""} {line.description}
            {size}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <p className="text-sm">
            Available quantity: {formatNumber(line.availableQuantity)}{" "}
            {availableUnit}, {formatNumber(line.availableKg)} Kg
          </p>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            Don&apos;t ask this question again: same action for all
            subsequent deliveries of this sales order
          </label>
        </DialogBody>

        <DialogFooter>
          {productAvailabilityActions.map((action) => (
            <Button
              key={action}
              type="button"
              variant={action === "customize_delivery" ? "default" : "outline"}
              disabled={action === "add_shear_cut"}
              title={
                action === "add_shear_cut"
                  ? "Not built: a shear cut cannot be planned on a line yet"
                  : undefined
              }
              onClick={() => onChoose(action, remember)}
            >
              {PRODUCT_AVAILABILITY_ACTION_LABELS[action]}
            </Button>
          ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
