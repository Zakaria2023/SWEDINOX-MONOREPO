"use client";

import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ContractCompanyEntry } from "@/app/(dashboard)/contracts/actions";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CONTRACTABLE_ROLE_LABELS } from "@/lib/labels";
import { pluralize } from "@/lib/helpers";
import { Plus, X } from "lucide-react";

type ContractCompaniesSectionProps = {
  isPending: boolean;
  companies: ContractCompanyEntry[];
  availableCompanies: CompanyOption[];
  onOpenDialog: () => void;
  onRemoveCompany: (index: number) => void;
};

export const ContractCompaniesSection = ({
  isPending,
  companies,
  availableCompanies,
  onOpenDialog,
  onRemoveCompany,
}: ContractCompaniesSectionProps) => {
  const getCompanyLabel = (uuid: string) => {
    const c = availableCompanies.find((c) => c.uuid === uuid);
    if (!c) return uuid;
    return [c.searchCode1, c.companyName].filter(Boolean).join(" — ");
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          Companies{" "}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {companies.length}{" "}
            {pluralize(companies.length, "company", "companies")}
          </span>
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenDialog}
          disabled={isPending}
        >
          <Plus className="mr-1.5 size-4" />
          Add Company
        </Button>
      </div>

      {companies.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Starting Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {getCompanyLabel(entry.companyUuid)}
                  </TableCell>
                  <TableCell>
                    {entry.role ? (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {CONTRACTABLE_ROLE_LABELS[entry.role]}
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>{entry.startingDate ?? "N/A"}</TableCell>
                  <TableCell>{entry.endDate ?? "N/A"}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => onRemoveCompany(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
};
