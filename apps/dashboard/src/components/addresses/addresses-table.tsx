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
  deleteAddress,
  getAddresses,
  type AddressListItem,
} from "@/app/(dashboard)/addresses/actions";

const ALL_COLUMNS = [
  { key: "id", label: "Code", defaultVisible: true },
  { key: "companyName", label: "Company", defaultVisible: true },
  { key: "altName", label: "Alt Name", defaultVisible: true },
  { key: "poBox", label: "PO Box", defaultVisible: false },
  { key: "streetAndNo", label: "Street & No", defaultVisible: true },
  { key: "postalCode", label: "Postal Code", defaultVisible: false },
  { key: "city", label: "City", defaultVisible: true },
  { key: "region", label: "Region", defaultVisible: false },
  { key: "country", label: "Country", defaultVisible: true },
  { key: "house", label: "House", defaultVisible: false },
  { key: "telephone", label: "Telephone", defaultVisible: false },
  { key: "fax", label: "Fax", defaultVisible: false },
  { key: "email", label: "Email", defaultVisible: false },
  { key: "website", label: "Website", defaultVisible: false },
  { key: "sequenceNumber", label: "Seq. No", defaultVisible: false },
  { key: "category", label: "Category", defaultVisible: true },
  { key: "needCrane", label: "Need Crane", defaultVisible: false },
  { key: "canopyRequired", label: "Canopy Required", defaultVisible: false },
  { key: "bundleSeparately", label: "Bundle Separately", defaultVisible: false },
  { key: "addressComplete", label: "Status", defaultVisible: true },
  { key: "specialTransport", label: "Special Transport", defaultVisible: false },
  { key: "availableAt", label: "Available At", defaultVisible: false },
  { key: "unloadingStartTime", label: "Unloading Start", defaultVisible: false },
  { key: "unloadingEndTime", label: "Unloading End", defaultVisible: false },
  { key: "maxLength", label: "Max Length", defaultVisible: false },
  { key: "maxBundleWeight", label: "Max Bundle Weight", defaultVisible: false },
  { key: "loadingInstructions", label: "Loading Instructions", defaultVisible: false },
  { key: "createdAt", label: "Created At", defaultVisible: false },
  { key: "updatedAt", label: "Updated At", defaultVisible: false },
] as const;

type ColumnKey = (typeof ALL_COLUMNS)[number]["key"];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, col) => ({ ...acc, [col.key]: col.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

const BoolCell = ({ value }: { value: boolean | null }) =>
  value === null ? (
    <span className="text-muted-foreground">-</span>
  ) : (
    <span
      className={`rounded-full px-2 py-1 text-xs ${
        value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {value ? "Yes" : "No"}
    </span>
  );

export const AddressesTable = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<AddressListItem | null>(
    null,
  );
  const [isDeletePending, setIsDeletePending] = useState(false);
  const [actionError, setActionError] = useState("");
  const columnsRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        columnsRef.current &&
        !columnsRef.current.contains(e.target as Node)
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

  const { data, isLoading, isError } = useQuery({
    queryKey: ["addresses", page, search],
    queryFn: () => getAddresses(page, pageSize, search),
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;
  const errorMessage =
    actionError ||
    data?.error ||
    (isError ? "Failed to load addresses. Please try again." : "");

  const handleDeleteAddress = async () => {
    if (!addressToDelete) {
      return;
    }

    setIsDeletePending(true);
    setActionError("");

    try {
      const result = await deleteAddress(addressToDelete.id);

      if (!result.success) {
        setActionError(result.error ?? "Failed to delete address.");
        return;
      }

      setAddressToDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
    } finally {
      setIsDeletePending(false);
    }
  };

  const renderCell = (address: AddressListItem, key: ColumnKey) => {
    switch (key) {
      case "id":
        return (
          <TableCell key={key} className="font-medium">
            {address.id}
          </TableCell>
        );
      case "companyName":
        return <TableCell key={key}>{address.companyName || "-"}</TableCell>;
      case "altName":
        return <TableCell key={key}>{address.altName || "-"}</TableCell>;
      case "poBox":
        return (
          <TableCell key={key}>
            <BoolCell value={address.poBox} />
          </TableCell>
        );
      case "streetAndNo":
        return <TableCell key={key}>{address.streetAndNo || "-"}</TableCell>;
      case "postalCode":
        return <TableCell key={key}>{address.postalCode || "-"}</TableCell>;
      case "city":
        return <TableCell key={key}>{address.city || "-"}</TableCell>;
      case "region":
        return <TableCell key={key}>{address.region || "-"}</TableCell>;
      case "country":
        return <TableCell key={key}>{address.country || "-"}</TableCell>;
      case "house":
        return <TableCell key={key}>{address.house || "-"}</TableCell>;
      case "telephone":
        return <TableCell key={key}>{address.telephone || "-"}</TableCell>;
      case "fax":
        return <TableCell key={key}>{address.fax || "-"}</TableCell>;
      case "email":
        return <TableCell key={key}>{address.email || "-"}</TableCell>;
      case "website":
        return <TableCell key={key}>{address.website || "-"}</TableCell>;
      case "sequenceNumber":
        return <TableCell key={key}>{address.sequenceNumber ?? "-"}</TableCell>;
      case "category":
        return (
          <TableCell key={key}>
            <div className="flex flex-wrap gap-1">
              {address.category.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700"
                >
                  {cat}
                </span>
              ))}
            </div>
          </TableCell>
        );
      case "needCrane":
        return (
          <TableCell key={key}>
            <BoolCell value={address.needCrane} />
          </TableCell>
        );
      case "canopyRequired":
        return (
          <TableCell key={key}>
            <BoolCell value={address.canopyRequired} />
          </TableCell>
        );
      case "bundleSeparately":
        return (
          <TableCell key={key}>
            <BoolCell value={address.bundleSeparately} />
          </TableCell>
        );
      case "addressComplete":
        return (
          <TableCell key={key}>
            <span
              className={`rounded-full px-2 py-1 text-xs ${
                address.addressComplete
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {address.addressComplete ? "Complete" : "Incomplete"}
            </span>
          </TableCell>
        );
      case "specialTransport":
        return (
          <TableCell key={key}>
            <BoolCell value={address.specialTransport} />
          </TableCell>
        );
      case "availableAt":
        return <TableCell key={key}>{address.availableAt || "-"}</TableCell>;
      case "unloadingStartTime":
        return (
          <TableCell key={key}>{address.unloadingStartTime || "-"}</TableCell>
        );
      case "unloadingEndTime":
        return (
          <TableCell key={key}>{address.unloadingEndTime || "-"}</TableCell>
        );
      case "maxLength":
        return <TableCell key={key}>{address.maxLength || "-"}</TableCell>;
      case "maxBundleWeight":
        return (
          <TableCell key={key}>{address.maxBundleWeight || "-"}</TableCell>
        );
      case "loadingInstructions":
        return (
          <TableCell key={key} className="max-w-48 truncate">
            {address.loadingInstructions || "-"}
          </TableCell>
        );
      case "createdAt":
        return (
          <TableCell key={key}>{address.createdAt.toLocaleDateString()}</TableCell>
        );
      case "updatedAt":
        return (
          <TableCell key={key}>{address.updatedAt.toLocaleDateString()}</TableCell>
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
            placeholder="Search addresses or companies..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-sm"
          />

          <div ref={columnsRef} className="relative ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setColumnsOpen((o) => !o)}
            >
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>

            {columnsOpen && (
              <div className="absolute right-0 z-10 mt-1 max-h-80 min-w-40 overflow-y-auto rounded-md border bg-white p-2 shadow-md">
                {ALL_COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={columnVisibility[col.key]}
                      onChange={() => toggleColumn(col.key)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    {col.label}
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
                {visibleColumns.map((col) => (
                  <TableHead key={col.key}>{col.label}</TableHead>
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
                    No addresses found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((address) => (
                  <TableRow key={address.id}>
                    {visibleColumns.map((col) => renderCell(address, col.key))}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            router.push(`/addresses/${address.id}/edit`)
                          }
                        >
                          <Pencil />
                          <span className="sr-only">Edit address</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setAddressToDelete(address)}
                        >
                          <Trash2 className="text-destructive" />
                          <span className="sr-only">Delete address</span>
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
            Showing {data?.data.length || 0} of {data?.total || 0} addresses
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true;
                  if (p === 1 || p === totalPages) return true;
                  if (p >= page - 1 && p <= page + 1) return true;
                  return false;
                })
                .map((p, i, arr) => {
                  const prev = arr[i - 1];
                  const showDots = prev && p - prev > 1;

                  return (
                    <div key={p} className="flex items-center gap-1">
                      {showDots && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        onClick={() => setPage(p)}
                        variant={page === p ? "default" : "outline"}
                        size="sm"
                        className="min-w-10"
                      >
                        {p}
                      </Button>
                    </div>
                  );
                })}
            </div>

            <Button
              onClick={() =>
                setPage((p) => Math.min(Math.max(totalPages, 1), p + 1))
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
        open={Boolean(addressToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setAddressToDelete(null);
          }
        }}
        title="Delete Address"
        description={
          addressToDelete
            ? `Delete address "${addressToDelete.altName || addressToDelete.streetAndNo || `#${addressToDelete.id}`}"? This cannot be undone.`
            : ""
        }
        onConfirm={handleDeleteAddress}
        isPending={isDeletePending}
      />
    </>
  );
};
