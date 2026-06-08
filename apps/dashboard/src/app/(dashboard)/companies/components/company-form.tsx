"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { useCompanySubmit } from "../hooks/use-company-submit";

type LabelProps = {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
};

type FieldErrorProps = {
  message?: string;
};

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
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          Company Info
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

          <div className="rounded-xl border border-dashed border-border bg-background/80 p-4">
            <h3 className="text-sm font-medium text-foreground">
              UUID Handling
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              A company UUID will be generated automatically when the company is
              created. You can copy it later from the companies table and use it
              when creating addresses.
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
