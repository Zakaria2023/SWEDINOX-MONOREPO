"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { useReturnLinePicker } from "@/app/(dashboard)/return-orders/use-return-line-picker";
import { PendingReturnLine } from "@/app/(dashboard)/return-orders/use-return-order-submit";
import {
  StockSearchChoice,
  StockSearchDialog,
} from "@/components/orders/stock-search-dialog";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { FormError } from "@/components/ui/form-error";
import { PendingReturnLineRow } from "./pending-return-line-row";
import { RETURN_ORDER_LINE_COLUMNS } from "./return-order-lines";

type Props = {
  pendingLines: PendingReturnLine[];
  setPendingLines: Dispatch<SetStateAction<PendingReturnLine[]>>;
  companyUuid: string;
  /** The sales order named on the header — `Par. return` sets it. */
  orderUuid: string;
  returnDate: string;
  disabled: boolean;
};

/**
 * The `Order lines` panel of a return not saved yet. `New` wakes once there is
 * a customer and adds a blank line; its `…` opens the Stock window, and what is
 * chosen there is matched to what this customer was invoiced. Nothing is saved
 * until Create.
 */
export const NewReturnOrderLines = ({
  pendingLines,
  setPendingLines,
  companyUuid,
  orderUuid,
  returnDate,
  disabled,
}: Props) => {
  // The line whose `…` opened the Stock window, or null when it is shut.
  const [pickingLine, setPickingLine] = useState<number | null>(null);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>();
  const pickLine = useReturnLinePicker({ companyUuid, orderUuid });

  const chooseProduct = (
    index: number,
    choice: StockSearchChoice,
  ) => {
    setError(undefined);
    const excluded = pendingLines.flatMap((pending, at) =>
      pending.line && at !== index ? [pending.line.orderItemUuid] : [],
    );
    void pickLine(choice, excluded).then((picked) => {
      if (!picked.line) {
        setError(picked.error);
        return;
      }
      const line = picked.line;
      setPendingLines((current) =>
        current.map((pending, at) =>
          at === index ? { ...pending, line } : pending,
        ),
      );
    });
  };

  const addBlankLine = () => {
    setError(undefined);
    setSelectedLine(pendingLines.length);
    setPendingLines((current) => [...current, { line: null, returnQty: "0" }]);
  };

  const setReturnQty = (index: number, returnQty: string) =>
    setPendingLines((current) =>
      current.map((pending, at) =>
        at === index ? { ...pending, returnQty } : pending,
      ),
    );

  const deleteSelectedLine = () => {
    if (selectedLine === null) {
      return;
    }
    setPendingLines((current) =>
      current.filter((_, index) => index !== selectedLine),
    );
    setSelectedLine(null);
  };

  return (
    <div className="space-y-2 p-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addBlankLine}
          disabled={
            disabled ||
            !companyUuid ||
            pendingLines.some((pending) => !pending.line)
          }
        >
          New
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={deleteSelectedLine}
          disabled={disabled || selectedLine === null}
        >
          Delete
        </Button>
        <Button type="button" variant="outline" size="sm" disabled>
          Reservations…
        </Button>
      </div>
      <StockSearchDialog
        open={pickingLine !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPickingLine(null);
          }
        }}
        onChoose={(choice) => {
          if (pickingLine !== null) {
            chooseProduct(pickingLine, choice);
          }
          setPickingLine(null);
        }}
      />
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {RETURN_ORDER_LINE_COLUMNS.map((column, index) => (
                <TableHead key={`${column}-${index}`}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingLines.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={RETURN_ORDER_LINE_COLUMNS.length}
                  className="text-muted-foreground"
                >
                  No lines.
                </TableCell>
              </TableRow>
            ) : (
              pendingLines.map((pending, index) => (
                <PendingReturnLineRow
                  key={index}
                  code={(index + 1) * 10}
                  pending={pending}
                  isSelected={index === selectedLine}
                  returnDate={returnDate}
                  disabled={disabled}
                  onSelect={() => setSelectedLine(index)}
                  onChooseProduct={() => setPickingLine(index)}
                  onQuantityChange={(returnQty) =>
                    setReturnQty(index, returnQty)
                  }
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <FormError>{error}</FormError>
    </div>
  );
};
