"use client";

import { type AddressListItem } from "@/app/(dashboard)/addresses/actions";
import { ColumnSelector } from "@/components/ui/column-selector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { useState } from "react";

const ALL_COLUMNS = [
  { key: "id",                       label: "Code",                    defaultVisible: true  },
  { key: "companyCode",              label: "Company Code",            defaultVisible: true  },
  { key: "companyName",              label: "Company Name",            defaultVisible: true  },
  { key: "altName",                  label: "Alt Name",                defaultVisible: true  },
  { key: "streetAndNo",              label: "Street & No",             defaultVisible: true  },
  { key: "postalCode",               label: "Postal Code",             defaultVisible: true  },
  { key: "city",                     label: "City",                    defaultVisible: true  },
  { key: "region",                   label: "Region",                  defaultVisible: true  },
  { key: "country",                  label: "Country",                 defaultVisible: true  },
  { key: "house",                    label: "House",                   defaultVisible: false },
  { key: "poBox",                    label: "PO Box",                  defaultVisible: false },
  { key: "gln",                      label: "GLN",                     defaultVisible: true  },
  { key: "peppolId",                 label: "Peppol ID",               defaultVisible: true  },
  { key: "telephone",                label: "Telephone",               defaultVisible: false },
  { key: "fax",                      label: "Fax",                     defaultVisible: false },
  { key: "email",                    label: "Email",                   defaultVisible: false },
  { key: "website",                  label: "Website",                 defaultVisible: false },
  { key: "billingAttention",         label: "Billing Attention",       defaultVisible: false },
  { key: "billingAttentionAdditional", label: "Billing Attention 2",   defaultVisible: false },
  { key: "sequenceNumber",           label: "Sequence No.",            defaultVisible: false },
  { key: "category",                 label: "Category",                defaultVisible: true  },
  { key: "addressComplete",          label: "Address Complete",        defaultVisible: true  },
  { key: "needCrane",                label: "Need Crane",              defaultVisible: false },
  { key: "canopyRequired",           label: "Canopy Required",         defaultVisible: false },
  { key: "bundleSeparately",         label: "Bundle Separately",       defaultVisible: false },
  { key: "specialTransport",         label: "Special Transport",       defaultVisible: false },
  { key: "availableAt",              label: "Available At",            defaultVisible: false },
  { key: "unloadingStartTime",       label: "Unloading Start",         defaultVisible: false },
  { key: "unloadingEndTime",         label: "Unloading End",           defaultVisible: false },
  { key: "maxLength",                label: "Max Length (mm)",         defaultVisible: false },
  { key: "maxBundleWeight",          label: "Max Bundle Weight (kg)",  defaultVisible: false },
  { key: "loadingInstructions",      label: "Loading Instructions",    defaultVisible: false },
  { key: "createdAt",                label: "Created At",              defaultVisible: false },
  { key: "updatedAt",                label: "Updated At",              defaultVisible: false },
] as const;

type ColumnKey = (typeof ALL_COLUMNS)[number]["key"];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, column) => ({ ...acc, [column.key]: column.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type AddressesTableContentProps = {
  addresses: AddressListItem[];
};

const formatLabel = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const BoolCell = ({ value }: { value: boolean | null }) => (
  <span className={`rounded-full px-2 py-0.5 text-xs ${value ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
    {value ? "Yes" : "No"}
  </span>
);

export const AddressesTableContent = ({
  addresses,
}: AddressesTableContentProps) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) => {
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key as ColumnKey] }));
  };

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (item: AddressListItem, key: ColumnKey) => {
    const addr = item.CompanyAddresses;
    const company = item.Companies;

    switch (key) {
      case "id":
        return <TableCell key={key} className="font-medium">{addr.id}</TableCell>;
      case "companyCode":
        return <TableCell key={key}>{company?.id ?? "-"}</TableCell>;
      case "companyName":
        return <TableCell key={key}>{company?.companyName ?? "-"}</TableCell>;
      case "altName":
        return <TableCell key={key}>{addr.altName || "-"}</TableCell>;
      case "streetAndNo":
        return <TableCell key={key}>{addr.streetAndNo || "-"}</TableCell>;
      case "postalCode":
        return <TableCell key={key}>{addr.postalCode || "-"}</TableCell>;
      case "city":
        return <TableCell key={key}>{addr.city || "-"}</TableCell>;
      case "region":
        return <TableCell key={key}>{addr.region || "-"}</TableCell>;
      case "country":
        return <TableCell key={key}>{addr.country || "-"}</TableCell>;
      case "house":
        return <TableCell key={key}>{addr.house || "-"}</TableCell>;
      case "poBox":
        return <TableCell key={key}><BoolCell value={addr.poBox ?? false} /></TableCell>;
      case "gln":
        return <TableCell key={key}>{addr.gln || "-"}</TableCell>;
      case "peppolId":
        return <TableCell key={key}>{addr.peppolId || "-"}</TableCell>;
      case "telephone":
        return <TableCell key={key}>{addr.telephone || "-"}</TableCell>;
      case "fax":
        return <TableCell key={key}>{addr.fax || "-"}</TableCell>;
      case "email":
        return <TableCell key={key}>{addr.email || "-"}</TableCell>;
      case "website":
        return <TableCell key={key}>{addr.website || "-"}</TableCell>;
      case "billingAttention":
        return <TableCell key={key}>{addr.billingAttention || "-"}</TableCell>;
      case "billingAttentionAdditional":
        return <TableCell key={key}>{addr.billingAttentionAdditional || "-"}</TableCell>;
      case "sequenceNumber":
        return <TableCell key={key}>{addr.sequenceNumber ?? "-"}</TableCell>;
      case "category":
        return (
          <TableCell key={key}>
            <div className="flex flex-wrap gap-1">
              {addr.category.length > 0 ? (
                addr.category.map((cat) => (
                  <span key={cat} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                    {formatLabel(cat)}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          </TableCell>
        );
      case "addressComplete":
        return <TableCell key={key}><BoolCell value={addr.addressComplete ?? false} /></TableCell>;
      case "needCrane":
        return <TableCell key={key}><BoolCell value={addr.needCrane ?? false} /></TableCell>;
      case "canopyRequired":
        return <TableCell key={key}><BoolCell value={addr.canopyRequired ?? false} /></TableCell>;
      case "bundleSeparately":
        return <TableCell key={key}><BoolCell value={addr.bundleSeparately ?? false} /></TableCell>;
      case "specialTransport":
        return <TableCell key={key}><BoolCell value={addr.specialTransport ?? false} /></TableCell>;
      case "availableAt":
        return <TableCell key={key}>{addr.availableAt ? formatLabel(addr.availableAt) : "-"}</TableCell>;
      case "unloadingStartTime":
        return <TableCell key={key}>{addr.unloadingStartTime || "-"}</TableCell>;
      case "unloadingEndTime":
        return <TableCell key={key}>{addr.unloadingEndTime || "-"}</TableCell>;
      case "maxLength":
        return <TableCell key={key}>{addr.maxLength ?? "-"}</TableCell>;
      case "maxBundleWeight":
        return <TableCell key={key}>{addr.maxBundleWeight ?? "-"}</TableCell>;
      case "loadingInstructions":
        return (
          <TableCell key={key} className="max-w-48 truncate">
            {addr.loadingInstructions || "-"}
          </TableCell>
        );
      case "createdAt":
        return <TableCell key={key}>{new Date(addr.createdAt).toLocaleDateString()}</TableCell>;
      case "updatedAt":
        return <TableCell key={key}>{new Date(addr.updatedAt).toLocaleDateString()}</TableCell>;
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
              {visibleColumns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {addresses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                  No addresses found
                </TableCell>
              </TableRow>
            ) : (
              addresses.map((item) => (
                <TableRow key={item.CompanyAddresses.id}>
                  {visibleColumns.map((column) => renderCell(item, column.key))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
