"use client";

import { KeyboardEvent, useState } from "react";
import {
  Controller,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  useFormContext,
} from "react-hook-form";
import {
  OrderLinePick,
  stockChoiceToLinePick,
} from "@/app/(dashboard)/orders/mappers";
import { OrderFormValues } from "@/app/(dashboard)/orders/validation";
import {
  ORDER_LINE_COLUMNS,
  ORDER_LINE_TOOLBAR_NOT_BUILT,
  SOURCE_TYPE_OPTIONS,
} from "@/components/orders/order-lines";
import { StockSearchDialog } from "@/components/orders/stock-search-dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { FormError } from "@/components/ui/form-error";
import { orderSourceTypes } from "@/lib/enums";
import {
  cn,
  formatDateColumn,
  formatMoney,
  formatNumber,
  formatPercent,
  lineSpecificationLabel,
  orDash,
} from "@/lib/helpers";

type Props = {
  itemFields: FieldArrayWithId<OrderFormValues, "items", "id">[];
  appendItem: UseFieldArrayAppend<OrderFormValues, "items">;
  removeItem: UseFieldArrayRemove;
  /** What each line's `…` picked, keyed by the line's field id. */
  picks: Record<string, OrderLinePick>;
  onPick: (fieldId: string, pick: OrderLinePick | null) => void;
  /** `New` wakes once there is a customer, as the reference's does. */
  canAdd: boolean;
};

/**
 * `Order lines` on an order that is not saved yet. `New` adds a blank line —
 * code 10, Qty(p) 0, `Provisional` — and its `…` opens the `Stock` window,
 * the only way a selling line names its metal. The lines go with the order
 * on Create, and are reserved and priced there.
 */
export const OrderNewLines = ({
  itemFields,
  appendItem,
  removeItem,
  picks,
  onPick,
  canAdd,
}: Props) => {
  const {
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<OrderFormValues>();
  const lines = watch("items") ?? [];
  const deliveryDate = watch("deliveryDate") ?? "";
  // The line whose `…` opened the stock window, or null when it is shut.
  const [searchingLine, setSearchingLine] = useState<number | null>(null);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [lineError, setLineError] = useState<string | undefined>();

  const searchingIsCrossDock =
    searchingLine !== null && lines[searchingLine]?.sourceType === "cross_dock";

  // The first thing wrong with a line, said with its code.
  const firstLineError = itemFields
    .map((field, index) => {
      const lineErrors = errors.items?.[index];
      const message =
        lineErrors?.stockUuid?.message ?? lineErrors?.quantity?.message;
      return message ? `Line ${(index + 1) * 10}: ${message}` : null;
    })
    .find((message) => message !== null);

  const addBlankLine = () => {
    setLineError(undefined);
    setSelectedLine(itemFields.length);
    appendItem(
      {
        stockUuid: "",
        productUuid: "",
        productLabel: "",
        quantity: "0",
        sourceType: "stock",
      },
      { shouldFocus: false },
    );
  };

  const deleteSelectedLine = () => {
    if (selectedLine === null) {
      return;
    }
    const field = itemFields[selectedLine];
    if (field) {
      onPick(field.id, null);
    }
    removeItem(selectedLine);
    setSelectedLine(null);
  };

  // Enter leaves the cell rather than submitting the order around it.
  const leaveOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addBlankLine}
          disabled={!canAdd || lines.some((line) => !line.productUuid)}
          title={canAdd ? undefined : "Choose the customer first"}
        >
          New
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={deleteSelectedLine}
          disabled={selectedLine === null}
        >
          Delete
        </Button>
        {[
          lineSpecificationLabel(
            selectedLine === null ? undefined : lines[selectedLine]?.sourceType,
          ),
          ...ORDER_LINE_TOOLBAR_NOT_BUILT,
        ].map((label) => (
          <Button
            key={label}
            type="button"
            variant="outline"
            size="sm"
            disabled
            title="Not built yet"
          >
            {label}
          </Button>
        ))}
      </div>

      <StockSearchDialog
        open={searchingLine !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSearchingLine(null);
          }
        }}
        // A `CD` line buys its metal, so it takes the article rather than a
        // lot, the way a buying document does.
        productOnly={searchingIsCrossDock}
        sources={searchingIsCrossDock ? ["catalogue"] : ["stock"]}
        onChoose={(choice) => {
          if (searchingLine === null) {
            return;
          }
          const field = itemFields[searchingLine];
          const pick = stockChoiceToLinePick(choice, searchingIsCrossDock);
          setSearchingLine(null);
          if (!field) {
            return;
          }
          if (!pick) {
            setLineError(
              "That article has no lot on the shelf to sell from — pick a lot, or make the line a CD line.",
            );
            return;
          }
          setLineError(undefined);
          onPick(field.id, pick);
          setValue(`items.${searchingLine}.stockUuid`, pick.stockUuid ?? "", {
            shouldValidate: true,
          });
          setValue(`items.${searchingLine}.productUuid`, pick.productUuid);
          setValue(
            `items.${searchingLine}.productLabel`,
            [pick.productCode, pick.productName].filter(Boolean).join(" — "),
          );
        }}
      />

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="whitespace-nowrap">
              {ORDER_LINE_COLUMNS.map((column, index) => (
                <TableHead key={`${column}-${index}`}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemFields.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={ORDER_LINE_COLUMNS.length}
                  className="text-muted-foreground"
                >
                  No lines.
                </TableCell>
              </TableRow>
            ) : (
              itemFields.map((field, index) => {
                const pick = picks[field.id] ?? null;
                const quantity = Number(
                  (lines[index]?.quantity ?? "0").replace(",", "."),
                );
                return (
                  <TableRow
                    key={field.id}
                    onClick={() => setSelectedLine(index)}
                    aria-selected={index === selectedLine}
                    className={cn(
                      "cursor-pointer whitespace-nowrap",
                      index === selectedLine && "bg-accent",
                    )}
                  >
                    <TableCell className="text-right tabular-nums">
                      {(index + 1) * 10}
                    </TableCell>
                    <TableCell>
                      <Controller
                        control={control}
                        name={`items.${index}.sourceType`}
                        render={({ field: typeField }) => (
                          <Select
                            className="w-24"
                            value={typeField.value || "stock"}
                            options={SOURCE_TYPE_OPTIONS}
                            onValueChange={(next) => {
                              const sourceType = orderSourceTypes.find(
                                (type) => type === next,
                              );
                              if (!sourceType) {
                                return;
                              }
                              typeField.onChange(sourceType);
                              // Switching between a lot and an article starts
                              // the line's product over.
                              setValue(`items.${index}.stockUuid`, "");
                              setValue(`items.${index}.productUuid`, "");
                              setValue(`items.${index}.productLabel`, "");
                              onPick(field.id, null);
                            }}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      {formatDateColumn(deliveryDate || null)}
                    </TableCell>
                    <TableCell>Provisional</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>{pick?.productCode ?? ""}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          aria-label={`Choose the product of line ${(index + 1) * 10} from stock`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSearchingLine(index);
                          }}
                        >
                          …
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{pick?.productName ?? ""}</TableCell>
                    <TableCell>{orDash(pick?.stockCategory ?? null)}</TableCell>
                    <TableCell>{orDash(pick?.quality ?? null)}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="w-20 text-right"
                        aria-label={`Qty(p) of line ${(index + 1) * 10}`}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={leaveOnEnter}
                        {...register(`items.${index}.quantity`)}
                      />
                    </TableCell>
                    <TableCell>
                      {orDash(pick?.unit ? pick.unit.toUpperCase() : null)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(pick?.lengthMm ?? null)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(pick?.widthMm ?? null)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(pick?.thicknessMm ?? null)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(
                        Number.isFinite(quantity)
                          ? quantity * (pick?.pieceWeightKg ?? 0)
                          : 0,
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">—</TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                    {/* Priced on the server when the order is created. */}
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(0)}
                    </TableCell>
                    <TableCell />
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPercent(0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(0)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={false}
                        readOnly
                        disabled
                        aria-label={`Profit too low on line ${(index + 1) * 10}`}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <FormError>{lineError ?? firstLineError ?? undefined}</FormError>
      <p className="text-xs text-muted-foreground">
        Prices, costs and profit are struck from the customer&apos;s contract
        and the lot&apos;s value when the order is created.
      </p>
    </div>
  );
};
