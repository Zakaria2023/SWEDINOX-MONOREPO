"use client";

import { Controller, useFormContext } from "react-hook-form";
import { IndustryOption } from "@/app/(dashboard)/industries/actions";
import { VisitReportFormValues } from "@/app/(dashboard)/visit-reports/validation";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { FormLabel } from "@/components/ui/form-field";
import { companyClassifications, visitReportReasons } from "@/lib/enums";
import {
  COMMON_TEXT,
  COMPANY_CLASSIFICATION_LABELS,
  VISIT_REPORT_REASON_LABELS,
} from "@/lib/labels";

type Props = {
  isPending: boolean;
  industries: IndustryOption[];
};

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
  const { control, register } = useFormContext<VisitReportFormValues>();

  const industryOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...industries.map((industry) => ({
      value: industry.id,
      label: industry.id,
      description: industry.name,
    })),
  ];

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
            <FormLabel htmlFor="nextVisitReason">Visit reason</FormLabel>
            <Controller
              name="nextVisitReason"
              control={control}
              render={({ field }) => (
                <Select
                  id="nextVisitReason"
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
    </section>
  );
};
