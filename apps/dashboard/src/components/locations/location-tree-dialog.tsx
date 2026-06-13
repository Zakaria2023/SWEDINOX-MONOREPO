"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/helpers";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { type LocationForTree } from "@/app/(dashboard)/locations/actions";

type LocationTreeNode = LocationForTree & { children: LocationTreeNode[] };

function buildTree(locations: LocationForTree[]): LocationTreeNode[] {
  const byUuid = new Map<string, LocationTreeNode>();
  for (const loc of locations) {
    byUuid.set(loc.uuid, { ...loc, children: [] });
  }
  const roots: LocationTreeNode[] = [];
  for (const node of byUuid.values()) {
    if (node.adoptFrom && byUuid.has(node.adoptFrom)) {
      byUuid.get(node.adoptFrom)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

type TreeNodeItemProps = {
  depth: number;
  node: LocationTreeNode;
  onSelect: (uuid: string) => void;
  selected: string;
};

function TreeNodeItem({ depth, node, onSelect, selected }: TreeNodeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <>
      <div
        role="option"
        aria-selected={selected === node.uuid}
        className={cn(
          "flex cursor-pointer items-center gap-1 rounded py-1 pr-2 text-sm select-none hover:bg-muted",
          selected === node.uuid && "bg-primary/10 font-medium text-primary",
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(node.uuid)}
      >
        <span
          className="flex size-4 shrink-0 items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setExpanded((prev) => !prev);
          }}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )
          ) : null}
        </span>
        {node.name}
      </div>
      {expanded &&
        node.children.map((child) => (
          <TreeNodeItem
            key={child.uuid}
            depth={depth + 1}
            node={child}
            onSelect={onSelect}
            selected={selected}
          />
        ))}
    </>
  );
}

type LocationTreeDialogProps = {
  locations: LocationForTree[];
  onConfirm: (uuid: string, name: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  value: string;
};

export function LocationTreeDialog({
  locations,
  onConfirm,
  onOpenChange,
  open,
  value,
}: LocationTreeDialogProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(value);
  const tree = buildTree(locations);

  const handleConfirm = () => {
    const loc = locations.find((l) => l.uuid === selected);
    if (loc) onConfirm(loc.uuid, loc.name);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col">
        <DialogHeader>
          <DialogTitle>{t("location-tree-dialog.title")}</DialogTitle>
        </DialogHeader>
        <div
          role="listbox"
          className="min-h-[200px] flex-1 overflow-y-auto rounded-lg border p-2"
        >
          {tree.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">
              {t("location-tree-dialog.empty")}
            </p>
          ) : (
            tree.map((node) => (
              <TreeNodeItem
                key={node.uuid}
                depth={0}
                node={node}
                onSelect={setSelected}
                selected={selected}
              />
            ))
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!selected}>
            {t("common.ok")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
