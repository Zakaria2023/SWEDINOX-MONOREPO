"use client";

import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { DashboardUserOption } from "@/app/(dashboard)/users/actions";
import {
  ContactOption,
  getContactsByCompanyUuid,
} from "@/app/(dashboard)/visit-reports/actions";
import { useVisitReportSubmit } from "@/app/(dashboard)/visit-reports/use-visit-report-submit";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { visitReportContactMethods, visitReportReasons } from "@/lib/enums";
import {
  COMMON_TEXT,
  VISIT_REPORT_CONTACT_METHOD_LABELS,
  VISIT_REPORT_REASON_LABELS,
} from "@/lib/labels";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller } from "react-hook-form";

type VisitReportFormProps = {
  companies: CompanyOption[];
  adminUsers: DashboardUserOption[];
};

export const VisitReportForm = ({
  companies,
  adminUsers,
}: VisitReportFormProps) => {
  const router = useRouter();
  const { form, isPending, onSubmit, state } = useVisitReportSubmit();
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = form;

  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const handleCompanyChange = async (
    value: string,
    fieldOnChange: (value: string) => void,
  ) => {
    fieldOnChange(value);
    setValue("contactUuid", "");
    setContacts([]);

    if (value) {
      setLoadingContacts(true);
      const result = await getContactsByCompanyUuid(value);
      setContacts(result);
      setLoadingContacts(false);
    }
  };

  const companyOptions = [
    { value: "", label: COMMON_TEXT.selectPlaceholder },
    ...companies.map((company) => ({
      value: company.uuid,
      label: [company.searchCode1, company.companyName]
        .filter(Boolean)
        .join(" - "),
    })),
  ];

  const visitedByOptions = [
    { value: "", label: COMMON_TEXT.selectPlaceholder },
    ...adminUsers.map((user) => ({
      value: user.value,
      label: user.label,
    })),
  ];

  const contactMethodOptions = [
    { value: "", label: COMMON_TEXT.selectPlaceholder },
    ...visitReportContactMethods.map((method) => ({
      value: method,
      label: VISIT_REPORT_CONTACT_METHOD_LABELS[method],
    })),
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
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
            onValueChange={handleCompanyChange}
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
            <Input
              id="visitTime"
              type="time"
              {...register("visitTime")}
              disabled={isPending}
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
              <span className="text-sm font-medium text-gray-700">
                Visit / telephone contact has taken place
              </span>
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          Address and Contact
        </h2>
        <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <FormLabel htmlFor="address">Address</FormLabel>
            <Input id="address" {...register("address")} disabled={isPending} />
            <FormFieldError message={errors.address?.message} />
          </div>

          <div>
            <FormLabel htmlFor="postalCode">Postal Code</FormLabel>
            <Input
              id="postalCode"
              {...register("postalCode")}
              disabled={isPending}
            />
            <FormFieldError message={errors.postalCode?.message} />
          </div>

          <div>
            <FormLabel htmlFor="city">City</FormLabel>
            <Input id="city" {...register("city")} disabled={isPending} />
            <FormFieldError message={errors.city?.message} />
          </div>

          <div>
            <FormLabel htmlFor="telephone">Tel</FormLabel>
            <Input
              id="telephone"
              {...register("telephone")}
              disabled={isPending}
            />
            <FormFieldError message={errors.telephone?.message} />
          </div>

          <div>
            <FormLabel htmlFor="fax">Fax</FormLabel>
            <Input id="fax" {...register("fax")} disabled={isPending} />
            <FormFieldError message={errors.fax?.message} />
          </div>

          <div className="md:col-span-2">
            <FormSelectField
              control={control}
              id="contactUuid"
              name="contactUuid"
              label="Contact"
              options={[
                { value: "", label: COMMON_TEXT.selectPlaceholder },
                ...contacts.map((c) => ({
                  value: c.uuid,
                  label: [c.firstName, c.lastName].filter(Boolean).join(" "),
                })),
              ]}
              emptyValue=""
              disabled={isPending || loadingContacts || contacts.length === 0}
              errorMessage={errors.contactUuid?.message}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          Details
        </h2>
        <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4">
          <FormSelectField
            control={control}
            id="visitReason"
            name="visitReason"
            label="Visit Reason"
            options={[
              { value: "", label: COMMON_TEXT.selectPlaceholder },
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

      <FormError>{state.error}</FormError>

      <FormActions
        isPending={isPending}
        onCancel={() => router.push("/visit-reports")}
        submitLabel="Create Visit Report"
      />
    </form>
  );
};
