"use client";

import { useFormContext } from "react-hook-form";
import { VisitReportFormValues } from "@/app/(dashboard)/visit-reports/validation";
import { Checkbox } from "@/components/shadcn/checkbox";
import { visitReportCategories, VisitReportCategory } from "@/lib/enums";
import { VISIT_REPORT_CATEGORY_LABELS } from "@/lib/labels";

type Props = {
  isPending: boolean;
};

export const CategoriesSection = ({ isPending }: Props) => {
  const { watch, setValue } = useFormContext<VisitReportFormValues>();
  const selected = watch("categories") ?? [];

  const toggle = (category: VisitReportCategory) => {
    const next = selected.includes(category)
      ? selected.filter((c) => c !== category)
      : [...selected, category];
    setValue("categories", next);
  };

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
        Categories
      </h2>
      <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
        {visitReportCategories.map((category) => (
          <label
            key={category}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3"
          >
            <Checkbox
              checked={selected.includes(category)}
              onChange={() => toggle(category)}
              disabled={isPending}
            />
            <span className="text-sm text-foreground">
              {VISIT_REPORT_CATEGORY_LABELS[category]}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
};
