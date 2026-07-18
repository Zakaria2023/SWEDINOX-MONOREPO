"use client";

import { CompanyCustomerStockInput } from "@/app/(dashboard)/companies/actions";
import { CUSTOMER_STOCK_REASON_LABELS } from "@/lib/labels";
import { Boxes, Plus, X } from "lucide-react";

type Props = {
  stock: CompanyCustomerStockInput[];
  removeStock: (index: number) => void;
  handleOpenStock: () => void;
  isPending: boolean;
};

export const CustomerStockSection = ({
  stock,
  removeStock,
  handleOpenStock,
  isPending,
}: Props) => (
  <section className="space-y-4">
    <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
      Customer Stock
    </h2>
    <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
      {stock.length > 0 && (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Location</th>
                <th className="px-3 py-2 font-medium">Product code</th>
                <th className="px-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 text-right font-medium">Qty (Stock)</th>
                <th className="px-3 py-2 font-medium">Reason</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {stock.map((entry, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="px-3 py-2">{entry.location}</td>
                  <td className="px-3 py-2 font-mono">{entry.productCode}</td>
                  <td className="px-3 py-2">{entry.productName}</td>
                  <td className="px-3 py-2 text-right">{entry.quantity}</td>
                  <td className="px-3 py-2">
                    {entry.reason ? CUSTOMER_STOCK_REASON_LABELS[entry.reason] : ""}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {entry.description}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeStock(index)}
                      className="text-muted-foreground hover:text-destructive"
                      disabled={isPending}
                    >
                      <X className="size-4" />
                      <span className="sr-only">Remove stock booking</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button
        type="button"
        onClick={handleOpenStock}
        className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        disabled={isPending}
      >
        <Plus className="size-4" />
        New
      </button>
      {stock.length === 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Boxes className="size-3.5" />
          No customer stock booked yet.
        </p>
      )}
    </div>
  </section>
);
