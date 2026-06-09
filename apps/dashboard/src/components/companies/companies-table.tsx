"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorMessage } from "@/components/ui/error-message";
import {
  deleteCompany,
  getCompanies,
  type CompanyListItem,
} from "@/app/(dashboard)/companies/actions";

const ALL_COLUMNS = [
  { key: "id", label: "Code", defaultVisible: true },
  { key: "companyName", label: "Company Name", defaultVisible: true },
  { key: "createdAt", label: "Created At", defaultVisible: false },
  { key: "updatedAt", label: "Updated At", defaultVisible: false },
] as const;

type ColumnKey = (typeof ALL_COLUMNS)[number]["key"];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, column) => ({ ...acc, [column.key]: column.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

export const CompaniesTable = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<CompanyListItem | null>(
    null,
  );
  const [isDeletePending, setIsDeletePending] = useState(false);
  const [actionError, setActionError] = useState("");
  const columnsRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnsRef.current &&
        !columnsRef.current.contains(event.target as Node)
      ) {
        setColumnsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleColumn = (key: ColumnKey) => {
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);
  const { data, isError, isLoading } = useQuery({
    queryKey: ["companies", page, search],
    queryFn: () => getCompanies(page, pageSize, search),
  });
  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;
  const errorMessage =
    actionError ||
    data?.error ||
    (isError ? "Failed to load companies. Please try again." : "");

  const handleDeleteCompany = async () => {
    if (!companyToDelete) {
      return;
    }

    setIsDeletePending(true);
    setActionError("");

    try {
      const result = await deleteCompany(companyToDelete.id);

      if (!result.success) {
        setActionError(result.error ?? "Failed to delete company.");
        return;
      }

      setCompanyToDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
    } finally {
      setIsDeletePending(false);
    }
  };

  const renderCell = (company: CompanyListItem, key: ColumnKey) => {
    switch (key) {
      case "id":
        return (
          <TableCell key={key} className="font-medium">
            {company.id}
          </TableCell>
        );
      case "companyName":
        return <TableCell key={key}>{company.companyName}</TableCell>;
      case "createdAt":
        return (
          <TableCell key={key}>
            {company.createdAt.toLocaleDateString()}
          </TableCell>
        );
      case "updatedAt":
        return (
          <TableCell key={key}>
            {company.updatedAt.toLocaleDateString()}
          </TableCell>
        );
    }
  };

  return (
    <>
      <div className="space-y-4">
        {errorMessage && <ErrorMessage message={errorMessage} />}

        <div className="flex items-center gap-4">
          <Input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="max-w-sm"
          />

          <div ref={columnsRef} className="relative ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setColumnsOpen((open) => !open)}
            >
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>

            {columnsOpen && (
              <div className="absolute right-0 z-10 mt-1 max-h-80 min-w-40 overflow-y-auto rounded-md border bg-white p-2 shadow-md">
                {ALL_COLUMNS.map((column) => (
                  <label
                    key={column.key}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={columnVisibility[column.key]}
                      onChange={() => toggleColumn(column.key)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    {column.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length + 1}
                    className="h-24 text-center"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length + 1}
                    className="h-24 text-center"
                  >
                    No companies found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((company) => (
                  <TableRow key={company.id}>
                    {visibleColumns.map((column) =>
                      renderCell(company, column.key),
                    )}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            router.push(`/companies/${company.id}/edit`)
                          }
                        >
                          <Pencil />
                          <span className="sr-only">Edit company</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setCompanyToDelete(company)}
                        >
                          <Trash2 className="text-destructive" />
                          <span className="sr-only">Delete company</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {data?.data.length || 0} of {data?.total || 0} companies
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() =>
                setPage((currentPage) => Math.max(1, currentPage - 1))
              }
              disabled={page === 1 || isLoading}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter((pageNumber) => {
                  if (totalPages <= 7) return true;
                  if (pageNumber === 1 || pageNumber === totalPages) return true;
                  if (pageNumber >= page - 1 && pageNumber <= page + 1) {
                    return true;
                  }
                  return false;
                })
                .map((pageNumber, index, pages) => {
                  const previousPage = pages[index - 1];
                  const showDots = previousPage && pageNumber - previousPage > 1;

                  return (
                    <div key={pageNumber} className="flex items-center gap-1">
                      {showDots && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        onClick={() => setPage(pageNumber)}
                        variant={page === pageNumber ? "default" : "outline"}
                        size="sm"
                        className="min-w-10"
                      >
                        {pageNumber}
                      </Button>
                    </div>
                  );
                })}
            </div>

            <Button
              onClick={() =>
                setPage((currentPage) =>
                  Math.min(Math.max(totalPages, 1), currentPage + 1),
                )
              }
              disabled={totalPages <= 1 || page === totalPages || isLoading}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(companyToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setCompanyToDelete(null);
          }
        }}
        title="Delete Company"
        description={
          companyToDelete
            ? `Delete "${companyToDelete.companyName}"? This cannot be undone.`
            : ""
        }
        onConfirm={handleDeleteCompany}
        isPending={isDeletePending}
      />
    </>
  );
};
