"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown, CornerDownRight } from "lucide-react";
import { cn } from "@/lib/helpers";
import { COMMON_TEXT } from "@/lib/labels";

export type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
  depth?: number;
  description?: string;
};

type SelectProps = {
  className?: string;
  columnHeaders?: { left: string; right: string };
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
  name?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  value?: string;
};

export const Select = ({
  className,
  columnHeaders,
  disabled,
  id,
  invalid,
  name,
  onValueChange,
  options,
  placeholder,
  value,
}: SelectProps) => {
  return (
    <SelectPrimitive.Root
      disabled={disabled}
      name={name}
      value={value ?? null}
      onValueChange={(nextValue) => onValueChange?.((nextValue ?? "") as string)}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-invalid={invalid || undefined}
        data-slot="select-trigger"
        className={cn(
          "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          className,
        )}
      >
        <SelectPrimitive.Value className="flex-1 truncate text-left">
          {(selectedValue) => {
            const selected = options.find(
              (option) => option.value === selectedValue,
            );
            if (!selected) return placeholder ?? COMMON_TEXT.selectPlaceholder;
            if (selected.description)
              return `${selected.label} — ${selected.description}`;
            return selected.label;
          }}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon className="shrink-0 text-muted-foreground transition-transform data-open:rotate-180">
          <ChevronDown className="size-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          align="start"
          sideOffset={6}
          className="z-50 min-w-(--anchor-width) outline-none"
        >
          <SelectPrimitive.Popup
            data-slot="select-popup"
            className="overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          >
            {columnHeaders && (
              <div className="grid grid-cols-[6rem_1fr] border-b px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>{columnHeaders.left}</span>
                <span>{columnHeaders.right}</span>
              </div>
            )}
            <SelectPrimitive.List className="max-h-72 overflow-y-auto p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  style={
                    option.depth
                      ? { paddingLeft: `${option.depth * 16 + 10}px` }
                      : undefined
                  }
                  className="flex cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                >
                  <SelectPrimitive.ItemText className="flex flex-1 items-center gap-1.5">
                    {option.depth ? (
                      <CornerDownRight className="size-3 shrink-0 text-muted-foreground" />
                    ) : null}
                    {columnHeaders && option.description !== undefined ? (
                      <span className="grid w-full grid-cols-[6rem_1fr]">
                        <span>{option.label}</span>
                        <span>{option.description}</span>
                      </span>
                    ) : (
                      option.label
                    )}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="flex size-4 items-center justify-center text-primary">
                    <Check className="size-4" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
};
