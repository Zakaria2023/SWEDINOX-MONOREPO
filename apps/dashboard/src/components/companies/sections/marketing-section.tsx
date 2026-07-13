"use client";

import { IndustryOption } from "@/app/(dashboard)/industries/actions";
import { CompanyFormValues } from "@/app/(dashboard)/companies/validation";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { FormLabel } from "@/components/ui/form-field";
import { companyClassifications, visitReportReasons } from "@/lib/enums";
import {
  COMMON_TEXT,
  COMPANY_CLASSIFICATION_LABELS,
  VISIT_REPORT_REASON_LABELS,
} from "@/lib/labels";
import { Controller, useFormContext } from "react-hook-form";

type Props = {
  isPending: boolean;
  industries: IndustryOption[];
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const classificationOptions = [
  { value: "", label: COMMON_TEXT.emptyOption },
  ...companyClassifications.map((code) => ({
    value: code,
    label: code,
    description: COMPANY_CLASSIFICATION_LABELS[code],
  })),
];

const visitReasonOptions = [
  { value: "", label: COMMON_TEXT.emptyOption },
  ...visitReportReasons.map((reason) => ({
    value: reason,
    label: VISIT_REPORT_REASON_LABELS[reason],
  })),
];

export const MarketingSection = ({ isPending, industries }: Props) => {
  const { control, register, watch, setValue } =
    useFormContext<CompanyFormValues>();

  const industryOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...industries.map((industry) => ({
      value: industry.id,
      label: industry.id,
      description: industry.name,
    })),
  ];

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
      <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
        Marketing
      </h2>

      {/* Industry & Classification */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <FormLabel htmlFor="industry">Industry</FormLabel>
          <Controller
            name="industry"
            control={control}
            render={({ field }) => (
              <Select
                id="industry"
                columnHeaders={{ left: "Code", right: "Industry" }}
                options={industryOptions}
                value={field.value ?? ""}
                onValueChange={field.onChange}
                placeholder={COMMON_TEXT.emptyOption}
                disabled={isPending}
              />
            )}
          />
        </div>

        <div>
          <FormLabel htmlFor="classification">Classification</FormLabel>
          <Controller
            name="classification"
            control={control}
            render={({ field }) => (
              <Select
                id="classification"
                columnHeaders={{ left: "Code", right: "Classification" }}
                options={classificationOptions}
                value={field.value ?? ""}
                onValueChange={field.onChange}
                placeholder={COMMON_TEXT.emptyOption}
                disabled={isPending}
              />
            )}
          />
        </div>
      </div>

      {/* Visit */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Visit</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FormLabel htmlFor="visitFrequency">Visit frequency</FormLabel>
            <Input
              id="visitFrequency"
              type="number"
              min="0"
              {...register("visitFrequency")}
              disabled={isPending}
            />
          </div>
          <div>
            <FormLabel htmlFor="callFrequencyPerYear">
              Call frequency per year
            </FormLabel>
            <Input
              id="callFrequencyPerYear"
              type="number"
              min="0"
              {...register("callFrequencyPerYear")}
              disabled={isPending}
            />
          </div>
          <div>
            <FormLabel htmlFor="targetDateNextVisit">
              Target date of next visit
            </FormLabel>
            <Input
              id="targetDateNextVisit"
              type="date"
              {...register("targetDateNextVisit")}
              disabled={isPending}
            />
          </div>
          <div>
            <FormLabel htmlFor="visitReason">Visit reason</FormLabel>
            <Controller
              name="visitReason"
              control={control}
              render={({ field }) => (
                <Select
                  id="visitReason"
                  options={visitReasonOptions}
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  placeholder={COMMON_TEXT.emptyOption}
                  disabled={isPending}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Revenue & sales */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          Revenue &amp; sales
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FormLabel htmlFor="potentialAnnualRevenue">
              Potential annual revenue (€)
            </FormLabel>
            <Input
              id="potentialAnnualRevenue"
              type="number"
              step="0.01"
              {...register("potentialAnnualRevenue")}
              disabled={isPending}
            />
          </div>
          <div>
            <FormLabel htmlFor="targetAnnualRevenue">
              Target annual revenue (€)
            </FormLabel>
            <Input
              id="targetAnnualRevenue"
              type="number"
              step="0.01"
              {...register("targetAnnualRevenue")}
              disabled={isPending}
            />
          </div>
          <div>
            <FormLabel htmlFor="potentialAnnualSales">
              Potential annual sales
            </FormLabel>
            <Input
              id="potentialAnnualSales"
              type="number"
              step="0.001"
              {...register("potentialAnnualSales")}
              disabled={isPending}
            />
          </div>
          <div>
            <FormLabel htmlFor="targetAnnualSales">
              Target annual sales
            </FormLabel>
            <Input
              id="targetAnnualSales"
              type="number"
              step="0.001"
              {...register("targetAnnualSales")}
              disabled={isPending}
            />
          </div>
          <div>
            <FormLabel htmlFor="numberOfEmployees">
              Number of employees
            </FormLabel>
            <Input
              id="numberOfEmployees"
              type="number"
              min="0"
              {...register("numberOfEmployees")}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {/* Visit planning */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          Visit planning
        </h3>
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
      </div>
    </section>
  );
};
