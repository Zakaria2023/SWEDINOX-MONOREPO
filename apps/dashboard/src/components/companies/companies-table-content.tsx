"use client";

import { CompanyDocumentCell } from "@/components/companies/company-document-cell";
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
import { setCompanyInactive } from "@/app/(dashboard)/companies/actions";
import { Button } from "@/components/shadcn/button";
import { SelectCompanies } from "@/db";
import { Eye, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RowAction } from "@/components/ui/row-action";
import { TableExportButton } from "@/components/ui/table-export-button";
import { TableNewLink } from "@/components/ui/table-new-link";

type ColumnKey = "id" | "companyName" | "documents" | "createdAt" | "updatedAt";

type InactiveToggleProps = {
  companyUuid: string;
  isInactive: boolean;
};

const ALL_COLUMNS: Array<{
  defaultVisible: boolean;
  key: ColumnKey;
  label: string;
}> = [
  { key: "id", label: "Code", defaultVisible: true },
  { key: "companyName", label: "Company Name", defaultVisible: true },
  { key: "documents", label: "Documents", defaultVisible: true },
  { key: "createdAt", label: "Created At", defaultVisible: false },
  { key: "updatedAt", label: "Updated At", defaultVisible: false },
];

type CompaniesTableContentProps = {
  companies: SelectCompanies[];
};

const InactiveToggle = ({ companyUuid, isInactive }: InactiveToggleProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onClick = () =>
    startTransition(async () => {
      await setCompanyInactive(companyUuid, !isInactive);
      router.refresh();
    });

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={isPending}
    >
      {isInactive ? "Activate" : "Inactive"}
    </Button>
  );
};

export const CompaniesTable = ({ companies }: CompaniesTableContentProps) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));
  };

  const visibleColumns = ALL_COLUMNS.filter(
    (column) => columnVisibility[column.key],
  );

  const renderCell = (company: SelectCompanies, key: ColumnKey) => {
    switch (key) {
      case "id":
        return (
          <TableCell key={key} className="font-medium">
            {company.id}
          </TableCell>
        );
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
      case "documents":
        return (
          <TableCell key={key}>
            <CompanyDocumentCell company={company} />
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
      <div className="flex items-start justify-end gap-2">
        <ColumnSelector
          columns={ALL_COLUMNS.map((column) => ({
            key: column.key,
            label: column.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
        <TableExportButton
          tableId="companies-table"
          fileName="companies"
          sheetName="Companies"
        />
        <TableNewLink href="/companies/add">New Company</TableNewLink>
      </div>

      <div>
        <Table id="companies-table">
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + 1}
                  className="h-24 text-center"
                >
                  No companies found
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id}>
                  {visibleColumns.map((column) =>
                    renderCell(company, column.key),
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <RowAction
                        href={`/companies/${company.uuid}`}
                        label="View company"
                        tone="view"
                      >
                        <Eye className="size-4" />
                      </RowAction>
                      <RowAction
                        href={`/companies/${company.uuid}/edit`}
                        label="Edit company"
                        tone="edit"
                      >
                        <Pencil className="size-4" />
                      </RowAction>
                      <InactiveToggle
                        companyUuid={company.uuid}
                        isInactive={company.isInactive ?? false}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
