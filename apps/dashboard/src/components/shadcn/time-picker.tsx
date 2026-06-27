"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { Clock } from "lucide-react";
import { cn } from "@/lib/helpers";

type TimePickerProps = {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export const TimePicker = ({
  value,
  onChange,
  disabled,
  className,
}: TimePickerProps) => {
  const [rawH, rawM] = (value ?? "").split(":").map(Number);
  const hour24 = isNaN(rawH) ? null : rawH;
  const minute = isNaN(rawM) ? null : rawM;

  const isPM = hour24 !== null && hour24 >= 12;
  const hour12 =
    hour24 === null ? null : hour24 % 12 === 0 ? 12 : hour24 % 12;

  const displayValue =
    hour12 !== null && minute !== null
      ? `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${isPM ? "PM" : "AM"}`
      : "";

  const emit = (h12: number, m: number, pm: boolean) => {
    const h24 = h12 === 12 ? (pm ? 12 : 0) : h12 + (pm ? 12 : 0);
    onChange?.(`${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  };

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        disabled={disabled}
        type="button"
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
          !displayValue && "text-muted-foreground",
          className,
        )}
      >
        <span>{displayValue || "--:-- --"}</span>
        <Clock className="size-4 shrink-0 text-muted-foreground" />
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner sideOffset={6} className="z-50 outline-none">
          <PopoverPrimitive.Popup className="rounded-xl border border-border bg-popover p-3 shadow-lg outline-none">
            <div className="flex gap-1">
              <div className="flex max-h-52 flex-col gap-0.5 overflow-y-auto">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => emit(h, minute ?? 0, isPM)}
                    className={cn(
                      "w-10 rounded-lg px-2 py-1.5 text-center text-sm transition-colors",
                      hour12 === h
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    {String(h).padStart(2, "0")}
                  </button>
                ))}
              </div>

              <div className="flex items-center px-0.5 text-muted-foreground">
                :
              </div>

              <div className="flex max-h-52 flex-col gap-0.5 overflow-y-auto">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => emit(hour12 ?? 12, m, isPM)}
                    className={cn(
                      "w-10 rounded-lg px-2 py-1.5 text-center text-sm transition-colors",
                      minute === m
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>

              <div className="ml-1 flex flex-col gap-0.5">
                {(["AM", "PM"] as const).map((period) => {
                  const active =
                    hour24 !== null &&
                    (period === "PM" ? isPM : !isPM);
                  return (
                    <button
                      key={period}
                      type="button"
                      onClick={() => emit(hour12 ?? 12, minute ?? 0, period === "PM")}
                      className={cn(
                        "w-10 rounded-lg px-2 py-1.5 text-center text-sm transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted",
                      )}
                    >
                      {period}
                    </button>
                  );
                })}
              </div>
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};
