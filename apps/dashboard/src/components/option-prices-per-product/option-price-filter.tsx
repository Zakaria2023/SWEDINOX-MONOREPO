"use client";

import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  codeFrom?: string;
  codeTo?: string;
};

// Product code range — the only filter the legacy "Option prices per product"
// overview offers. Blank means unbounded.
export const OptionPriceFilter = ({ codeFrom, codeTo }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [from, setFrom] = useState(codeFrom ?? "");
  const [to, setTo] = useState(codeTo ?? "");

  const apply = () => {
    const params = new URLSearchParams();
    if (from) {
      params.set("codeFrom", from);
    }
    if (to) {
      params.set("codeTo", to);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const clear = () => {
    setFrom("");
    setTo("");
    router.push(pathname);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-44">
        <FormLabel htmlFor="filter-option-code-from">
          Product code from
        </FormLabel>
        <Input
          id="filter-option-code-from"
          placeholder="All"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
      </div>
      <div className="w-44">
        <FormLabel htmlFor="filter-option-code-to">Product code to</FormLabel>
        <Input
          id="filter-option-code-to"
          placeholder="All"
          value={to}
          onChange={(event) => setTo(event.target.value)}
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
