"use client";

import { useFormContext, Controller } from "react-hook-form";
import { VisitReportFormValues } from "@/app/(dashboard)/visit-reports/validation";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { DashboardUserOption } from "@/lib/server/clerk";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { TimePicker } from "@/components/shadcn/time-picker";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { visitReportContactMethods } from "@/lib/enums";
import { VISIT_REPORT_CONTACT_METHOD_LABELS } from "@/lib/labels";

type Props = {
  isPending: boolean;
  companies: CompanyOption[];
  adminUsers: DashboardUserOption[];
  onCompanyChange: (
    value: string,
    fieldOnChange: (value: string) => void,
  ) => void;
};

export const VisitReportSection = ({
  isPending,
  companies,
  adminUsers,
  onCompanyChange,
}: Props) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<VisitReportFormValues>();

  const companyOptions = [
    { value: "", label: "Select an option" },
    ...companies.map((company) => ({
      value: company.uuid,
      label: [company.searchCode1, company.companyName]
        .filter(Boolean)
        .join(" - "),
    })),
  ];

  const visitedByOptions = [
    { value: "", label: "Select an option" },
    ...adminUsers.map((user) => ({
      value: user.value,
      label: user.label,
    })),
  ];

  const contactMethodOptions = [
    { value: "", label: "Select an option" },
    ...visitReportContactMethods.map((method) => ({
      value: method,
      label: VISIT_REPORT_CONTACT_METHOD_LABELS[method],
    })),
  ];

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
        Visit Report
      </h2>
      <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 md:grid-cols-2">
        <FormSelectField
          control={control}
          id="companyUuid"
          name="companyUuid"
          label="Company"
          options={companyOptions}
          emptyValue=""
          disabled={isPending}
          required
          errorMessage={errors.companyUuid?.message}
          onValueChange={onCompanyChange}
        />

        <div>
          <FormLabel htmlFor="representative">Representative</FormLabel>
          <Input
            id="representative"
            {...register("representative")}
            disabled={isPending}
          />
          <FormFieldError message={errors.representative?.message} />
        </div>

        <FormSelectField
          control={control}
          id="visitedBy"
          name="visitedBy"
          label="Visited By"
          options={visitedByOptions}
          emptyValue=""
          disabled={isPending}
          errorMessage={errors.visitedBy?.message}
        />

        <FormSelectField
          control={control}
          id="contactMethod"
          name="contactMethod"
          label="Visit / Telephone Contact"
          options={contactMethodOptions}
          emptyValue=""
          disabled={isPending}
          errorMessage={errors.contactMethod?.message}
        />

        <div>
          <FormLabel htmlFor="visitDate">Visit Date</FormLabel>
          <Controller
            name="visitDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value ?? ""}
                onChange={field.onChange}
                disabled={isPending}
              />
            )}
          />
          <FormFieldError message={errors.visitDate?.message} />
        </div>

        <div>
          <FormLabel htmlFor="visitTime">Visit Time</FormLabel>
          <Controller
            name="visitTime"
            control={control}
            render={({ field }) => (
              <TimePicker
                value={field.value ?? ""}
                onChange={field.onChange}
                disabled={isPending}
              />
            )}
          />
          <FormFieldError message={errors.visitTime?.message} />
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
            <input
              type="checkbox"
              className="size-4 rounded border-border accent-primary"
              {...register("hasTakenPlace")}
              disabled={isPending}
            />
            <span className="text-sm font-medium text-foreground">
              Visit / telephone contact has taken place
            </span>
          </label>
        </div>
      </div>
    </section>
  );
};
