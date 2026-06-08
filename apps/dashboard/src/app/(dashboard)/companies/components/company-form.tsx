"use client";

import type { ReactNode } from "react";
import { Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  type SelectOption,
} from "@/components/shadcn/select";
import { useCompanySubmit } from "../hooks/use-company-submit";

type LabelProps = {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
};

type FieldErrorProps = {
  message?: string;
};

const ADDRESS_ACTION_OPTIONS: SelectOption[] = [
  { label: "Create later", value: "none" },
  { label: "Open address page after save", value: "add_address" },
];

const Label = ({ children, htmlFor, required }: LabelProps) => (
  <label
    htmlFor={htmlFor}
    className="mb-1 block text-sm font-medium text-gray-700"
  >
    {children}
    {required && <span className="ml-1 text-red-500">*</span>}
  </label>
);

const FieldError = ({ message }: FieldErrorProps) =>
  message ? <p className="mt-1 text-sm text-red-600">{message}</p> : null;

export const CompanyForm = () => {
  const router = useRouter();
  const { form, isPending, onSubmit, state } = useCompanySubmit();
  const {
    control,
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          Company Details
        </h2>
        <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Label htmlFor="companyName" required>
              Company Name
            </Label>
            <Input
              id="companyName"
              {...register("companyName")}
              aria-invalid={!!errors.companyName}
              placeholder="Enter the company name"
            />
            <FieldError message={errors.companyName?.message} />
          </div>

          <div>
            <Label htmlFor="addressAction">Address Setup</Label>
            <Controller
              control={control}
              name="addressAction"
              render={({ field }) => (
                <Select
                  id="addressAction"
                  name={field.name}
                  value={field.value}
                  options={ADDRESS_ACTION_OPTIONS}
                  onValueChange={field.onChange}
                />
              )}
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Choose whether to open the separate address page after this
              company is saved.
            </p>
          </div>
        </div>
      </section>

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{state.error}</p>
        </div>
      )}

      <div className="flex gap-3 pb-6">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Create Company"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/companies")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
