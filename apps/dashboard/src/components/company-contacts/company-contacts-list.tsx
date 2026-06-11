"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { type CompanyContactWithCompany } from "@/app/(dashboard)/company-contacts/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";

type ColumnKey =
  | "id"
  | "companyName"
  | "fullName"
  | "salutation"
  | "telephone"
  | "mobile"
  | "fax"
  | "email"
  | "city"
  | "country"
  | "categoryAddition"
  | "isActive"
  | "createdAt";

const ALL_COLUMNS: Array<{
  defaultVisible: boolean;
  key: ColumnKey;
  labelKey: string;
}> = [
  { key: "id", labelKey: "company-contacts-list.columns.id", defaultVisible: true },
  { key: "companyName", labelKey: "company-contacts-list.columns.company-name", defaultVisible: true },
  { key: "fullName", labelKey: "company-contacts-list.columns.full-name", defaultVisible: true },
  { key: "salutation", labelKey: "company-contacts-list.columns.salutation", defaultVisible: false },
  { key: "telephone", labelKey: "company-contacts-list.columns.telephone", defaultVisible: true },
  { key: "mobile", labelKey: "company-contacts-list.columns.mobile", defaultVisible: true },
  { key: "fax", labelKey: "company-contacts-list.columns.fax", defaultVisible: false },
  { key: "email", labelKey: "company-contacts-list.columns.email", defaultVisible: true },
  { key: "city", labelKey: "company-contacts-list.columns.city", defaultVisible: false },
  { key: "country", labelKey: "company-contacts-list.columns.country", defaultVisible: false },
  { key: "categoryAddition", labelKey: "company-contacts-list.columns.category-addition", defaultVisible: false },
  { key: "isActive", labelKey: "company-contacts-list.columns.is-active", defaultVisible: true },
  { key: "createdAt", labelKey: "company-contacts-list.columns.created-at", defaultVisible: false },
];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, column) => ({ ...acc, [column.key]: column.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type Props = { contacts: CompanyContactWithCompany[] };

export const CompanyContactsList = ({ contacts }: Props) => {
  const { t } = useTranslation();
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key as ColumnKey] }));

  const visibleColumns = ALL_COLUMNS.filter((column) => columnVisibility[column.key]);
  const fallbackValue = t("common.not-available");

  const activeBadge = (value: boolean | null) =>
    value ? (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        {t("common.yes")}
      </span>
    ) : (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        {t("common.no")}
      </span>
    );

  const renderCell = (contact: CompanyContactWithCompany, key: ColumnKey) => {
    switch (key) {
      case "id":
        return <TableCell key={key} className="font-medium">{contact.id}</TableCell>;
      case "companyName":
        return (
          <TableCell key={key}>
            <a
              href={`/companies/${contact.companyUuid}/contacts`}
              className="text-primary hover:underline"
            >
              {contact.companyName || fallbackValue}
            </a>
          </TableCell>
        );
      case "fullName":
        return <TableCell key={key} className="font-medium">{contact.fullName}</TableCell>;
      case "salutation":
        return (
          <TableCell key={key}>
            {contact.salutation
              ? t(`contact-dialog.salutations.${contact.salutation}`)
              : fallbackValue}
          </TableCell>
        );
      case "telephone":
        return <TableCell key={key}>{contact.telephone ?? fallbackValue}</TableCell>;
      case "mobile":
        return <TableCell key={key}>{contact.mobile ?? fallbackValue}</TableCell>;
      case "fax":
        return <TableCell key={key}>{contact.fax ?? fallbackValue}</TableCell>;
      case "email":
        return <TableCell key={key}>{contact.email ?? fallbackValue}</TableCell>;
      case "city":
        return <TableCell key={key}>{contact.city ?? fallbackValue}</TableCell>;
      case "country":
        return <TableCell key={key}>{contact.country ?? fallbackValue}</TableCell>;
      case "categoryAddition":
        return <TableCell key={key}>{contact.categoryAddition ?? fallbackValue}</TableCell>;
      case "isActive":
        return <TableCell key={key}>{activeBadge(contact.isActive)}</TableCell>;
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
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t("company-contacts-list.empty")}
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
