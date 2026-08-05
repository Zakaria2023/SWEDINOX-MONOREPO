"use client";

import { useFormContext } from "react-hook-form";
import { VisitReportFormValues } from "@/app/(dashboard)/visit-reports/validation";
import { Checkbox } from "@/components/shadcn/checkbox";
import { MONTHS } from "@/lib/constants";

type Props = {
  isPending: boolean;
};

export const VisitPlanningSection = ({ isPending }: Props) => {
  const { watch, setValue } = useFormContext<VisitReportFormValues>();
  const visitPlanning = watch("visitPlanning") ?? [];

  const togglePlanning = (index: number, key: "call" | "visit") => {
    const next = MONTHS.map((_, i) => {
      const entry = visitPlanning[i] ?? { call: false, visit: false };
      return i === index ? { ...entry, [key]: !entry[key] } : entry;
    });
    setValue("visitPlanning", next);
  };

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
        Visit planning
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">Month</th>
              <th className="px-3 py-2 text-center font-medium">Call</th>
              <th className="px-3 py-2 text-center font-medium">Visit</th>
            </tr>
          </thead>
          <tbody>
            {MONTHS.map((month, index) => {
              const entry = visitPlanning[index] ?? {
                call: false,
                visit: false,
              };
              return (
                <tr key={month} className="border-b last:border-0">
                  <td className="px-3 py-1.5">{month}</td>
                  <td className="px-3 py-1.5 text-center">
                    <Checkbox
                      checked={entry.call}
                      onChange={() => togglePlanning(index, "call")}
                      disabled={isPending}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <Checkbox
                      checked={entry.visit}
                      onChange={() => togglePlanning(index, "visit")}
                      disabled={isPending}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
