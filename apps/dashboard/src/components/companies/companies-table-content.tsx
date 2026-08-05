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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/companies/${company.uuid}`}
                        aria-label="View company"
                        className="inline-flex text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="size-4" />
                      </Link>
                      <Link
                        href={`/companies/${company.uuid}/edit`}
                        aria-label="Edit company"
                        className="inline-flex text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-4" />
                      </Link>
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
