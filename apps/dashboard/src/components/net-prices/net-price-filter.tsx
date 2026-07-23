"use client";

import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  contractCodeFrom?: string;
  contractCodeTo?: string;
  validFrom?: string;
  validUntil?: string;
  companyCode?: string;
};

// Contract code range, validity window and company — the same filters the
// legacy "Net prices" overview offers. Blank means unbounded.
export const NetPriceFilter = ({
  contractCodeFrom,
  contractCodeTo,
  validFrom,
  validUntil,
  companyCode,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [codeFrom, setCodeFrom] = useState(contractCodeFrom ?? "");
  const [codeTo, setCodeTo] = useState(contractCodeTo ?? "");
  const [from, setFrom] = useState(validFrom ?? "");
  const [until, setUntil] = useState(validUntil ?? "");
  const [company, setCompany] = useState(companyCode ?? "");

  const apply = () => {
    const params = new URLSearchParams();
    const entries: Array<[string, string]> = [
      ["contractCodeFrom", codeFrom],
      ["contractCodeTo", codeTo],
      ["validFrom", from],
      ["validUntil", until],
      ["companyCode", company],
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
    setCodeFrom("");
    setCodeTo("");
    setFrom("");
    setUntil("");
    setCompany("");
    router.push(pathname);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-40">
        <FormLabel htmlFor="filter-contract-from">Contract code from</FormLabel>
        <Input
          id="filter-contract-from"
          placeholder="All"
          value={codeFrom}
          onChange={(event) => setCodeFrom(event.target.value)}
        />
      </div>
      <div className="w-40">
        <FormLabel htmlFor="filter-contract-to">Contract code to</FormLabel>
        <Input
          id="filter-contract-to"
          placeholder="All"
          value={codeTo}
          onChange={(event) => setCodeTo(event.target.value)}
        />
      </div>
      <div className="w-44">
        <FormLabel htmlFor="filter-valid-from">Valid between (from)</FormLabel>
        <Input
          id="filter-valid-from"
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
      </div>
      <div className="w-44">
        <FormLabel htmlFor="filter-valid-until">Valid between (to)</FormLabel>
        <Input
          id="filter-valid-until"
          type="date"
          value={until}
          onChange={(event) => setUntil(event.target.value)}
        />
      </div>
      <div className="w-36">
        <FormLabel htmlFor="filter-company-code">Company code</FormLabel>
        <Input
          id="filter-company-code"
          type="number"
          inputMode="numeric"
          placeholder="All"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
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
