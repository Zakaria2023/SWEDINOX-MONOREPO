"use client";

import { ReservedOrderItemOption } from "@/app/(dashboard)/invoices/actions";

type Props = {
  reservedItems: ReservedOrderItemOption[];
  selectedUuids: string[];
  onToggle: (uuid: string) => void;
  isPending: boolean;
};

export const InvoiceOrderItemsSection = ({
  reservedItems,
  selectedUuids,
  onToggle,
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
        Select which delivered order lines this invoice bills. Each is billed
        in full; the stock already left the warehouse at delivery, so this is
        purely financial.
      </p>
      <div className="space-y-2">
        {reservedItems.map((item) => (
          <label
            key={item.uuid}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-2.5 transition-colors hover:bg-muted/40"
          >
            <input
              type="checkbox"
              className="size-4 rounded border-border accent-primary"
              checked={selectedUuids.includes(item.uuid)}
              onChange={() => onToggle(item.uuid)}
              disabled={isPending}
            />
            <span className="flex-1 text-sm text-gray-700">
              {[item.productCode, item.productName].filter(Boolean).join(" — ")}
            </span>
            <span className="text-sm text-muted-foreground">
              Order #{item.orderId} · {item.quantity}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};
