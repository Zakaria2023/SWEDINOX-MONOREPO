"use client";

import { KeyboardEvent } from "react";
import { PendingReturnLine } from "@/app/(dashboard)/return-orders/use-return-order-submit";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { TableCell, TableRow } from "@/components/shadcn/table";
import {
  cn,
  formatDateColumn,
  formatMoney,
  formatNumber,
  orDash,
  proRataSlice,
} from "@/lib/helpers";

type Props = {
  /** The line's `Code` — the next ten after the last line. */
  code: number;
  pending: PendingReturnLine;
  isSelected: boolean;
  /** The header's return date as typed — a new line's delivery date. */
  returnDate: string;
  disabled: boolean;
  onSelect: () => void;
  onChooseProduct: () => void;
  onQuantityChange: (returnQty: string) => void;
  onQuantityCommit?: () => void;
};

/**
 * A return line not saved yet, as `New` adds it: `Code` the next ten, `Order
 * line` 0, `Qty(p)` 0, `Provisional`, € 0,00 — and a `…` on `Product` that
 * opens the Stock window (return 290247, 29-9-2026). Once it names an invoiced
 * line it shows that line's figures, at the price the customer was charged.
 */
export const PendingReturnLineRow = ({
  code,
  pending,
  isSelected,
  returnDate,
  disabled,
  onSelect,
  onChooseProduct,
  onQuantityChange,
  onQuantityCommit,
}: Props) => {
  const { line, returnQty } = pending;
  const quantity = Number(returnQty || 0);
  const netPrice = Number(line?.netPrice ?? 0);
  const weightKg = line
    ? proRataSlice(Number(line.weightKg ?? 0), {
        quantity: Number(line.quantity ?? 0),
        alreadyBilled: 0,
        billing: quantity,
      })
    : 0;

  // Enter leaves the cell rather than submitting the form around it.
  const leaveOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  return (
    <TableRow
      onClick={onSelect}
      aria-selected={isSelected}
      className={cn("cursor-pointer", isSelected && "bg-accent")}
    >
      <TableCell className="text-right tabular-nums">{code}</TableCell>
      <TableCell className="text-right tabular-nums">
        {line ? `${line.orderId}/${line.lineNumber ?? 0}` : "0"}
      </TableCell>
      <TableCell>Provisional</TableCell>
      <TableCell className="whitespace-nowrap">
        {formatDateColumn(returnDate || null)}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <div className="flex items-center gap-1">
          <span>{line?.productCode ?? ""}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Choose the product from stock"
            onClick={(event) => {
              event.stopPropagation();
              onChooseProduct();
            }}
            disabled={disabled}
          >
            …
          </Button>
        </div>
      </TableCell>
      <TableCell>{line?.productName ?? ""}</TableCell>
      <TableCell className="text-right">
        <Input
          type="text"
          inputMode="decimal"
          className="w-20 text-right"
          aria-label={`Qty(p) of line ${code}`}
          value={returnQty}
          disabled={disabled}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => onQuantityChange(event.target.value)}
          onKeyDown={leaveOnEnter}
          onBlur={onQuantityCommit}
        />
      </TableCell>
      <TableCell className="text-right tabular-nums">0</TableCell>
      <TableCell>{orDash(line?.unit ? line.unit.toUpperCase() : null)}</TableCell>
      <TableCell className="text-right tabular-nums">
        {`${line?.lengthMm ?? 0} mm`}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {`${line?.widthMm ?? 0} mm`}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatNumber(weightKg)}
      </TableCell>
      <TableCell className="text-right tabular-nums">0</TableCell>
      <TableCell className="text-right tabular-nums">
        {formatMoney(netPrice)}
      </TableCell>
      <TableCell>{orDash(line?.priceUnit ?? null)}</TableCell>
      <TableCell className="text-right tabular-nums">0.00</TableCell>
      <TableCell />
      <TableCell className="text-right tabular-nums">0.00</TableCell>
      <TableCell />
      <TableCell className="text-right tabular-nums">
        {formatMoney(netPrice * quantity)}
      </TableCell>
    </TableRow>
  );
};
