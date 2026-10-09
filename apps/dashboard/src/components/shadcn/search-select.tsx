"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, X } from "lucide-react";
import { SelectOption } from "@/components/shadcn/select";
import { cn } from "@/lib/helpers";

type SearchSelectProps = {
  className?: string;
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
  name?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  value?: string;
};

/**
 * A `Select` you can type into — the reference's `Supplier` field, which takes
 * a code or a name and lists what matches. Same props as `Select`, so the two
 * swap in place; an option whose value is blank is the "nothing chosen" row of
 * a plain `Select` and is dropped here, because clearing is the ✕ instead.
 */
export const SearchSelect = ({
  className,
  disabled,
  id,
  invalid,
  name,
  onValueChange,
  options,
  placeholder,
  value,
}: SearchSelectProps) => {
  const items = options.filter((option) => option.value !== "");
  const selected = items.find((option) => option.value === value) ?? null;

  return (
    <Combobox.Root
      items={items}
      value={selected}
      disabled={disabled}
      name={name}
      itemToStringLabel={(item: SelectOption) => item.label}
      isItemEqualToValue={(item: SelectOption, other: SelectOption) =>
        item.value === other.value
      }
      onValueChange={(next: SelectOption | null) =>
        onValueChange?.(next?.value ?? "")
      }
    >
      <div className="relative">
        <Combobox.Input
          id={id}
          aria-invalid={invalid || undefined}
          placeholder={placeholder ?? "Type a code or a name"}
          className={cn(
            "flex h-8 w-full items-center rounded-lg border border-input bg-transparent py-1 pr-14 pl-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
            className,
          )}
        />
        <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
          {selected && !disabled && (
            <Combobox.Clear
              aria-label="Clear"
              className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </Combobox.Clear>
          )}
          <Combobox.Trigger
            aria-label="Open"
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            <Combobox.Icon className="transition-transform data-open:rotate-180">
              <ChevronDown className="size-4" />
            </Combobox.Icon>
          </Combobox.Trigger>
        </div>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner
          align="start"
          sideOffset={6}
          className="z-50 min-w-(--anchor-width) outline-none"
        >
          <Combobox.Popup
            data-slot="select-popup"
            className="overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          >
            <Combobox.Empty className="px-2.5 py-2 text-sm text-muted-foreground empty:hidden">
              No match
            </Combobox.Empty>
            <Combobox.List className="max-h-72 overflow-y-auto p-1 empty:hidden">
              {(item: SelectOption) => (
                <Combobox.Item
                  key={item.value}
                  value={item}
                  disabled={item.disabled}
                  className="flex cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                >
                  <span className="flex-1">{item.label}</span>
                  <Combobox.ItemIndicator className="flex size-4 items-center justify-center text-primary">
                    <Check className="size-4" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
};
