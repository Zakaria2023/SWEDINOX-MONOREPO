"use client";

import {
  RevenueGroupOption,
  saveRevenueBudget,
} from "@/app/(dashboard)/revenue-budgets/actions";
import {
  revenueBudgetSchema,
  RevenueBudgetFormValues,
} from "@/app/(dashboard)/revenue-budgets/validation";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";

type Props = {
  year: number;
  revenueGroups: RevenueGroupOption[];
};

type SplitField = {
  label: string;
  revenue: "revenueStock" | "revenueCrossDock" | "revenueFactory";
  weight: "weightStock" | "weightCrossDock" | "weightFactory";
  profit:
    | "profitPercentageStock"
    | "profitPercentageCrossDock"
    | "profitPercentageFactory";
};

// The three order types the reference budgets separately.
const SPLITS: SplitField[] = [
  {
    label: "Out of stock",
    revenue: "revenueStock",
    weight: "weightStock",
    profit: "profitPercentageStock",
  },
  {
    label: "Cross-dock",
    revenue: "revenueCrossDock",
    weight: "weightCrossDock",
    profit: "profitPercentageCrossDock",
  },
  {
    label: "Ex factory",
    revenue: "revenueFactory",
    weight: "weightFactory",
    profit: "profitPercentageFactory",
  },
];

export const RevenueBudgetForm = ({ year, revenueGroups }: Props) => {
  const [state, dispatch, isPending] = useActionState(saveRevenueBudget, {});

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RevenueBudgetFormValues>({
    resolver: zodResolver(revenueBudgetSchema),
    defaultValues: {
      revenueGroupUuid: "",
      year,
      month: 1,
      revenueStock: 0,
      revenueCrossDock: 0,
      revenueFactory: 0,
      weightStock: 0,
      weightCrossDock: 0,
      weightFactory: 0,
      profitPercentageStock: 0,
      profitPercentageCrossDock: 0,
      profitPercentageFactory: 0,
    },
  });

  const groupOptions = [
    { value: "", label: "Select a revenue group" },
    ...revenueGroups.map((group) => ({
      value: group.uuid,
      label: [group.number, group.name].filter(Boolean).join(" — "),
    })),
  ];

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-lg border border-border p-4"
    >
      <h2 className="text-base font-semibold">Set a month&rsquo;s budget</h2>
      <FormError>{state.error}</FormError>
      {state.success ? (
        <p className="text-sm text-green-700">
          Budget saved. Saving the same group and month again replaces it.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FormSelectField
          control={control}
          name="revenueGroupUuid"
          id="revenueGroupUuid"
          label="Revenue group"
          options={groupOptions}
          emptyValue=""
          disabled={isPending}
          errorMessage={errors.revenueGroupUuid?.message}
        />
        <div className="space-y-2">
          <FormLabel htmlFor="budgetYear">Year</FormLabel>
          <Input
            id="budgetYear"
            type="number"
            {...register("year", { valueAsNumber: true })}
            disabled={isPending}
          />
          <FormFieldError message={errors.year?.message} />
        </div>
        <div className="space-y-2">
          <FormLabel htmlFor="budgetMonth">Month (1–12)</FormLabel>
          <Input
            id="budgetMonth"
            type="number"
            min={1}
            max={12}
            {...register("month", { valueAsNumber: true })}
            disabled={isPending}
          />
          <FormFieldError message={errors.month?.message} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {SPLITS.map((split) => (
          <fieldset
            key={split.label}
            className="space-y-3 rounded-md border border-border p-3"
          >
            <legend className="px-1 text-sm font-medium">{split.label}</legend>
            <div className="space-y-2">
              <FormLabel htmlFor={split.revenue}>Revenue (€)</FormLabel>
              <Input
                id={split.revenue}
                type="number"
                step="0.01"
                {...register(split.revenue, { valueAsNumber: true })}
                disabled={isPending}
              />
              <FormFieldError message={errors[split.revenue]?.message} />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor={split.weight}>Weight (kg)</FormLabel>
              <Input
                id={split.weight}
                type="number"
                step="0.01"
                {...register(split.weight, { valueAsNumber: true })}
                disabled={isPending}
              />
              <FormFieldError message={errors[split.weight]?.message} />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor={split.profit}>Profit %</FormLabel>
              <Input
                id={split.profit}
                type="number"
                step="0.01"
                {...register(split.profit, { valueAsNumber: true })}
                disabled={isPending}
              />
              <FormFieldError message={errors[split.profit]?.message} />
            </div>
          </fieldset>
        ))}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save budget"}
      </Button>
    </form>
  );
};
