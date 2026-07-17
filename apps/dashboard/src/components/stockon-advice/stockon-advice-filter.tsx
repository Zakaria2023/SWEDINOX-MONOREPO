"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";

type Props = {
  productCode?: string;
  onlyAdvised?: boolean;
};

// Product-code prefix filter plus a toggle to show only products the engine
// says to order today.
export const StockOnAdviceFilter = ({ productCode, onlyAdvised }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [codeValue, setCodeValue] = useState(productCode ?? "");
  const [advisedOnly, setAdvisedOnly] = useState(Boolean(onlyAdvised));

  const apply = () => {
    const params = new URLSearchParams();
    if (codeValue) {
      params.set("productCode", codeValue);
    }
    if (advisedOnly) {
      params.set("onlyAdvised", "1");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const clear = () => {
    setCodeValue("");
    setAdvisedOnly(false);
    router.push(pathname);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-64">
        <FormLabel htmlFor="filter-product-code">Product code</FormLabel>
        <Input
          id="filter-product-code"
          placeholder="All"
          value={codeValue}
          onChange={(e) => setCodeValue(e.target.value)}
        />
      </div>
      <label className="flex h-9 items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          className="size-4"
          checked={advisedOnly}
          onChange={(e) => setAdvisedOnly(e.target.checked)}
        />
        Only “order now”
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
