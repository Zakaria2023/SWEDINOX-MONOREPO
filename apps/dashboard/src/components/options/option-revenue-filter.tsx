"use client";

import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  createdFrom?: string;
  createdUntil?: string;
};

// Creation date range — the filter the legacy "Options" overview offers. Blank
// means all.
export const OptionRevenueFilter = ({ createdFrom, createdUntil }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [from, setFrom] = useState(createdFrom ?? "");
  const [until, setUntil] = useState(createdUntil ?? "");

  const apply = () => {
    const params = new URLSearchParams();
    if (from) {
      params.set("createdFrom", from);
    }
    if (until) {
      params.set("createdUntil", until);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const clear = () => {
    setFrom("");
    setUntil("");
    router.push(pathname);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-44">
        <FormLabel htmlFor="filter-created-from">Creation date from</FormLabel>
        <Input
          id="filter-created-from"
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
      </div>
      <div className="w-44">
        <FormLabel htmlFor="filter-created-until">Creation date to</FormLabel>
        <Input
          id="filter-created-until"
          type="date"
          value={until}
          onChange={(event) => setUntil(event.target.value)}
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
