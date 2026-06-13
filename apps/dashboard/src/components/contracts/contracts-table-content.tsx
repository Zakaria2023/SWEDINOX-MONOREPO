"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { type ContractListItem } from "@/app/(dashboard)/contracts/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";

type ColumnKey =
  | "id"
  | "contractType"
  | "contractGroupName"
  | "description"
  | "searchCode1"
  | "searchCode2"
  | "searchCode3"
  | "websiteSorting"
  | "hideOnWebsite"
  | "createdAt";

const ALL_COLUMNS: Array<{
  defaultVisible: boolean;
  key: ColumnKey;
  labelKey: string;
}> = [
  { key: "id", labelKey: "contracts-table-content.columns.id", defaultVisible: true },
  { key: "contractType", labelKey: "contracts-table-content.columns.contract-type", defaultVisible: true },
  { key: "contractGroupName", labelKey: "contracts-table-content.columns.contract-group-name", defaultVisible: true },
  { key: "description", labelKey: "contracts-table-content.columns.description", defaultVisible: true },
  { key: "searchCode1", labelKey: "contracts-table-content.columns.search-code-1", defaultVisible: false },
  { key: "searchCode2", labelKey: "contracts-table-content.columns.search-code-2", defaultVisible: false },
  { key: "searchCode3", labelKey: "contracts-table-content.columns.search-code-3", defaultVisible: false },
  { key: "websiteSorting", labelKey: "contracts-table-content.columns.website-sorting", defaultVisible: false },
  { key: "hideOnWebsite", labelKey: "contracts-table-content.columns.hide-on-website", defaultVisible: false },
  { key: "createdAt", labelKey: "contracts-table-content.columns.created-at", defaultVisible: false },
];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, column) => ({ ...acc, [column.key]: column.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type ContractsTableContentProps = {
  contracts: ContractListItem[];
};

export const ContractsTableContent = ({ contracts }: ContractsTableContentProps) => {
  const { t } = useTranslation();
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key as ColumnKey] }));

  const visibleColumns = ALL_COLUMNS.filter((column) => columnVisibility[column.key]);
  const fallbackValue = t("common.not-available");

  const renderCell = (contract: ContractListItem, key: ColumnKey) => {
    switch (key) {
      case "id":
        return <TableCell key={key} className="font-medium">{contract.id}</TableCell>;
      case "contractType":
        return (
          <TableCell key={key}>
            {contract.contractType
              ? t(`contract-form.contract-types.${contract.contractType}`)
              : fallbackValue}
          </TableCell>
        );
      case "contractGroupName":
        return <TableCell key={key}>{contract.contractGroupName ?? fallbackValue}</TableCell>;
      case "description":
        return <TableCell key={key}>{contract.description}</TableCell>;
      case "searchCode1":
        return <TableCell key={key}>{contract.searchCode1 ?? fallbackValue}</TableCell>;
      case "searchCode2":
        return <TableCell key={key}>{contract.searchCode2 ?? fallbackValue}</TableCell>;
      case "searchCode3":
        return <TableCell key={key}>{contract.searchCode3 ?? fallbackValue}</TableCell>;
      case "websiteSorting":
        return <TableCell key={key}>{contract.websiteSorting ?? fallbackValue}</TableCell>;
      case "hideOnWebsite":
        return (
          <TableCell key={key}>
            {contract.hideOnWebsite ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {t("common.yes")}
              </span>
            ) : (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                {t("common.no")}
              </span>
            )}
          </TableCell>
        );
      case "createdAt":
        return (
          <TableCell key={key}>
            {new Date(contract.createdAt).toLocaleDateString()}
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
            {contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                  {t("contracts-table-content.empty")}
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((contract) => (
                <TableRow key={contract.id}>
                  {visibleColumns.map((column) => renderCell(contract, column.key))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
