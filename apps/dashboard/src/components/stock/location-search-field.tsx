"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { LocationTreeRow } from "@/app/(dashboard)/stock/actions";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { WAREHOUSE_LOCATION_TYPE_LABELS } from "@/lib/labels";

type Props = {
  id?: string;
  locations: LocationTreeRow[];
  value: string;
  onChange: (uuid: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
};

type TreeNodeProps = {
  row: LocationTreeRow;
  childrenOf: Map<string | null, LocationTreeRow[]>;
  expanded: Set<string>;
  onToggle: (uuid: string) => void;
  onPick: (uuid: string) => void;
  selected: string;
};

const TreeNode = ({
  row,
  childrenOf,
  expanded,
  onToggle,
  onPick,
  selected,
}: TreeNodeProps) => {
  const children = childrenOf.get(row.uuid) ?? [];
  const isOpen = expanded.has(row.uuid);

  return (
    <li>
      <div
        className={`flex items-center gap-1 rounded px-1 py-0.5 ${
          selected === row.uuid ? "bg-accent" : ""
        }`}
      >
        {children.length > 0 ? (
          <button
            type="button"
            aria-label={isOpen ? `Collapse ${row.name}` : `Expand ${row.name}`}
            onClick={() => onToggle(row.uuid)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isOpen ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        ) : (
          <span className="size-4" />
        )}
        <button
          type="button"
          onClick={() => onPick(row.uuid)}
          className="flex-1 text-left text-sm hover:underline"
        >
          {row.name}
          {row.locationType ? (
            <span className="ml-2 text-xs text-muted-foreground">
              {WAREHOUSE_LOCATION_TYPE_LABELS[row.locationType]}
            </span>
          ) : null}
          {row.blocked ? (
            <span className="ml-2 text-xs text-amber-600">Blocked</span>
          ) : null}
        </button>
      </div>
      {isOpen && children.length > 0 ? (
        <ul className="ml-4 border-l pl-2">
          {children.map((child) => (
            <TreeNode
              key={child.uuid}
              row={child}
              childrenOf={childrenOf}
              expanded={expanded}
              onToggle={onToggle}
              onPick={onPick}
              selected={selected}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
};

/**
 * `Naar locatie` — the reference's `Locatie zoeken`.
 *
 * 🔴 **Locations are a tree under one warehouse, and ours was a flat list.**
 * The reference's picker has `Zoek` / `Magazijn` tabs, a numbered depth toolbar
 * reading `1` `2`, and a single expandable root — `00 Hego Almere` — with the
 * locations nested beneath it. A flat list cannot tell `Laad` from the
 * warehouse it hangs under, which is exactly the distinction a warehouseman
 * needs when two sections both have a bay called `9B`.
 *
 * The `Zoek` tab is the search box here: typing filters to matching locations
 * and shows them with their path, because a match four levels down is useless
 * if you cannot see where it is.
 */
export const LocationSearchField = ({
  id,
  locations,
  value,
  onChange,
  disabled,
  invalid,
  placeholder,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [picked, setPicked] = useState(value);

  const childrenOf = useMemo(() => {
    const map = new Map<string | null, LocationTreeRow[]>();
    locations.forEach((row) => {
      const key = row.parentUuid ?? null;
      map.set(key, [...(map.get(key) ?? []), row]);
    });
    return map;
  }, [locations]);

  const byUuid = useMemo(
    () => new Map(locations.map((row) => [row.uuid, row])),
    [locations],
  );

  /**
   * The path to a location, so a search hit says where it sits.
   *
   * The depth bound is a guard against a parent cycle, not a claim about how
   * deep the warehouse tree goes.
   */
  const segmentsOf = (uuid: string, depth = 0): string[] => {
    const row = byUuid.get(uuid);
    if (!row || depth > 16) {
      return [];
    }
    const above = row.parentUuid ? segmentsOf(row.parentUuid, depth + 1) : [];
    return [...above, row.name];
  };

  const pathOf = (uuid: string): string => segmentsOf(uuid).join(" › ");

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return [];
    }
    return locations
      .filter((row) => row.name.toLowerCase().includes(term))
      .slice(0, 50);
  }, [locations, search]);

  const roots = childrenOf.get(null) ?? [];

  const toggle = (uuid: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });

  const confirm = () => {
    onChange(picked);
    setOpen(false);
  };

  return (
    <>
      <div className="flex gap-2">
        <Input
          id={id}
          readOnly
          aria-invalid={invalid || undefined}
          value={value ? pathOf(value) : ""}
          placeholder={placeholder ?? "No location chosen"}
          onClick={() => !disabled && setOpen(true)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => {
            setPicked(value);
            setOpen(true);
          }}
        >
          <Search className="size-4" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Find location</DialogTitle>
            <DialogDescription>
              Locations are a tree under each warehouse. Search by name, or
              expand the warehouse to walk down to a bay.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-3">
            <Input
              value={search}
              placeholder="Search locations"
              onChange={(event) => setSearch(event.target.value)}
            />

            <div className="max-h-80 overflow-y-auto rounded-lg border p-2">
              {search.trim() ? (
                matches.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No location matches “{search}”.
                  </p>
                ) : (
                  <ul className="space-y-0.5">
                    {matches.map((row) => (
                      <li key={row.uuid}>
                        <button
                          type="button"
                          onClick={() => setPicked(row.uuid)}
                          className={`w-full rounded px-2 py-1 text-left text-sm hover:bg-accent ${
                            picked === row.uuid ? "bg-accent" : ""
                          }`}
                        >
                          {row.name}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {pathOf(row.uuid)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                <ul>
                  {roots.map((row) => (
                    <TreeNode
                      key={row.uuid}
                      row={row}
                      childrenOf={childrenOf}
                      expanded={expanded}
                      onToggle={toggle}
                      onPick={setPicked}
                      selected={picked}
                    />
                  ))}
                </ul>
              )}
            </div>

            {picked ? (
              <p className="text-sm">
                <span className="text-muted-foreground">Chosen: </span>
                {pathOf(picked)}
              </p>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            {/* Greyed until a location is picked, the way the reference greys
                `Gebruik geselecteerde artikel` on its own pickers. */}
            <Button type="button" disabled={!picked} onClick={confirm}>
              Use this location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
