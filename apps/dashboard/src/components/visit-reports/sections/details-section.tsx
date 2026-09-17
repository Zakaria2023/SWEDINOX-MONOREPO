"use client";

import { useFormContext } from "react-hook-form";
import { VisitReportFormValues } from "@/app/(dashboard)/visit-reports/validation";
import { Checkbox } from "@/components/shadcn/checkbox";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { visitReportReasons, VisitReportReason } from "@/lib/enums";
import { VISIT_REPORT_REASON_LABELS } from "@/lib/labels";

type Props = {
  isPending: boolean;
};

export const DetailsSection = ({ isPending }: Props) => {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<VisitReportFormValues>();

  // A visit can be made for several reasons at once — turnover slipping and a
  // quote to chase on the same call.
  const selectedReasons = watch("visitReasons") ?? [];

  const toggleReason = (reason: VisitReportReason) =>
    setValue(
      "visitReasons",
      selectedReasons.includes(reason)
        ? selectedReasons.filter((held) => held !== reason)
        : [...selectedReasons, reason],
    );

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
        Details
      </h2>
      <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4">
        <div>
          <FormLabel htmlFor="visitReasons">Visit reasons</FormLabel>
          <div id="visitReasons" className="space-y-2">
            {visitReportReasons.map((reason) => (
              <label
                key={reason}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3"
              >
                <Checkbox
                  checked={selectedReasons.includes(reason)}
                  onChange={() => toggleReason(reason)}
                  disabled={isPending}
                />
                <span className="text-sm text-foreground">
                  {VISIT_REPORT_REASON_LABELS[reason]}
                </span>
              </label>
            ))}
          </div>
          <FormFieldError message={errors.visitReasons?.message} />
        </div>

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

        <div>
          <FormLabel htmlFor="visitResult">Visit result</FormLabel>
          <textarea
            id="visitResult"
            {...register("visitResult")}
            rows={5}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
            disabled={isPending}
          />
          <FormFieldError message={errors.visitResult?.message} />
        </div>
      </div>
    </section>
  );
};
