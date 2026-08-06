"use client";

import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { useTableQuery } from "@/hooks/use-table-query";
import {
  parseRangeValue,
  rangeValue,
  TableFilterControl,
} from "@/lib/table-query";
import { ReactNode } from "react";

type FilterProps = {
  control: TableFilterControl;
};

type LabelledProps = {
  label: string;
  htmlFor?: string;
  children: ReactNode;
};

const Labelled = ({ label, htmlFor, children }: LabelledProps) => (
  <div className="flex flex-col gap-1">
    <label
      htmlFor={htmlFor}
      className="text-xs font-medium text-muted-foreground"
    >
      {label}
    </label>
    {children}
  </div>
);

const SelectFilter = ({ control }: FilterProps) => {
  const { value, setParams, isPending } = useTableQuery();
  if (control.kind !== "select") {
    return null;
  }

  return (
    <Labelled label={control.label} htmlFor={`filter-${control.key}`}>
      <Select
        id={`filter-${control.key}`}
        className="h-8 min-w-40"
        disabled={isPending}
        value={value(control.key)}
        onValueChange={(next) => setParams({ [control.key]: next || null })}
        placeholder={control.placeholder ?? "All"}
        options={[
          // "All" is a real choice rather than an omission — it is how a filter
          // is cleared, and a dropdown with no way back to unfiltered strands
          // the reader.
          { value: "", label: "All" },
          ...control.options,
        ]}
      />
    </Labelled>
  );
};

const DateRangeFilter = ({ control }: FilterProps) => {
  const { value, setParams, isPending } = useTableQuery();
  const { from, to } = parseRangeValue(value(control.key));

  const write = (nextFrom: string, nextTo: string) =>
    setParams({ [control.key]: rangeValue(nextFrom, nextTo) });

  return (
    <Labelled label={control.label} htmlFor={`filter-${control.key}-from`}>
      <div className="flex items-center gap-1">
        <Input
          id={`filter-${control.key}-from`}
          type="date"
          value={from}
          disabled={isPending}
          onChange={(event) => write(event.target.value, to)}
          aria-label={`${control.label} from`}
          className="h-8 w-36"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input
          type="date"
          value={to}
          disabled={isPending}
          onChange={(event) => write(from, event.target.value)}
          aria-label={`${control.label} to`}
          className="h-8 w-36"
        />
      </div>
    </Labelled>
  );
};

const NumberRangeFilter = ({ control }: FilterProps) => {
  const { value, setParams, isPending } = useTableQuery();
  const { from, to } = parseRangeValue(value(control.key));

  const write = (nextFrom: string, nextTo: string) =>
    setParams({ [control.key]: rangeValue(nextFrom, nextTo) });

  return (
    <Labelled label={control.label} htmlFor={`filter-${control.key}-min`}>
      <div className="flex items-center gap-1">
        <Input
          id={`filter-${control.key}-min`}
          type="number"
          inputMode="decimal"
          value={from}
          disabled={isPending}
          onChange={(event) => write(event.target.value, to)}
          placeholder="Min"
          aria-label={`${control.label} minimum`}
          className="h-8 w-28"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input
          type="number"
          inputMode="decimal"
          value={to}
          disabled={isPending}
          onChange={(event) => write(from, event.target.value)}
          placeholder="Max"
          aria-label={`${control.label} maximum`}
          className="h-8 w-28"
        />
      </div>
    </Labelled>
  );
};

export const TableFilter = ({ control }: FilterProps) => {
  if (control.kind === "select") {
    return <SelectFilter control={control} />;
  }
  if (control.kind === "dateRange") {
    return <DateRangeFilter control={control} />;
  }
  return <NumberRangeFilter control={control} />;
};
