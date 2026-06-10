"use client";

import { type SelectCompanies } from "@/db";
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
  { key: "id",          label: "Code",         defaultVisible: true  },
  { key: "companyName", label: "Company Name",  defaultVisible: true  },
  { key: "createdAt",   label: "Created At",    defaultVisible: false },
  { key: "updatedAt",   label: "Updated At",    defaultVisible: false },
] as const;

type ColumnKey = (typeof ALL_COLUMNS)[number]["key"];

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
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) => {
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key as ColumnKey] }));
  };

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (company: SelectCompanies, key: ColumnKey) => {
    switch (key) {
      case "id":
        return <TableCell key={key} className="font-medium">{company.id}</TableCell>;
      case "companyName":
        return <TableCell key={key}>{company.companyName}</TableCell>;
      case "createdAt":
        return <TableCell key={key}>{new Date(company.createdAt).toLocaleDateString()}</TableCell>;
      case "updatedAt":
        return <TableCell key={key}>{new Date(company.updatedAt).toLocaleDateString()}</TableCell>;
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
            {companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                  No companies found
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
