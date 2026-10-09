"use client";

import { Checkbox } from "@/components/shadcn/checkbox";
import { DatePicker } from "@/components/shadcn/date-picker";
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
        <DatePicker
          id={`filter-${control.key}-from`}
          value={from}
          disabled={isPending}
          onChange={(next) => write(next, to)}
          ariaLabel={`${control.label} from`}
          placeholder="From"
          className="w-36"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <DatePicker
          value={to}
          disabled={isPending}
          onChange={(next) => write(from, next)}
          ariaLabel={`${control.label} to`}
          placeholder="To"
          className="w-36"
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

// Unticked clears the key rather than writing "false": the switch narrows the
// view when it is on and says nothing when it is off.
const CheckboxFilter = ({ control }: FilterProps) => {
  const { value, setParams, isPending } = useTableQuery();

  return (
    <label
      htmlFor={`filter-${control.key}`}
      className="flex h-8 items-center gap-2 text-sm"
    >
      <Checkbox
        id={`filter-${control.key}`}
        checked={value(control.key) === "true"}
        disabled={isPending}
        onChange={(event) =>
          setParams({ [control.key]: event.target.checked ? "true" : null })
        }
      />
      {control.label}
    </label>
  );
};

export const TableFilter = ({ control }: FilterProps) => {
  if (control.kind === "select") {
    return <SelectFilter control={control} />;
  }
  if (control.kind === "dateRange") {
    return <DateRangeFilter control={control} />;
  }
  if (control.kind === "checkbox") {
    return <CheckboxFilter control={control} />;
  }
  return <NumberRangeFilter control={control} />;
};
