"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AddressSelectOption } from "@/app/(dashboard)/addresses/actions";
import { cn } from "@/lib/helpers";

type AddressSelectProps = {
  addresses: AddressSelectOption[];
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
  name?: string;
  onValueChange?: (value: string) => void;
  value?: string;
};

const truncate = (value: string | null | undefined, maxLength: number) => {
  if (!value) {
    return "";
  }

  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
};

export const AddressSelect = ({
  addresses,
  disabled,
  id,
  invalid,
  name,
  onValueChange,
  value,
}: AddressSelectProps) => {
  const { t } = useTranslation();
  const selected = addresses.find((address) => address.uuid === value);

  const triggerLabel = selected
    ? [selected.companyName, selected.streetAndNo, selected.city]
        .filter(Boolean)
        .join(" | ")
    : t("address-select.empty");

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
          "flex h-8 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        )}
      >
        <span className="truncate text-sm">{triggerLabel}</span>
        <SelectPrimitive.Icon className="ms-2 shrink-0 text-muted-foreground transition-transform data-[open]:rotate-180">
          <ChevronDown className="size-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          align="start"
          sideOffset={6}
          className="z-50 min-w-[var(--anchor-width)] outline-none"
        >
          <SelectPrimitive.Popup className="overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg data-[side=bottom]:slide-in-from-top-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <SelectPrimitive.List className="max-h-72 overflow-y-auto p-1">
              <SelectPrimitive.Item
                value=""
                className="flex cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
              >
                <SelectPrimitive.ItemText className="flex-1 text-muted-foreground italic">
                  {t("address-select.empty")}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="flex size-4 items-center justify-center text-primary">
                  <Check className="size-4" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>

              {addresses.map((address) => (
                <SelectPrimitive.Item
                  key={address.uuid}
                  value={address.uuid}
                  className="flex cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  <SelectPrimitive.ItemText className="grid min-w-0 flex-1 grid-cols-3 gap-2">
                    <span className="truncate font-medium">
                      {truncate(address.companyName, 20)}
                    </span>
                    <span className="truncate text-muted-foreground">
                      {truncate(address.streetAndNo, 20)}
                    </span>
                    <span className="truncate text-muted-foreground">
                      {truncate(address.city, 16)}
                    </span>
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="flex size-4 shrink-0 items-center justify-center text-primary">
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
