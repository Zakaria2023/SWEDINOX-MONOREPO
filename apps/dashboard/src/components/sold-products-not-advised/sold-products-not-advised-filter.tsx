"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";

type Props = {
  productCode?: string;
  from?: string;
  to?: string;
};

// Product-code prefix plus an invoice-date range — the sales window the gap
// report is computed over.
export const SoldProductsNotAdvisedFilter = ({
  productCode,
  from,
  to,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [codeValue, setCodeValue] = useState(productCode ?? "");
  const [fromValue, setFromValue] = useState(from ?? "");
  const [toValue, setToValue] = useState(to ?? "");

  const apply = () => {
    const params = new URLSearchParams();
    if (codeValue) {
      params.set("productCode", codeValue);
    }
    if (fromValue) {
      params.set("from", fromValue);
    }
    if (toValue) {
      params.set("to", toValue);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const clear = () => {
    setCodeValue("");
    setFromValue("");
    setToValue("");
    router.push(pathname);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-56">
        <FormLabel htmlFor="filter-product-code">Product code</FormLabel>
        <Input
          id="filter-product-code"
          placeholder="All"
          value={codeValue}
          onChange={(e) => setCodeValue(e.target.value)}
        />
      </div>
      <div className="w-40">
        <FormLabel htmlFor="filter-from">Invoice date from</FormLabel>
        <Input
          id="filter-from"
          type="date"
          value={fromValue}
          onChange={(e) => setFromValue(e.target.value)}
        />
      </div>
      <div className="w-40">
        <FormLabel htmlFor="filter-to">Invoice date to</FormLabel>
        <Input
          id="filter-to"
          type="date"
          value={toValue}
          onChange={(e) => setToValue(e.target.value)}
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
