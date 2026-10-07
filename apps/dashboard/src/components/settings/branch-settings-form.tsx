"use client";

import {
  SettingsView,
  updateBranchSettings,
} from "@/app/(dashboard)/settings/actions";
import {
  branchSettingsSchema,
  BranchSettingsFormValues,
} from "@/app/(dashboard)/settings/validation";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { userName } from "@/lib/helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";

type Props = {
  settings: SettingsView;
  /** Only an administrator may change them; everyone else reads them. */
  canEdit: boolean;
  userNames: Record<string, string>;
};

export const BranchSettingsForm = ({ settings, canEdit, userNames }: Props) => {
  const [state, dispatch, isPending] = useActionState(updateBranchSettings, {});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BranchSettingsFormValues>({
    resolver: zodResolver(branchSettingsSchema),
    defaultValues: {
      overduePostBlockDays: settings.overduePostBlockDays,
      affiliateName: settings.affiliateName ?? "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  const disabled = isPending || !canEdit;

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <FormError>{state.error}</FormError>
      {state.success ? (
        <p className="text-sm text-green-700">Settings saved.</p>
      ) : null}

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
          Branch details
        </h2>
        <div className="space-y-2">
          <FormLabel htmlFor="affiliateName">Affiliate name</FormLabel>
          <Input
            id="affiliateName"
            className="max-w-md"
            {...register("affiliateName")}
            disabled={disabled}
          />
          <FormFieldError message={errors.affiliateName?.message} />
          <p className="text-sm text-muted-foreground">
            This company&rsquo;s own legal name. The overviews print it in
            their &ldquo;Affiliate company details&rdquo; column.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
          Sales — credit control
        </h2>
        <div className="space-y-2">
          <FormLabel htmlFor="overduePostBlockDays">
            Days overdue before a financial block
          </FormLabel>
          <Input
            id="overduePostBlockDays"
            type="number"
            step="1"
            min={1}
            className="w-40"
            {...register("overduePostBlockDays", { valueAsNumber: true })}
            disabled={disabled}
          />
          <FormFieldError message={errors.overduePostBlockDays?.message} />
          <p className="text-sm text-muted-foreground">
            A new order is held with &ldquo;Post(s) outstanding for too
            long&rdquo; when the customer&rsquo;s oldest open invoice is more
            than this many days past its due date. The old system&rsquo;s value
            is not known yet.
          </p>
        </div>
      </section>

      <p className="text-sm text-muted-foreground">
        {settings.updatedByUserId
          ? `Last changed by ${userName(settings.updatedByUserId, userNames)} on ${settings.updatedAt.toLocaleString("en-GB")}.`
          : "Never changed — the default is in use."}
      </p>

      {canEdit ? (
        <div className="flex gap-3 pb-6">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only an administrator can change the settings.
        </p>
      )}
    </form>
  );
};
