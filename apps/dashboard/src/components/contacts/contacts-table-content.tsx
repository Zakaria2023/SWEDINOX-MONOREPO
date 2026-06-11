"use client";

import { type ContactListItem } from "@/app/(dashboard)/contacts/actions";
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

const CONTACT_TYPE_LABELS: Record<string, string> = {
  gross_prices: "Gross prices",
  options: "Options",
  net_prices: "Net prices",
  cost_price: "Cost price",
  surcharges: "Surcharges",
  toeslagen: "Toeslagen",
};

const ALL_COLUMNS = [
  { key: "id",               label: "Code",            defaultVisible: true  },
  { key: "contactType",      label: "Contact Type",    defaultVisible: true  },
  { key: "contactGroupName", label: "Contact Group",   defaultVisible: true  },
  { key: "description",      label: "Description",     defaultVisible: true  },
  { key: "searchCode1",      label: "Search Code 1",   defaultVisible: false },
  { key: "searchCode2",      label: "Search Code 2",   defaultVisible: false },
  { key: "searchCode3",      label: "Search Code 3",   defaultVisible: false },
  { key: "websiteSorting",   label: "Website Sort",    defaultVisible: false },
  { key: "hideOnWebsite",    label: "Hide on Website", defaultVisible: false },
  { key: "createdAt",        label: "Created At",      defaultVisible: false },
] as const;

type ColumnKey = (typeof ALL_COLUMNS)[number]["key"];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, col) => ({ ...acc, [col.key]: col.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type ContactsTableContentProps = {
  contacts: ContactListItem[];
};

export const ContactsTableContent = ({ contacts }: ContactsTableContentProps) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key as ColumnKey] }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (contact: ContactListItem, key: ColumnKey) => {
    switch (key) {
      case "id":
        return <TableCell key={key} className="font-medium">{contact.id}</TableCell>;
      case "contactType":
        return (
          <TableCell key={key}>
            {contact.contactType ? CONTACT_TYPE_LABELS[contact.contactType] : "—"}
          </TableCell>
        );
      case "contactGroupName":
        return <TableCell key={key}>{contact.contactGroupName ?? "—"}</TableCell>;
      case "description":
        return <TableCell key={key}>{contact.description}</TableCell>;
      case "searchCode1":
        return <TableCell key={key}>{contact.searchCode1 ?? "—"}</TableCell>;
      case "searchCode2":
        return <TableCell key={key}>{contact.searchCode2 ?? "—"}</TableCell>;
      case "searchCode3":
        return <TableCell key={key}>{contact.searchCode3 ?? "—"}</TableCell>;
      case "websiteSorting":
        return <TableCell key={key}>{contact.websiteSorting ?? "—"}</TableCell>;
      case "hideOnWebsite":
        return (
          <TableCell key={key}>
            {contact.hideOnWebsite ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Yes</span>
            ) : (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">No</span>
            )}
          </TableCell>
        );
      case "createdAt":
        return <TableCell key={key}>{new Date(contact.createdAt).toLocaleDateString()}</TableCell>;
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
              {visibleColumns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                  No contacts found
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  {visibleColumns.map((col) => renderCell(contact, col.key))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
