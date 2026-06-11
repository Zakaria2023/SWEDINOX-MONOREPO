"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { CommunicationSettingListItem } from "@/app/(dashboard)/communication-settings/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";

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
  labelKey: string;
}> = [
  { key: "id", labelKey: "communication-settings-table-content.columns.id", defaultVisible: true },
  { key: "companyName", labelKey: "communication-settings-table-content.columns.company-name", defaultVisible: true },
  { key: "documentType", labelKey: "communication-settings-table-content.columns.document-type", defaultVisible: true },
  { key: "communicationType", labelKey: "communication-settings-table-content.columns.communication-type", defaultVisible: true },
  { key: "shape", labelKey: "communication-settings-table-content.columns.shape", defaultVisible: true },
  { key: "email", labelKey: "communication-settings-table-content.columns.email", defaultVisible: true },
  { key: "fax", labelKey: "communication-settings-table-content.columns.fax", defaultVisible: false },
  { key: "createdAt", labelKey: "communication-settings-table-content.columns.created-at", defaultVisible: false },
  { key: "updatedAt", labelKey: "communication-settings-table-content.columns.updated-at", defaultVisible: false },
];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, column) => ({ ...acc, [column.key]: column.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type CommunicationSettingsTableContentProps = {
  settings: CommunicationSettingListItem[];
};

export const CommunicationSettingsTableContent = ({
  settings,
}: CommunicationSettingsTableContentProps) => {
  const { t } = useTranslation();
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key as ColumnKey] }));

  const visibleColumns = ALL_COLUMNS.filter((column) => columnVisibility[column.key]);
  const fallbackValue = t("common.not-available");

  const renderCell = (setting: CommunicationSettingListItem, key: ColumnKey) => {
    switch (key) {
      case "id":
        return <TableCell key={key} className="font-medium">{setting.id}</TableCell>;
      case "companyName":
        return <TableCell key={key}>{setting.companyName ?? fallbackValue}</TableCell>;
      case "documentType":
        return (
          <TableCell key={key}>
            {t(`communication-setting-form.document-type-options.${setting.documentType}`)}
          </TableCell>
        );
      case "communicationType":
        return (
          <TableCell key={key}>
            {t(`communication-setting-form.communication-type-options.${setting.communicationType}`)}
          </TableCell>
        );
      case "shape":
        return (
          <TableCell key={key}>
            {setting.shape
              ? t(`communication-setting-form.shape-options.${setting.shape}`)
              : fallbackValue}
          </TableCell>
        );
      case "email":
        return <TableCell key={key}>{setting.email ?? fallbackValue}</TableCell>;
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
            {settings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                  {t("communication-settings-table-content.empty")}
                </TableCell>
              </TableRow>
            ) : (
              settings.map((setting) => (
                <TableRow key={setting.id}>
                  {visibleColumns.map((column) => renderCell(setting, column.key))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
