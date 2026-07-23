"use client";

import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  yearFrom?: string;
  yearTo?: string;
  monthFrom?: string;
  monthTo?: string;
};

// Year and month ranges, both blank-means-current, exactly as the legacy
// "Freight flow (SFN)" filter panel words it.
export const FreightFlowFilter = ({
  yearFrom,
  yearTo,
  monthFrom,
  monthTo,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [fromYear, setFromYear] = useState(yearFrom ?? "");
  const [toYear, setToYear] = useState(yearTo ?? "");
  const [fromMonth, setFromMonth] = useState(monthFrom ?? "");
  const [toMonth, setToMonth] = useState(monthTo ?? "");

  const apply = () => {
    const params = new URLSearchParams();
    const entries: Array<[string, string]> = [
      ["yearFrom", fromYear],
      ["yearTo", toYear],
      ["monthFrom", fromMonth],
      ["monthTo", toMonth],
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
    setFromYear("");
    setToYear("");
    setFromMonth("");
    setToMonth("");
    router.push(pathname);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-32">
          <FormLabel htmlFor="filter-sfn-year-from">Year from</FormLabel>
          <Input
            id="filter-sfn-year-from"
            type="number"
            inputMode="numeric"
            placeholder="Current"
            value={fromYear}
            onChange={(event) => setFromYear(event.target.value)}
          />
        </div>
        <div className="w-32">
          <FormLabel htmlFor="filter-sfn-year-to">Year to</FormLabel>
          <Input
            id="filter-sfn-year-to"
            type="number"
            inputMode="numeric"
            placeholder="Same"
            value={toYear}
            onChange={(event) => setToYear(event.target.value)}
          />
        </div>
        <div className="w-32">
          <FormLabel htmlFor="filter-sfn-month-from">Month from</FormLabel>
          <Input
            id="filter-sfn-month-from"
            type="number"
            inputMode="numeric"
            min={1}
            max={12}
            placeholder="Current"
            value={fromMonth}
            onChange={(event) => setFromMonth(event.target.value)}
          />
        </div>
        <div className="w-32">
          <FormLabel htmlFor="filter-sfn-month-to">Month to</FormLabel>
          <Input
            id="filter-sfn-month-to"
            type="number"
            inputMode="numeric"
            min={1}
            max={12}
            placeholder="Same"
            value={toMonth}
            onChange={(event) => setToMonth(event.target.value)}
          />
        </div>
        <Button type="button" onClick={apply}>
          Show data
        </Button>
        <Button type="button" variant="outline" onClick={clear}>
          Clear
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Leave the year or month blank for the current one. All figures are in
        kilograms.
      </p>
    </div>
  );
};
