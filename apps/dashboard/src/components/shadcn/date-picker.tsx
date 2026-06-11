"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { languageLocales } from "@/i18n/config";
import { useI18nContext } from "@/providers/I18NextProvider";
import { cn } from "@/lib/helpers";

type DatePickerProps = {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export const DatePicker = ({
  value,
  onChange,
  disabled,
  placeholder,
  className,
}: DatePickerProps) => {
  const { language } = useI18nContext();
  const { t } = useTranslation();
  const locale = languageLocales[language];
  const today = new Date();
  const parsed = value ? new Date(value + "T00:00:00") : null;

  const [viewYear, setViewYear] = useState(
    parsed?.getFullYear() ?? today.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    parsed?.getMonth() ?? today.getMonth(),
  );

  const displayValue = parsed
    ? parsed.toLocaleDateString(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";
  const days = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
      new Date(2026, 0, 4 + index),
    ),
  );
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(viewYear, viewMonth, 1));

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDayOfMonth }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((year) => year - 1);
      setViewMonth(11);
      return;
    }

    setViewMonth((month) => month - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((year) => year + 1);
      setViewMonth(0);
      return;
    }

    setViewMonth((month) => month + 1);
  };

  const selectDay = (day: number) => {
    const nextDate = new Date(viewYear, viewMonth, day);
    const yyyy = nextDate.getFullYear();
    const mm = String(nextDate.getMonth() + 1).padStart(2, "0");
    const dd = String(nextDate.getDate()).padStart(2, "0");

    onChange?.(`${yyyy}-${mm}-${dd}`);
  };

  const isSelected = (day: number) =>
    !!parsed &&
    parsed.getFullYear() === viewYear &&
    parsed.getMonth() === viewMonth &&
    parsed.getDate() === day;

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

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
        <span>{displayValue || placeholder || t("date-picker.placeholder")}</span>
        <Calendar className="size-4 shrink-0 text-muted-foreground" />
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner sideOffset={6} className="z-50 outline-none">
          <PopoverPrimitive.Popup className="rounded-xl border border-border bg-popover p-3 shadow-lg outline-none">
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded-lg p-1 hover:bg-muted"
                aria-label={t("date-picker.previous-month")}
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm font-medium">{monthLabel}</span>
              <button
                type="button"
                onClick={nextMonth}
                className="rounded-lg p-1 hover:bg-muted"
                aria-label={t("date-picker.next-month")}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 text-center">
              {days.map((dayLabel) => (
                <span
                  key={dayLabel}
                  className="py-1 text-xs font-medium text-muted-foreground"
                >
                  {dayLabel}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {cells.map((day, index) => (
                <div key={index} className="flex items-center justify-center p-0.5">
                  {day !== null && (
                    <button
                      type="button"
                      onClick={() => selectDay(day)}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg text-sm transition-colors",
                        isSelected(day)
                          ? "bg-primary text-primary-foreground"
                          : isToday(day)
                            ? "border border-primary font-semibold"
                            : "hover:bg-muted",
                      )}
                    >
                      {day}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};
