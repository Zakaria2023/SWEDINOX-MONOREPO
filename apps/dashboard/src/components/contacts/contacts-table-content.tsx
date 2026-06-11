"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { type ContactListItem } from "@/app/(dashboard)/contacts/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";

type ColumnKey =
  | "id"
  | "contactType"
  | "contactGroupName"
  | "description"
  | "searchCode1"
  | "searchCode2"
  | "searchCode3"
  | "websiteSorting"
  | "hideOnWebsite"
  | "createdAt";

const ALL_COLUMNS: Array<{
  defaultVisible: boolean;
  key: ColumnKey;
  labelKey: string;
}> = [
  { key: "id", labelKey: "contacts-table-content.columns.id", defaultVisible: true },
  { key: "contactType", labelKey: "contacts-table-content.columns.contact-type", defaultVisible: true },
  { key: "contactGroupName", labelKey: "contacts-table-content.columns.contact-group-name", defaultVisible: true },
  { key: "description", labelKey: "contacts-table-content.columns.description", defaultVisible: true },
  { key: "searchCode1", labelKey: "contacts-table-content.columns.search-code-1", defaultVisible: false },
  { key: "searchCode2", labelKey: "contacts-table-content.columns.search-code-2", defaultVisible: false },
  { key: "searchCode3", labelKey: "contacts-table-content.columns.search-code-3", defaultVisible: false },
  { key: "websiteSorting", labelKey: "contacts-table-content.columns.website-sorting", defaultVisible: false },
  { key: "hideOnWebsite", labelKey: "contacts-table-content.columns.hide-on-website", defaultVisible: false },
  { key: "createdAt", labelKey: "contacts-table-content.columns.created-at", defaultVisible: false },
];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, column) => ({ ...acc, [column.key]: column.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type ContactsTableContentProps = {
  contacts: ContactListItem[];
};

export const ContactsTableContent = ({ contacts }: ContactsTableContentProps) => {
  const { t } = useTranslation();
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key as ColumnKey] }));

  const visibleColumns = ALL_COLUMNS.filter((column) => columnVisibility[column.key]);
  const fallbackValue = t("common.not-available");

  const renderCell = (contact: ContactListItem, key: ColumnKey) => {
    switch (key) {
      case "id":
        return <TableCell key={key} className="font-medium">{contact.id}</TableCell>;
      case "contactType":
        return (
          <TableCell key={key}>
            {contact.contactType
              ? t(`contact-form.contact-types.${contact.contactType}`)
              : fallbackValue}
          </TableCell>
        );
      case "contactGroupName":
        return <TableCell key={key}>{contact.contactGroupName ?? fallbackValue}</TableCell>;
      case "description":
        return <TableCell key={key}>{contact.description}</TableCell>;
      case "searchCode1":
        return <TableCell key={key}>{contact.searchCode1 ?? fallbackValue}</TableCell>;
      case "searchCode2":
        return <TableCell key={key}>{contact.searchCode2 ?? fallbackValue}</TableCell>;
      case "searchCode3":
        return <TableCell key={key}>{contact.searchCode3 ?? fallbackValue}</TableCell>;
      case "websiteSorting":
        return <TableCell key={key}>{contact.websiteSorting ?? fallbackValue}</TableCell>;
      case "hideOnWebsite":
        return (
          <TableCell key={key}>
            {contact.hideOnWebsite ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {t("common.yes")}
              </span>
            ) : (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                {t("common.no")}
              </span>
            )}
          </TableCell>
        );
      case "createdAt":
        return (
          <TableCell key={key}>
            {new Date(contact.createdAt).toLocaleDateString()}
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
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                  {t("contacts-table-content.empty")}
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  {visibleColumns.map((column) => renderCell(contact, column.key))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
