"use client";

import { ProductGroupOption } from "@/app/(dashboard)/product-groups/actions";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { cn } from "@/lib/helpers";
import { ChevronRight, Package, Search } from "lucide-react";
import { useMemo, useState } from "react";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSelect: (product: ProductOption) => void;
  productGroups: ProductGroupOption[];
  products: ProductOption[];
};

type Tab = "search" | "assortment";

const GroupNode = ({
  group,
  depth,
  childGroupsByParent,
  productsByGroup,
  expanded,
  toggleExpanded,
  selectedUuid,
  onPick,
}: {
  group: ProductGroupOption;
  depth: number;
  childGroupsByParent: Map<string, ProductGroupOption[]>;
  productsByGroup: Map<string, ProductOption[]>;
  expanded: Set<string>;
  toggleExpanded: (uuid: string) => void;
  selectedUuid: string | null;
  onPick: (product: ProductOption) => void;
}) => {
  const isExpanded = expanded.has(group.uuid);
  const childGroups = childGroupsByParent.get(group.uuid) ?? [];
  const groupProducts = productsByGroup.get(group.uuid) ?? [];
  const hasChildren = childGroups.length > 0 || groupProducts.length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => hasChildren && toggleExpanded(group.uuid)}
        className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm hover:bg-muted"
        style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
      >
        {hasChildren ? (
          <ChevronRight
            className={cn(
              "size-3.5 shrink-0 transition-transform",
              isExpanded && "rotate-90",
            )}
          />
        ) : (
          <span className="size-3.5 shrink-0" />
        )}
        <span className="truncate">{group.name}</span>
      </button>

      {isExpanded && (
        <div>
          {childGroups.map((child) => (
            <GroupNode
              key={child.uuid}
              group={child}
              depth={depth + 1}
              childGroupsByParent={childGroupsByParent}
              productsByGroup={productsByGroup}
              expanded={expanded}
              toggleExpanded={toggleExpanded}
              selectedUuid={selectedUuid}
              onPick={onPick}
            />
          ))}
          {groupProducts.map((product) => (
            <button
              key={product.uuid}
              type="button"
              onClick={() => onPick(product)}
              className={cn(
                "flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm hover:bg-muted",
                selectedUuid === product.uuid && "bg-primary/10 text-primary",
              )}
              style={{ paddingLeft: `${(depth + 1) * 1.25 + 0.5}rem` }}
            >
              <Package className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {product.productCode}
                {product.name ? ` — ${product.name}` : ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const ProductPickerDialog = ({
  isOpen,
  onOpenChange,
  onCancel,
  onSelect,
  productGroups,
  products,
}: Props) => {
  const [activeTab, setActiveTab] = useState<Tab>("assortment");
  const [searchTerm, setSearchTerm] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<ProductOption | null>(null);

  const rootGroups = useMemo(
    () => productGroups.filter((g) => !g.parentUuid),
    [productGroups],
  );

  const childGroupsByParent = useMemo(() => {
    const map = new Map<string, ProductGroupOption[]>();
    for (const g of productGroups) {
      if (!g.parentUuid) continue;
      const list = map.get(g.parentUuid) ?? [];
      list.push(g);
      map.set(g.parentUuid, list);
    }
    return map;
  }, [productGroups]);

  const productsByGroup = useMemo(() => {
    const map = new Map<string, ProductOption[]>();
    for (const p of products) {
      if (!p.productGroupUuid) continue;
      const list = map.get(p.productGroupUuid) ?? [];
      list.push(p);
      map.set(p.productGroupUuid, list);
    }
    return map;
  }, [products]);

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return products.filter(
      (p) =>
        p.productCode.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term),
    );
  }, [products, searchTerm]);

  const toggleExpanded = (uuid: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });

  const handleCancel = () => {
    setSelected(null);
    setSearchTerm("");
    onCancel();
  };

  const handleOk = () => {
    if (!selected) return;
    onSelect(selected);
    setSelected(null);
    setSearchTerm("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Article search</DialogTitle>
          <DialogDescription>
            Pick a product from the assortment tree, or search by product code
            or name.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3">
          <div className="flex gap-1 border-b">
            <button
              type="button"
              onClick={() => setActiveTab("search")}
              className={cn(
                "border-b-2 px-3 py-1.5 text-sm",
                activeTab === "search"
                  ? "border-primary font-medium text-primary"
                  : "border-transparent text-muted-foreground",
              )}
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("assortment")}
              className={cn(
                "border-b-2 px-3 py-1.5 text-sm",
                activeTab === "assortment"
                  ? "border-primary font-medium text-primary"
                  : "border-transparent text-muted-foreground",
              )}
            >
              Assortment
            </button>
          </div>

          {activeTab === "search" ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search by product code or name…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="max-h-80 overflow-y-auto rounded-md border">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {searchTerm
                      ? "No matching products."
                      : "Start typing to search."}
                  </div>
                ) : (
                  searchResults.map((product) => (
                    <button
                      key={product.uuid}
                      type="button"
                      onClick={() => setSelected(product)}
                      className={cn(
                        "flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-sm hover:bg-muted",
                        selected?.uuid === product.uuid &&
                          "bg-primary/10 text-primary",
                      )}
                    >
                      <Package className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">
                        {product.productCode} — {product.name}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto rounded-md border p-1">
              {rootGroups.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No product groups found.
                </div>
              ) : (
                rootGroups.map((group) => (
                  <GroupNode
                    key={group.uuid}
                    group={group}
                    depth={0}
                    childGroupsByParent={childGroupsByParent}
                    productsByGroup={productsByGroup}
                    expanded={expanded}
                    toggleExpanded={toggleExpanded}
                    selectedUuid={selected?.uuid ?? null}
                    onPick={setSelected}
                  />
                ))
              )}
            </div>
          )}

          {selected && (
            <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
              Selected:{" "}
              <span className="font-medium">{selected.productCode}</span> —{" "}
              {selected.name}
            </div>
          )}
        </DialogBody>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleOk} disabled={!selected}>
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
