"use client";

import { type SelectLocations } from "@/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { useState } from "react";

const ALL_COLUMNS = [
  { key: "id",                     label: "Code",                    defaultVisible: true  },
  { key: "name",                   label: "Name",                    defaultVisible: true  },
  { key: "locationType",           label: "Type",                    defaultVisible: true  },
  { key: "pickingSequence",        label: "Picking Seq.",            defaultVisible: true  },
  { key: "isBlocked",              label: "Blocked",                 defaultVisible: true  },
  { key: "blockedForOptimization", label: "Blocked for Optim.",      defaultVisible: false },
  { key: "limitedDimensions",     label: "Limited Dim.",            defaultVisible: false },
  { key: "adoptFrom",              label: "Adopt From",              defaultVisible: false },
  { key: "adoptPosition",          label: "Adopt Position",          defaultVisible: false },
  { key: "createdAt",              label: "Created At",              defaultVisible: false },
  { key: "updatedAt",              label: "Updated At",              defaultVisible: false },
] as const;

type ColumnKey = (typeof ALL_COLUMNS)[number]["key"];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, column) => ({ ...acc, [column.key]: column.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type LocationsTableContentProps = {
  locations: SelectLocations[];
};

const booleanBadge = (value: boolean | null) =>
  value ? (
    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
      Yes
    </span>
  ) : (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      No
    </span>
  );

const typeBadge = (value: string) => (
  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 capitalize">
    {value.replace(/_/g, " ")}
  </span>
);

export const LocationsTableContent = ({ locations }: LocationsTableContentProps) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) => {
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key as ColumnKey] }));
  };

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (location: SelectLocations, key: ColumnKey) => {
    switch (key) {
      case "id":
        return <TableCell key={key} className="font-medium">{location.id}</TableCell>;
      case "name":
        return <TableCell key={key}>{location.name}</TableCell>;
      case "locationType":
        return <TableCell key={key}>{typeBadge(location.locationType)}</TableCell>;
      case "pickingSequence":
        return <TableCell key={key}>{location.pickingSequence ?? "—"}</TableCell>;
      case "isBlocked":
        return <TableCell key={key}>{booleanBadge(location.isBlocked)}</TableCell>;
      case "blockedForOptimization":
        return <TableCell key={key}>{booleanBadge(location.blockedForOptimization)}</TableCell>;
      case "limitedDimensions":
        return <TableCell key={key}>{booleanBadge(location.limitedDimensions)}</TableCell>;
      case "adoptFrom":
        return <TableCell key={key}>{location.adoptFrom ?? "—"}</TableCell>;
      case "adoptPosition":
        return <TableCell key={key} className="capitalize">{location.adoptPosition ?? "—"}</TableCell>;
      case "createdAt":
        return <TableCell key={key}>{new Date(location.createdAt).toLocaleDateString()}</TableCell>;
      case "updatedAt":
        return <TableCell key={key}>{new Date(location.updatedAt).toLocaleDateString()}</TableCell>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ColumnSelector
          columns={ALL_COLUMNS}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                  No locations found
                </TableCell>
              </TableRow>
            ) : (
              locations.map((location) => (
                <TableRow key={location.id}>
                  {visibleColumns.map((column) => renderCell(location, column.key))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
