"use client";

import { useFormContext } from "react-hook-form";
import { VisitReportFormValues } from "@/app/(dashboard)/visit-reports/validation";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { visitReportReasons } from "@/lib/enums";
import { VISIT_REPORT_REASON_LABELS } from "@/lib/labels";

type Props = {
  isPending: boolean;
};

export const DetailsSection = ({ isPending }: Props) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<VisitReportFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
        Details
      </h2>
      <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4">
        <FormSelectField
          control={control}
          id="visitReason"
          name="visitReason"
          label="Visit Reason"
          options={[
            { value: "", label: "Select an option" },
            ...visitReportReasons.map((reason) => ({
              value: reason,
              label: VISIT_REPORT_REASON_LABELS[reason],
            })),
          ]}
          emptyValue=""
          disabled={isPending}
          errorMessage={errors.visitReason?.message}
        />

        <div>
          <FormLabel htmlFor="attentionPoint">Attention Point</FormLabel>
          <textarea
            id="attentionPoint"
            {...register("attentionPoint")}
            rows={5}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
            disabled={isPending}
          />
          <FormFieldError message={errors.attentionPoint?.message} />
        </div>

        <div>
          <FormLabel htmlFor="remarks">Remarks</FormLabel>
          <textarea
            id="remarks"
            {...register("remarks")}
            rows={5}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
            disabled={isPending}
          />
          <FormFieldError message={errors.remarks?.message} />
        </div>
      </div>
    </section>
  );
};
