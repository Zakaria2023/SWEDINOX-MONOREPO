"use client";

import Link from "next/link";
import {
  ContactPersonSupplierRow,
  exportContactPersonsSuppliers,
} from "@/app/(dashboard)/contact-persons-suppliers/actions";
import {
  CONTACT_PERSON_SUPPLIER_COLUMNS,
  ContactPersonSupplierColumnKey,
} from "@/app/(dashboard)/contact-persons-suppliers/columns";
import { OverviewTable } from "@/components/ui/overview-table";
import { orDash } from "@/lib/helpers";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<ContactPersonSupplierRow>;
  filters: TableFilterControl[];
};

const renderCell = (
  row: ContactPersonSupplierRow,
  key: ContactPersonSupplierColumnKey,
) => {
  if (key === "companyName" && row.companyUuid) {
    return (
      <Link
        href={`/companies/${row.companyUuid}`}
        className="font-medium text-primary hover:underline"
      >
        {orDash(row.companyName)}
      </Link>
    );
  }
  if (key === "firstName") {
    return (
      <Link
        href={`/contacts/${row.uuid}`}
        className="font-medium text-primary hover:underline"
      >
        {row.firstName ?? "View contact"}
      </Link>
    );
  }
  return undefined;
};

export const ContactPersonsSuppliersTable = ({ page, filters }: Props) => (
  <OverviewTable
    page={page}
    filters={filters}
    columns={CONTACT_PERSON_SUPPLIER_COLUMNS}
    rowKey={(row) => row.uuid}
    renderCell={renderCell}
    exportAction={exportContactPersonsSuppliers}
    fileName="contact-persons-suppliers"
    searchPlaceholder="Search name, e-mail or company…"
    emptyText="No supplier contacts."
    singular="contact"
    plural="contacts"
  />
);
