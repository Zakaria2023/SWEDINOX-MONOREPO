"use client";

import Link from "next/link";

import { CommunicationSettingListItem } from "@/app/(dashboard)/communication-settings/actions";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { buildColumnVisibility } from "@/lib/helpers";
import { COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS, COMMUNICATION_SETTING_SHAPE_LABELS, COMMUNICATION_SETTING_TYPE_LABELS } from "@/lib/labels";
import { useState } from "react";

type ColumnKey =
  | "id"
  | "companyName"
  | "documentType"
  | "communicationType"
  | "shape"
  | "email"
  | "fax"
  | "createdAt"
  | "updatedAt";

const ALL_COLUMNS: Array<{
  defaultVisible: boolean;
  key: ColumnKey;
  label: string;
}> = [
  {
    key: "id",
    label: "Code",
    defaultVisible: true,
  },
  {
    key: "companyName",
    label: "Company",
    defaultVisible: true,
  },
  {
    key: "documentType",
    label: "Document Type",
    defaultVisible: true,
  },
  {
    key: "communicationType",
    label: "Communication Type",
    defaultVisible: true,
  },
  {
    key: "shape",
    label: "Shape",
    defaultVisible: true,
  },
  {
    key: "email",
    label: "Email",
    defaultVisible: true,
  },
  {
    key: "fax",
    label: "Fax",
    defaultVisible: false,
  },
  {
    key: "createdAt",
    label: "Created At",
    defaultVisible: false,
  },
  {
    key: "updatedAt",
    label: "Updated At",
    defaultVisible: false,
  },
];

type CommunicationSettingsTableContentProps = {
  settings: CommunicationSettingListItem[];
};

export const CommunicationSettingsTable = ({
  settings,
}: CommunicationSettingsTableContentProps) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter(
    (column) => columnVisibility[column.key],
  );
  const fallbackValue = "—";

  const renderCell = (setting: CommunicationSettingListItem, key: ColumnKey) => {
    switch (key) {
      case "id":
        return (
          <TableCell key={key} className="font-medium">
            {setting.id}
          </TableCell>
        );
      case "companyName":
        return (
          <TableCell key={key}>
            {setting.companyName ?? fallbackValue}
          </TableCell>
        );
      case "documentType":
        return (
          <TableCell key={key} className="font-medium">
            <Link
              href={`/communication-settings/${setting.id}`}
              className="text-primary hover:underline"
            >
              {COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS[setting.documentType]}
            </Link>
          </TableCell>
        );
      case "communicationType":
        return (
          <TableCell key={key}>
            {COMMUNICATION_SETTING_TYPE_LABELS[setting.communicationType]}
          </TableCell>
        );
      case "shape":
        return (
          <TableCell key={key}>
            {setting.shape
              ? COMMUNICATION_SETTING_SHAPE_LABELS[setting.shape]
              : fallbackValue}
          </TableCell>
        );
      case "email":
        return (
          <TableCell key={key}>{setting.email ?? fallbackValue}</TableCell>
        );
      case "fax":
        return <TableCell key={key}>{setting.fax ?? fallbackValue}</TableCell>;
      case "createdAt":
        return (
          <TableCell key={key}>
            {new Date(setting.createdAt).toLocaleDateString()}
          </TableCell>
        );
      case "updatedAt":
        return (
          <TableCell key={key}>
            {new Date(setting.updatedAt).toLocaleDateString()}
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
            label: column.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
      </div>

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {settings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center"
                >
                  No communication settings found
                </TableCell>
              </TableRow>
            ) : (
              settings.map((setting) => (
                <TableRow key={setting.id}>
                  {visibleColumns.map((column) =>
                    renderCell(setting, column.key),
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
