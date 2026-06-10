"use client";

import type { CommunicationSettingListItem } from "@/app/(dashboard)/communication-settings/actions";
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
  { key: "id",                label: "Code",          defaultVisible: true  },
  { key: "companyName",       label: "Company",       defaultVisible: true  },
  { key: "documentType",      label: "Document Type", defaultVisible: true  },
  { key: "communicationType", label: "Comm. Type",    defaultVisible: true  },
  { key: "shape",             label: "Shape",         defaultVisible: true  },
  { key: "email",             label: "Email",         defaultVisible: true  },
  { key: "fax",               label: "Fax",           defaultVisible: false },
  { key: "createdAt",         label: "Created At",    defaultVisible: false },
  { key: "updatedAt",         label: "Updated At",    defaultVisible: false },
] as const;

type ColumnKey = (typeof ALL_COLUMNS)[number]["key"];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, col) => ({ ...acc, [col.key]: col.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

const formatEnum = (val: string) =>
  val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

type CommunicationSettingsTableContentProps = {
  settings: CommunicationSettingListItem[];
};

export const CommunicationSettingsTableContent = ({
  settings,
}: CommunicationSettingsTableContentProps) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key as ColumnKey] }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (setting: CommunicationSettingListItem, key: ColumnKey) => {
    switch (key) {
      case "id":
        return <TableCell key={key} className="font-medium">{setting.id}</TableCell>;
      case "companyName":
        return <TableCell key={key}>{setting.companyName ?? "—"}</TableCell>;
      case "documentType":
        return <TableCell key={key}>{formatEnum(setting.documentType)}</TableCell>;
      case "communicationType":
        return <TableCell key={key}>{formatEnum(setting.communicationType)}</TableCell>;
      case "shape":
        return <TableCell key={key}>{setting.shape ? formatEnum(setting.shape) : "—"}</TableCell>;
      case "email":
        return <TableCell key={key}>{setting.email ?? "—"}</TableCell>;
      case "fax":
        return <TableCell key={key}>{setting.fax ?? "—"}</TableCell>;
      case "createdAt":
        return <TableCell key={key}>{new Date(setting.createdAt).toLocaleDateString()}</TableCell>;
      case "updatedAt":
        return <TableCell key={key}>{new Date(setting.updatedAt).toLocaleDateString()}</TableCell>;
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
              {visibleColumns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {settings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                  No communication settings found
                </TableCell>
              </TableRow>
            ) : (
              settings.map((setting) => (
                <TableRow key={setting.id}>
                  {visibleColumns.map((col) => renderCell(setting, col.key))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
