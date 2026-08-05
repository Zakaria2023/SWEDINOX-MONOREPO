"use client";

import {
  type CompanyDetailsData,
  updateCompanyDetails,
} from "@/app/(dashboard)/companies/[uuid]/edit/details/actions";
import {
  companyDetailsSchema,
  type CompanyDetailsFormValues,
} from "@/app/(dashboard)/companies/[uuid]/edit/details/validation";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { companyLangs } from "@/lib/enums";
import { COMPANY_LANGUAGE_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";

type Props = {
  company: CompanyDetailsData;
};

export const CompanyDetailsForm = ({ company }: Props) => {
  const [state, dispatch, isPending] = useActionState(updateCompanyDetails, {});

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyDetailsFormValues>({
    resolver: zodResolver(companyDetailsSchema),
    defaultValues: {
      companyName: company.companyName,
      correspName: company.correspName ?? "",
      lang: company.lang ?? "",
      remarks: company.remarks ?? "",
      searchCode1: company.searchCode1 ?? "",
      searchCode2: company.searchCode2 ?? "",
      searchCode3: company.searchCode3 ?? "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, companyUuid: company.uuid });
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormError>{state.error}</FormError>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
          Company Details
        </h2>
        <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <FormLabel htmlFor="companyName" required>
                Company Name
              </FormLabel>
              <Input
                id="companyName"
                {...register("companyName")}
                aria-invalid={!!errors.companyName}
                placeholder="Enter the company name"
                disabled={isPending}
              />
              <FormFieldError message={errors.companyName?.message} />
            </div>

            <FormSelectField
              control={control}
              id="lang"
              name="lang"
              label="Language"
              options={companyLangs.map((lang) => ({
                value: lang,
                label: COMPANY_LANGUAGE_LABELS[lang],
              }))}
              emptyValue=""
              disabled={isPending}
            />

            <div>
              <FormLabel htmlFor="correspName">Corresp. Name</FormLabel>
              <Input
                id="correspName"
                {...register("correspName")}
                disabled={isPending}
              />
            </div>
          </div>

          <div>
            <FormLabel htmlFor="remarks">Remarks</FormLabel>
            <Textarea
              id="remarks"
              {...register("remarks")}
              rows={3}
              placeholder="Any additional remarks..."
              disabled={isPending}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
          Search Codes
        </h2>
        <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-3">
          <div>
            <FormLabel htmlFor="searchCode1">Search Code</FormLabel>
            <Input
              id="searchCode1"
              {...register("searchCode1")}
              disabled={isPending}
            />
          </div>
          <div>
            <FormLabel htmlFor="searchCode2">Search Code</FormLabel>
            <Input
              id="searchCode2"
              {...register("searchCode2")}
              disabled={isPending}
            />
          </div>
          <div>
            <FormLabel htmlFor="searchCode3">Search Code</FormLabel>
            <Input
              id="searchCode3"
              {...register("searchCode3")}
              disabled={isPending}
            />
          </div>
        </div>
      </section>

      <div className="flex gap-3 pb-6">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Link
          href={`/companies/${company.uuid}/edit`}
          className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm text-foreground transition-colors hover:bg-muted/40"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
};
