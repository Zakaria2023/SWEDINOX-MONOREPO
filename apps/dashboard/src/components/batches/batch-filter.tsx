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
};

// Receipt date range, supplier code and product code — the filters the legacy
// batch-registration overviews offer. Blank means all.
export const BatchFilter = ({
  receiptFrom,
  receiptUntil,
  companyCode,
  productCode,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [from, setFrom] = useState(receiptFrom ?? "");
  const [until, setUntil] = useState(receiptUntil ?? "");
  const [company, setCompany] = useState(companyCode ?? "");
  const [product, setProduct] = useState(productCode ?? "");

  const apply = () => {
    const params = new URLSearchParams();
    const entries: Array<[string, string]> = [
      ["receiptFrom", from],
      ["receiptUntil", until],
      ["companyCode", company],
      ["productCode", product],
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
    router.push(pathname);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-44">
        <FormLabel htmlFor="filter-receipt-from">Receipt date from</FormLabel>
        <Input
          id="filter-receipt-from"
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
      </div>
      <div className="w-44">
        <FormLabel htmlFor="filter-receipt-until">Receipt date to</FormLabel>
        <Input
          id="filter-receipt-until"
          type="date"
          value={until}
          onChange={(event) => setUntil(event.target.value)}
        />
      </div>
      <div className="w-36">
        <FormLabel htmlFor="filter-batch-company">Supplier code</FormLabel>
        <Input
          id="filter-batch-company"
          type="number"
          inputMode="numeric"
          placeholder="All"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />
      </div>
      <div className="w-44">
        <FormLabel htmlFor="filter-batch-product">Product code</FormLabel>
        <Input
          id="filter-batch-product"
          placeholder="All"
          value={product}
          onChange={(event) => setProduct(event.target.value)}
        />
      </div>
      <Button type="button" onClick={apply}>
        Apply
      </Button>
      <Button type="button" variant="outline" onClick={clear}>
        Clear
      </Button>
    </div>
  );
};
