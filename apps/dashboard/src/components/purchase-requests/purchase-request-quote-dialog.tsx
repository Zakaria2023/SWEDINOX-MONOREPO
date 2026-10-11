"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import {
  convertPurchaseRequestToQuotes,
  PurchaseRequestDetail,
} from "@/app/(dashboard)/purchase-requests/actions";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { FormError } from "@/components/ui/form-error";

type Props = {
  request: PurchaseRequestDetail;
  companies: CompanyOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * `Purchase quote` on a saved request: the suppliers to ask. Each one gets its
 * own copy of the request's saved lines with no prices on it, and their
 * answers come back as quotes read side by side under the lines. A supplier
 * already asked is ticked and greyed — it is not asked twice.
 */
export const PurchaseRequestQuoteDialog = ({
  request,
  companies,
  open,
  onOpenChange,
}: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  const alreadyAsked = new Set(request.quotes.map((quote) => quote.supplierUuid));
  // The request's own supplier is the first one asked, as on a purchase order.
  const ownSupplier =
    request.companyType !== "agent" &&
    request.companyUuid &&
    !alreadyAsked.has(request.companyUuid)
      ? [request.companyUuid]
      : [];
  const [selected, setSelected] = useState<string[]>(ownSupplier);

  const term = search.trim().toLowerCase();
  const suppliers = companies
    .filter((company) => company.roles?.includes("supplier"))
    .filter(
      (company) =>
        term === "" ||
        [company.searchCode1, company.companyName].some((value) =>
          value?.toLowerCase().includes(term),
        ),
    );

  const toggle = (uuid: string) =>
    setSelected((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid],
    );

  const requestQuotes = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await convertPurchaseRequestToQuotes(
        request.uuid,
        selected,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setSelected([]);
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Purchase quote</DialogTitle>
          <DialogDescription>
            Each supplier gets its own copy of the saved lines, with no prices
            on it.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <Input
            placeholder="Search supplier"
            aria-label="Search supplier"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="grid max-h-96 gap-2 overflow-y-auto sm:grid-cols-2">
            {suppliers.map((supplier) => {
              const asked = alreadyAsked.has(supplier.uuid);
              return (
                <label
                  key={supplier.uuid}
                  className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm"
                >
                  <Checkbox
                    checked={asked || selected.includes(supplier.uuid)}
                    onChange={() => toggle(supplier.uuid)}
                    disabled={isPending || asked}
                  />
                  <span>
                    {[supplier.searchCode1, supplier.companyName]
                      .filter(Boolean)
                      .join(" — ") || supplier.uuid}
                  </span>
                </label>
              );
            })}
            {suppliers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No supplier matches.
              </p>
            )}
          </div>
          <FormError>{error}</FormError>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={requestQuotes}
            disabled={isPending || selected.length === 0}
          >
            <Send className="me-1.5 size-4" />
            {isPending
              ? "Creating quotes…"
              : `Request ${selected.length || ""} quote${selected.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
