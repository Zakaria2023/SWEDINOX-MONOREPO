"use client";

import { MachineProductInput } from "@/app/(dashboard)/machines/actions";
import { Package, Plus, X } from "lucide-react";

type Props = {
  products: MachineProductInput[];
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
                <th className="px-3 py-2 font-medium">Product (group)</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium">Preference</th>
                <th className="px-3 py-2 font-medium">Production (per hour)</th>
                <th className="px-3 py-2 font-medium">Prod. U.</th>
                <th className="px-3 py-2 font-medium">Min. Corner</th>
                <th className="px-3 py-2 font-medium">Max. Corner</th>
                <th className="px-3 py-2 font-medium">Days in system</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono">
                    {product.productCode || "—"}
                  </td>
                  <td className="px-3 py-2">{product.description || "—"}</td>
                  <td className="px-3 py-2">{product.preference ?? 0}</td>
                  <td className="px-3 py-2">
                    {product.productionPerHour ?? 0}
                  </td>
                  <td className="px-3 py-2">{product.prodUnit || "—"}</td>
                  <td className="px-3 py-2">{product.minCorner ?? "0.00"}</td>
                  <td className="px-3 py-2">{product.maxCorner ?? "0.00"}</td>
                  <td className="px-3 py-2">{product.daysInSystem ?? 0}</td>
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
