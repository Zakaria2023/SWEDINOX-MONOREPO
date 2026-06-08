"use client";

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
import { ErrorMessage } from "@/components/ui/error-message";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { AddressListItem } from "../actions";
import { getAddresses } from "../actions";

export const AddressesTable = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const pageSize = 10;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["addresses", page, search],
    queryFn: () => getAddresses(page, pageSize, search),
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;
  const errorMessage =
    data?.error ??
    (isError ? "Failed to load addresses. Please try again." : "");

  if (errorMessage) {
    return <ErrorMessage message={errorMessage} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          type="text"
          placeholder="Search addresses..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Alt Name</TableHead>
              <TableHead>Street</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No addresses found
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((address: AddressListItem) => (
                <TableRow key={address.id}>
                  <TableCell className="font-medium">{address.id}</TableCell>
                  <TableCell>{address.altName || "-"}</TableCell>
                  <TableCell>{address.streetAndNo || "-"}</TableCell>
                  <TableCell>{address.city || "-"}</TableCell>
                  <TableCell>{address.country || "-"}</TableCell>
                  <TableCell>
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
                  <TableCell>
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
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
