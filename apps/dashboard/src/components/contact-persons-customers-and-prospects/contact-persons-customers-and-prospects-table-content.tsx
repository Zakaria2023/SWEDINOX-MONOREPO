"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ContactPersonCustomerProspectRow,
  exportContactPersonsCustomersAndProspects,
} from "@/app/(dashboard)/contact-persons-customers-and-prospects/actions";
import {
  CONTACT_PERSON_COLUMNS,
  ContactPersonColumnKey,
} from "@/app/(dashboard)/contact-persons-customers-and-prospects/columns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { BooleanFlag } from "@/components/ui/boolean-flag";
import { ColumnSelector } from "@/components/ui/column-selector";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import {
  buildColumnVisibility,
  contactPersonName,
  customerGroupLabel,
  formatRevenue,
  orDash,
  salesRepresentativeLabel,
} from "@/lib/helpers";
import {
  CONTACT_CATEGORY_LABELS,
  CONTACT_SALUTATION_LABELS,
} from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";

type ColumnKey = ContactPersonColumnKey;

type Props = {
  page: Paged<ContactPersonCustomerProspectRow>;
  filters: TableFilterControl[];
};

const ALL_COLUMNS = selectorColumns(CONTACT_PERSON_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  companyName: "company",
  companyId: "companyCode",
  lastName: "lastName",
  firstName: "firstName",
};

const RIGHT_ALIGNED = new Set<ColumnKey>([
  "revenueLastYear",
  "revenueThisYear",
  "creditLimit",
  "targetAnnualSales",
]);

const ROLE_COLUMNS: Partial<
  Record<ColumnKey, (row: ContactPersonCustomerProspectRow) => boolean>
> = {
  isCustomer: (row) => row.isCustomer,
  isProspect: (row) => row.isProspect,
  isSupplier: (row) => row.isSupplier,
  isProcessor: (row) => row.isProcessor,
  isTransporter: (row) => row.isTransporter,
  isAgent: (row) => row.isAgent,
  isOther: (row) => row.isOther,
};

export const ContactPersonsCustomersAndProspectsTable = ({
  page,
  filters,
}: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const categoriesText = (row: ContactPersonCustomerProspectRow) => {
    const categories = row.categories ?? [];
    if (categories.length === 0) {
      return null;
    }
    return categories
      .map((category) => CONTACT_CATEGORY_LABELS[category] ?? category)
      .join(", ");
  };

  const renderCell = (
    row: ContactPersonCustomerProspectRow,
    key: ColumnKey,
  ) => {
    const roleValue = ROLE_COLUMNS[key];
    if (roleValue) {
      const label = ALL_COLUMNS.find((col) => col.key === key)?.label ?? key;
      return (
        <TableCell key={key} className="text-center">
          <BooleanFlag on={roleValue(row)} label={label} />
        </TableCell>
      );
    }

    switch (key) {
      case "companyId":
        return (
          <TableCell key={key} className="tabular-nums">
            {orDash(row.companyId)}
          </TableCell>
        );
      case "companyName":
        return (
          <TableCell key={key} className="font-medium">
            {row.companyUuid ? (
              <Link
                href={`/companies/${row.companyUuid}`}
                className="text-primary hover:underline"
              >
                {orDash(row.companyName)}
              </Link>
            ) : (
              orDash(row.companyName)
            )}
          </TableCell>
        );
      case "visitStreetAndNo":
        return <TableCell key={key}>{orDash(row.visitStreetAndNo)}</TableCell>;
      case "visitPostalCode":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {orDash(row.visitPostalCode)}
          </TableCell>
        );
      case "visitCity":
        return <TableCell key={key}>{orDash(row.visitCity)}</TableCell>;
      case "visitCountry":
        return <TableCell key={key}>{orDash(row.visitCountry)}</TableCell>;
      case "visitTelephone":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {orDash(row.visitTelephone)}
          </TableCell>
        );
      case "visitFax":
        return <TableCell key={key}>{orDash(row.visitFax)}</TableCell>;
      case "revenueLastYear":
        return (
          <TableCell key={key} className="text-right">
            {formatRevenue(row.revenueLastYear)}
          </TableCell>
        );
      case "revenueThisYear":
        return (
          <TableCell key={key} className="text-right">
            {formatRevenue(row.revenueThisYear)}
          </TableCell>
        );
      case "contactPerson":
        return (
          <TableCell key={key}>{orDash(contactPersonName(row))}</TableCell>
        );
      case "categories":
        return <TableCell key={key}>{orDash(categoriesText(row))}</TableCell>;
      case "email":
        return <TableCell key={key}>{orDash(row.email)}</TableCell>;
      case "telephone":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {orDash(row.telephone)}
          </TableCell>
        );
      case "address":
        return <TableCell key={key}>{orDash(row.address)}</TableCell>;
      case "postalCode":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {orDash(row.postalCode)}
          </TableCell>
        );
      case "city":
        return <TableCell key={key}>{orDash(row.city)}</TableCell>;
      case "addressCountry":
        return <TableCell key={key}>{orDash(row.addressCountry)}</TableCell>;
      case "addressTelephone":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {orDash(row.addressTelephone)}
          </TableCell>
        );
      case "addressFax":
        return <TableCell key={key}>{orDash(row.addressFax)}</TableCell>;
      case "accountManager":
        return (
          <TableCell key={key}>
            {salesRepresentativeLabel(row.accountManager)}
          </TableCell>
        );
      case "representative":
        return (
          <TableCell key={key}>
            {salesRepresentativeLabel(row.representative)}
          </TableCell>
        );
      case "customerGroup":
        return (
          <TableCell key={key}>
            {customerGroupLabel(row.customerGroup)}
          </TableCell>
        );
      case "industry":
        return <TableCell key={key}>{orDash(row.industry)}</TableCell>;
      case "classification":
        return <TableCell key={key}>{orDash(row.classification)}</TableCell>;
      case "creditLimit":
        return (
          <TableCell key={key} className="text-right">
            {formatRevenue(row.creditLimit)}
          </TableCell>
        );
      case "competitors":
        return <TableCell key={key}>{orDash(row.competitors)}</TableCell>;
      case "customerRegion":
        return <TableCell key={key}>{orDash(row.customerRegion)}</TableCell>;
      case "targetAnnualSales":
        return (
          <TableCell key={key} className="text-right">
            {formatRevenue(row.targetAnnualSales)}
          </TableCell>
        );
      case "searchCode1":
        return <TableCell key={key}>{orDash(row.searchCode1)}</TableCell>;
      case "searchCode2":
        return <TableCell key={key}>{orDash(row.searchCode2)}</TableCell>;
      case "searchCode3":
        return <TableCell key={key}>{orDash(row.searchCode3)}</TableCell>;
      case "salutation":
        return (
          <TableCell key={key}>
            {orDash(
              row.salutation ? CONTACT_SALUTATION_LABELS[row.salutation] : null,
            )}
          </TableCell>
        );
      case "initials":
        return <TableCell key={key}>{orDash(row.initials)}</TableCell>;
      case "firstName":
        return (
          <TableCell key={key} className="font-medium">
            <Link
              href={`/contacts/${row.uuid}`}
              className="text-primary hover:underline"
            >
              {row.firstName ?? "View contact"}
            </Link>
          </TableCell>
        );
      case "lastName":
        return <TableCell key={key}>{orDash(row.lastName)}</TableCell>;
      case "mobile":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {orDash(row.mobile)}
          </TableCell>
        );
      default:
        return <TableCell key={key}>—</TableCell>;
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search name, e-mail or company…"
        filters={filters}
      >
        <ColumnSelector
          columns={ALL_COLUMNS.map((col) => ({
            key: col.key,
            label: col.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
        <PagedTableExportButton
          fileName="contact-persons-customers-and-prospects"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportContactPersonsCustomersAndProspects}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No contact persons</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Contacts appear here once a customer or prospect has one. Try
            clearing the search or the filters.
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map((col) => {
                  const sortKey = SORTABLE[col.key];
                  if (sortKey) {
                    return (
                      <TableSortHeader key={col.key} sortKey={sortKey}>
                        {col.label}
                      </TableSortHeader>
                    );
                  }
                  return (
                    <TableHead
                      key={col.key}
                      className={
                        RIGHT_ALIGNED.has(col.key) ? "text-right" : undefined
                      }
                    >
                      {col.label}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.rows.map((row) => (
                <TableRow key={row.uuid}>
                  {visibleColumns.map((col) => renderCell(row, col.key))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination page={page} singular="contact" plural="contacts" />
        </>
      )}
    </div>
  );
};
