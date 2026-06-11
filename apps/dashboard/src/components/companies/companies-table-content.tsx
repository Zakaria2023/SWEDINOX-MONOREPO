"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { type SelectCompanies } from "@/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";

type ColumnKey = "id" | "companyName" | "createdAt" | "updatedAt";

const ALL_COLUMNS: Array<{
  defaultVisible: boolean;
  key: ColumnKey;
  labelKey: string;
}> = [
  { key: "id", labelKey: "companies-table-content.columns.id", defaultVisible: true },
  { key: "companyName", labelKey: "companies-table-content.columns.company-name", defaultVisible: true },
  { key: "createdAt", labelKey: "companies-table-content.columns.created-at", defaultVisible: false },
  { key: "updatedAt", labelKey: "companies-table-content.columns.updated-at", defaultVisible: false },
];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, column) => ({ ...acc, [column.key]: column.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type CompaniesTableContentProps = {
  companies: SelectCompanies[];
};

export const CompaniesTableContent = ({
  companies,
}: CompaniesTableContentProps) => {
  const { t } = useTranslation();
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) => {
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key as ColumnKey] }));
  };

  const visibleColumns = ALL_COLUMNS.filter((column) => columnVisibility[column.key]);

  const renderCell = (company: SelectCompanies, key: ColumnKey) => {
    switch (key) {
      case "id":
        return <TableCell key={key} className="font-medium">{company.id}</TableCell>;
      case "companyName":
        return (
          <TableCell key={key} className="font-medium">
            {company.companyName}
          </TableCell>
        );
      case "createdAt":
        return (
          <TableCell key={key}>
            {new Date(company.createdAt).toLocaleDateString()}
          </TableCell>
        );
      case "updatedAt":
        return (
          <TableCell key={key}>
            {new Date(company.updatedAt).toLocaleDateString()}
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
            {companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                  {t("companies-table-content.empty")}
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id}>
                  {visibleColumns.map((column) => renderCell(company, column.key))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
