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
import { KeyboardEvent, ReactNode, useState } from "react";

type FilterProps = {
  control: TableFilterControl;
};

type DraftInputProps = {
  id?: string;
  value: string;
  placeholder: string;
  ariaLabel: string;
  className: string;
  disabled: boolean;
  onCommit: (next: string) => void;
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

// Text is committed on Enter or on leaving the box, not per keystroke: half a
// product code or half a list of bundles is not a view anyone asked for. Keyed
// by the URL's value at the call site, so `Clear` empties the draft too.
const DraftInput = ({
  id,
  value,
  placeholder,
  ariaLabel,
  className,
  disabled,
  onCommit,
}: DraftInputProps) => {
  const [draft, setDraft] = useState(value);

  const commit = () => {
    if (draft.trim() !== value) {
      onCommit(draft.trim());
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    }
  };

  return (
    <Input
      id={id}
      value={draft}
      disabled={disabled}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={className}
    />
  );
};

const TextRangeFilter = ({ control }: FilterProps) => {
  const { value, setParams, isPending } = useTableQuery();
  const { from, to } = parseRangeValue(value(control.key));

  const write = (nextFrom: string, nextTo: string) =>
    setParams({ [control.key]: rangeValue(nextFrom, nextTo) });

  return (
    <Labelled label={control.label} htmlFor={`filter-${control.key}-from`}>
      <div className="flex items-center gap-1">
        <DraftInput
          key={`from-${from}`}
          id={`filter-${control.key}-from`}
          value={from}
          disabled={isPending}
          onCommit={(next) => write(next, to)}
          placeholder="From"
          ariaLabel={`${control.label} from`}
          className="h-8 w-36"
        />
        <span className="text-xs text-muted-foreground">u/i</span>
        <DraftInput
          key={`to-${to}`}
          value={to}
          disabled={isPending}
          onCommit={(next) => write(from, next)}
          placeholder="To"
          ariaLabel={`${control.label} up to and including`}
          className="h-8 w-36"
        />
      </div>
    </Labelled>
  );
};

// A pasted list may be split by commas, spaces, semicolons or new lines; each
// value becomes its own URL param, which every list action already reads as
// "any of these".
const ListFilter = ({ control }: FilterProps) => {
  const { values, setParams, isPending } = useTableQuery();
  if (control.kind !== "list") {
    return null;
  }
  const current = values(control.key).join(", ");

  return (
    <Labelled label={control.label} htmlFor={`filter-${control.key}`}>
      <DraftInput
        key={current}
        id={`filter-${control.key}`}
        value={current}
        disabled={isPending}
        onCommit={(next) => {
          const list = next.split(/[\s,;]+/).filter((entry) => entry !== "");
          setParams({ [control.key]: list.length > 0 ? list : null });
        }}
        placeholder={control.placeholder ?? "Paste a list…"}
        ariaLabel={control.label}
        className="h-8 w-64"
      />
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
  if (control.kind === "checkbox") {
    return <CheckboxFilter control={control} />;
  }
  if (control.kind === "textRange") {
    return <TextRangeFilter control={control} />;
  }
  if (control.kind === "list") {
    return <ListFilter control={control} />;
  }
  return <NumberRangeFilter control={control} />;
};
