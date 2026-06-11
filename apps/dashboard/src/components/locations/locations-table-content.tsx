"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { type SelectLocations } from "@/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";

type ColumnKey =
  | "id"
  | "name"
  | "locationType"
  | "pickingSequence"
  | "isBlocked"
  | "blockedForOptimization"
  | "limitedDimensions"
  | "adoptFrom"
  | "adoptPosition"
  | "createdAt"
  | "updatedAt";

const ALL_COLUMNS: Array<{
  defaultVisible: boolean;
  key: ColumnKey;
  labelKey: string;
}> = [
  { key: "id", labelKey: "locations-table-content.columns.id", defaultVisible: true },
  { key: "name", labelKey: "locations-table-content.columns.name", defaultVisible: true },
  { key: "locationType", labelKey: "locations-table-content.columns.location-type", defaultVisible: true },
  { key: "pickingSequence", labelKey: "locations-table-content.columns.picking-sequence", defaultVisible: true },
  { key: "isBlocked", labelKey: "locations-table-content.columns.is-blocked", defaultVisible: true },
  {
    key: "blockedForOptimization",
    labelKey: "locations-table-content.columns.blocked-for-optimization",
    defaultVisible: false,
  },
  {
    key: "limitedDimensions",
    labelKey: "locations-table-content.columns.limited-dimensions",
    defaultVisible: false,
  },
  { key: "adoptFrom", labelKey: "locations-table-content.columns.adopt-from", defaultVisible: false },
  { key: "adoptPosition", labelKey: "locations-table-content.columns.adopt-position", defaultVisible: false },
  { key: "createdAt", labelKey: "locations-table-content.columns.created-at", defaultVisible: false },
  { key: "updatedAt", labelKey: "locations-table-content.columns.updated-at", defaultVisible: false },
];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, column) => ({ ...acc, [column.key]: column.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type LocationsTableContentProps = {
  locations: SelectLocations[];
};

export const LocationsTableContent = ({ locations }: LocationsTableContentProps) => {
  const { t } = useTranslation();
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) => {
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key as ColumnKey] }));
  };

  const visibleColumns = ALL_COLUMNS.filter((column) => columnVisibility[column.key]);
  const fallbackValue = t("common.not-available");

  const booleanBadge = (value: boolean | null) =>
    value ? (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        {t("common.yes")}
      </span>
    ) : (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        {t("common.no")}
      </span>
    );

  const typeBadge = (value: string) => (
    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
      {t(`location-form.location-type-options.${value}`)}
    </span>
  );

  const renderCell = (location: SelectLocations, key: ColumnKey) => {
    switch (key) {
      case "id":
        return <TableCell key={key} className="font-medium">{location.id}</TableCell>;
      case "name":
        return <TableCell key={key}>{location.name}</TableCell>;
      case "locationType":
        return <TableCell key={key}>{typeBadge(location.locationType)}</TableCell>;
      case "pickingSequence":
        return <TableCell key={key}>{location.pickingSequence ?? fallbackValue}</TableCell>;
      case "isBlocked":
        return <TableCell key={key}>{booleanBadge(location.isBlocked)}</TableCell>;
      case "blockedForOptimization":
        return (
          <TableCell key={key}>
            {booleanBadge(location.blockedForOptimization)}
          </TableCell>
        );
      case "limitedDimensions":
        return (
          <TableCell key={key}>
            {booleanBadge(location.limitedDimensions)}
          </TableCell>
        );
      case "adoptFrom":
        return <TableCell key={key}>{location.adoptFrom ?? fallbackValue}</TableCell>;
      case "adoptPosition":
        return (
          <TableCell key={key}>
            {location.adoptPosition
              ? t(`location-form.adopt-position-options.${location.adoptPosition}`)
              : fallbackValue}
          </TableCell>
        );
      case "createdAt":
        return (
          <TableCell key={key}>
            {new Date(location.createdAt).toLocaleDateString()}
          </TableCell>
        );
      case "updatedAt":
        return (
          <TableCell key={key}>
            {new Date(location.updatedAt).toLocaleDateString()}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ColumnSelector
          columns={ALL_COLUMNS.map((column) => ({
            key: column.key,
            label: t(column.labelKey),
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead key={column.key}>{t(column.labelKey)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                  {t("locations-table-content.empty")}
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
