"use client";

import { ReservedOrderItemOption } from "@/app/(dashboard)/invoices/actions";
import { stockUnitLabel } from "@/lib/helpers";

type Props = {
  reservedItems: ReservedOrderItemOption[];
  selectedUuids: string[];
  /** Quantity being billed per line; absent means bill what is left. */
  quantities: Record<string, string>;
  onToggle: (uuid: string) => void;
  onQuantityChange: (uuid: string, quantity: string) => void;
  isPending: boolean;
};

export const InvoiceOrderItemsSection = ({
  reservedItems,
  selectedUuids,
  quantities,
  onToggle,
  onQuantityChange,
  isPending,
}: Props) => {
  if (reservedItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
        Delivered Order Items
      </h2>
      <p className="text-sm text-muted-foreground">
        Select which delivered order lines this invoice bills, and how much of
        each. Leave a quantity as it stands to bill the whole remainder; bill
        less and the line stays open for the rest. The stock already left the
        warehouse at delivery, so this is purely financial.
      </p>
      <div className="space-y-2">
        {reservedItems.map((item) => {
          const isSelected = selectedUuids.includes(item.uuid);
          const partlyBilled = Number(item.invoicedQuantity ?? 0) > 0;

          return (
            <div
              key={item.uuid}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-4 py-2.5 transition-colors hover:bg-muted/40"
            >
              <label className="flex flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  className="size-4 rounded border-border accent-primary"
                  checked={isSelected}
                  onChange={() => onToggle(item.uuid)}
                  disabled={isPending}
                />
                <span className="flex-1 text-sm text-gray-700">
                  {[item.productCode, item.productName]
                    .filter(Boolean)
                    .join(" — ")}
                </span>
              </label>
              <span className="text-sm text-muted-foreground">
                Order #{item.orderId} ·{" "}
                {partlyBilled
                  ? `${item.quantity} of ${item.orderedQuantity} left`
                  : item.quantity}{" "}
                {stockUnitLabel(item.unit)}
              </span>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Bill</span>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  max={item.quantity}
                  className="w-28 rounded-md border border-border px-2 py-1 text-right text-sm"
                  value={quantities[item.uuid] ?? item.quantity}
                  onChange={(event) =>
                    onQuantityChange(item.uuid, event.target.value)
                  }
                  disabled={isPending || !isSelected}
                />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};
