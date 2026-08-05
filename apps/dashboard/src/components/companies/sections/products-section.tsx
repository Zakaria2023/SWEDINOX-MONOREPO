"use client";

import { CompanyProductInput } from "@/app/(dashboard)/companies/actions";
import {
  DELIVERY_TIME_UNIT_LABELS,
  PURCHASING_UNIT_LABELS,
} from "@/lib/labels";
import { DeliveryTimeUnit, PurchasingUnit } from "@/lib/enums";
import { Package, Plus, X } from "lucide-react";

type Props = {
  products: CompanyProductInput[];
  removeProduct: (index: number) => void;
  handleOpenProduct: () => void;
  isPending: boolean;
};

export const ProductsSection = ({
  products,
  removeProduct,
  handleOpenProduct,
  isPending,
}: Props) => (
  <section className="space-y-4">
    <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
      Products
    </h2>
    <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
      {products.length > 0 && (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium">Pref</th>
                <th className="px-3 py-2 font-medium">EAN</th>
                <th className="px-3 py-2 font-medium">External Code</th>
                <th className="px-3 py-2 font-medium">Editing</th>
                <th className="px-3 py-2 font-medium">Delivery Time</th>
                <th className="px-3 py-2 font-medium">Min. Order Qty</th>
                <th className="px-3 py-2 font-medium">Order Series</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono">{product.productCode}</td>
                  <td className="px-3 py-2">{product.name}</td>
                  <td className="px-3 py-2 text-center">
                    {product.preferred ? "✓" : ""}
                  </td>
                  <td className="px-3 py-2">{product.ean || "—"}</td>
                  <td className="px-3 py-2">
                    {product.externalProductCode || "—"}
                  </td>
                  <td className="px-3 py-2">{product.editing || "—"}</td>
                  <td className="px-3 py-2">
                    {product.deliveryTime ?? 0}
                    {product.deliveryTimeUnit
                      ? ` ${DELIVERY_TIME_UNIT_LABELS[product.deliveryTimeUnit as DeliveryTimeUnit]}`
                      : ""}
                  </td>
                  <td className="px-3 py-2">
                    {product.minOrderQty ?? "0"}
                    {product.minOrderQtyUnit
                      ? ` ${PURCHASING_UNIT_LABELS[product.minOrderQtyUnit as PurchasingUnit]}`
                      : ""}
                  </td>
                  <td className="px-3 py-2">
                    {product.orderSeries ?? 0}
                    {product.orderSeriesUnit
                      ? ` ${PURCHASING_UNIT_LABELS[product.orderSeriesUnit as PurchasingUnit]}`
                      : ""}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="text-muted-foreground hover:text-destructive"
                      disabled={isPending}
                    >
                      <X className="size-4" />
                      <span className="sr-only">Remove product</span>
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
        onClick={handleOpenProduct}
        className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        disabled={isPending}
      >
        <Plus className="size-4" />
        Add Product
      </button>
      {products.length === 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Package className="size-3.5" />
          No products added yet.
        </p>
      )}
    </div>
  </section>
);
