"use client";

import { VisitReportActionResult } from "@/app/(dashboard)/visit-reports/actions";
import {
  createVisitReportSchema,
  VisitReportFormValues,
} from "@/app/(dashboard)/visit-reports/validation";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ReactNode, useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";

type Props = {
  visitReportUuid: string;
  defaultValues: VisitReportFormValues;
  /** Writes only the columns this section owns. */
  save: (
    visitReportUuid: string,
    values: VisitReportFormValues,
  ) => Promise<VisitReportActionResult>;
  children: (isPending: boolean) => ReactNode;
};

/**
 * The shell every visit report section edits inside.
 *
 * Sections take `isPending` as a prop rather than reading it from context, so
 * the children are given it as a render argument.
 */
export const VisitReportSectionForm = ({
  visitReportUuid,
  defaultValues,
  save,
  children,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<VisitReportActionResult>({});

  const form = useForm<VisitReportFormValues>({
    resolver: zodResolver(createVisitReportSchema()),
    defaultValues,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setState(await save(visitReportUuid, values));
    });
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        {state.error && <FormError>{state.error}</FormError>}

        {children(isPending)}

        <FormActions
          submitLabel="Save Changes"
          isPending={isPending}
          onCancel={() => router.push(`/visit-reports/${visitReportUuid}/edit`)}
        />
      </form>
    </FormProvider>
  );
};
