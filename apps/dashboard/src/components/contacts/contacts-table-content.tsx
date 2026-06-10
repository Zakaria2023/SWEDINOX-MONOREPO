"use client";

import { type SelectContacts } from "@/db";
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
  { key: "id",        label: "Code",       defaultVisible: true  },
  { key: "fullName",  label: "Full Name",  defaultVisible: true  },
  { key: "salutation",label: "Salutation", defaultVisible: true  },
  { key: "email",     label: "Email",      defaultVisible: true  },
  { key: "telephone", label: "Telephone",  defaultVisible: true  },
  { key: "mobile",    label: "Mobile",     defaultVisible: false },
  { key: "city",      label: "City",       defaultVisible: true  },
  { key: "country",   label: "Country",    defaultVisible: false },
  { key: "isActive",  label: "Active",     defaultVisible: true  },
  { key: "createdAt", label: "Created At", defaultVisible: false },
  { key: "updatedAt", label: "Updated At", defaultVisible: false },
] as const;

type ColumnKey = (typeof ALL_COLUMNS)[number]["key"];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, col) => ({ ...acc, [col.key]: col.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type ContactsTableContentProps = {
  contacts: SelectContacts[];
};

const activeBadge = (value: boolean | null) =>
  value ? (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      Yes
    </span>
  ) : (
    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
      No
    </span>
  );

export const ContactsTableContent = ({ contacts }: ContactsTableContentProps) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key as ColumnKey] }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (contact: SelectContacts, key: ColumnKey) => {
    switch (key) {
      case "id":
        return <TableCell key={key} className="font-medium">{contact.id}</TableCell>;
      case "fullName":
        return <TableCell key={key}>{contact.fullName}</TableCell>;
      case "salutation":
        return (
          <TableCell key={key} className="capitalize">
            {contact.salutation ?? "—"}
          </TableCell>
        );
      case "email":
        return <TableCell key={key}>{contact.email ?? "—"}</TableCell>;
      case "telephone":
        return <TableCell key={key}>{contact.telephone ?? "—"}</TableCell>;
      case "mobile":
        return <TableCell key={key}>{contact.mobile ?? "—"}</TableCell>;
      case "city":
        return <TableCell key={key}>{contact.city ?? "—"}</TableCell>;
      case "country":
        return <TableCell key={key}>{contact.country ?? "—"}</TableCell>;
      case "isActive":
        return <TableCell key={key}>{activeBadge(contact.isActive)}</TableCell>;
      case "createdAt":
        return <TableCell key={key}>{new Date(contact.createdAt).toLocaleDateString()}</TableCell>;
      case "updatedAt":
        return <TableCell key={key}>{new Date(contact.updatedAt).toLocaleDateString()}</TableCell>;
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
