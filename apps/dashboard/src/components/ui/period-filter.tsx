"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";

type Props = {
  year?: number;
  month?: number;
};

// Year/Month (invoice date) filter for the finance reports. Blank means all.
export const PeriodFilter = ({ year, month }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [yearValue, setYearValue] = useState(year ? String(year) : "");
  const [monthValue, setMonthValue] = useState(month ? String(month) : "");

  const apply = () => {
    const params = new URLSearchParams();
    if (yearValue) {
      params.set("year", yearValue);
    }
    if (monthValue) {
      params.set("month", monthValue);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const clear = () => {
    setYearValue("");
    setMonthValue("");
    router.push(pathname);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-28">
        <FormLabel htmlFor="filter-year">Year</FormLabel>
        <Input
          id="filter-year"
          type="number"
          inputMode="numeric"
          placeholder="All"
          value={yearValue}
          onChange={(e) => setYearValue(e.target.value)}
        />
      </div>
      <div className="w-28">
        <FormLabel htmlFor="filter-month">Month</FormLabel>
        <Input
          id="filter-month"
          type="number"
          inputMode="numeric"
          min={1}
          max={12}
          placeholder="All"
          value={monthValue}
          onChange={(e) => setMonthValue(e.target.value)}
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
