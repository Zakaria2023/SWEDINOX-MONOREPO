"use client";

import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  receiptFrom?: string;
  receiptUntil?: string;
  companyCode?: string;
  productCode?: string;
  outstandingOnly?: boolean;
};

// Receipt date range, supplier and product code, plus a switch to show only the
// certificates still to be linked.
export const CertificateFilter = ({
  receiptFrom,
  receiptUntil,
  companyCode,
  productCode,
  outstandingOnly,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [from, setFrom] = useState(receiptFrom ?? "");
  const [until, setUntil] = useState(receiptUntil ?? "");
  const [company, setCompany] = useState(companyCode ?? "");
  const [product, setProduct] = useState(productCode ?? "");
  const [outstanding, setOutstanding] = useState(outstandingOnly ?? false);

  const apply = () => {
    const params = new URLSearchParams();
    const entries: Array<[string, string]> = [
      ["receiptFrom", from],
      ["receiptUntil", until],
      ["companyCode", company],
      ["productCode", product],
      ["outstandingOnly", outstanding ? "1" : ""],
    ];
    for (const [key, value] of entries) {
      if (value) {
        params.set(key, value);
      }
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const clear = () => {
    setFrom("");
    setUntil("");
    setCompany("");
    setProduct("");
    setOutstanding(false);
    router.push(pathname);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-44">
        <FormLabel htmlFor="filter-cert-from">Receipt date from</FormLabel>
        <Input
          id="filter-cert-from"
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
      </div>
      <div className="w-44">
        <FormLabel htmlFor="filter-cert-until">Receipt date to</FormLabel>
        <Input
          id="filter-cert-until"
          type="date"
          value={until}
          onChange={(event) => setUntil(event.target.value)}
        />
      </div>
      <div className="w-36">
        <FormLabel htmlFor="filter-cert-company">Supplier code</FormLabel>
        <Input
          id="filter-cert-company"
          type="number"
          inputMode="numeric"
          placeholder="All"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />
      </div>
      <div className="w-44">
        <FormLabel htmlFor="filter-cert-product">Product code</FormLabel>
        <Input
          id="filter-cert-product"
          placeholder="All"
          value={product}
          onChange={(event) => setProduct(event.target.value)}
        />
      </div>
      <label className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 transition-colors hover:bg-muted/40">
        <input
          type="checkbox"
          className="size-4 rounded border-border accent-primary"
          checked={outstanding}
          onChange={(event) => setOutstanding(event.target.checked)}
        />
        <span className="text-sm font-medium">To be linked only</span>
      </label>
      <Button type="button" onClick={apply}>
        Apply
      </Button>
      <Button type="button" variant="outline" onClick={clear}>
        Clear
      </Button>
    </div>
  );
};
