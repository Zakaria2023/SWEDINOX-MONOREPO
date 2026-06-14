"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import { useTextCategorySubmit } from "@/app/(dashboard)/text-categories/use-text-category-submit";
import { Input } from "@/components/shadcn/input";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { buildTextCategorySelectOptions } from "@/components/text-categories/text-category-tree";

type TextCategoryFormProps = {
  categories: TextCategoryOption[];
};

export const TextCategoryForm = ({ categories }: TextCategoryFormProps) => {
  const router = useRouter();
  const { form, isPending, onSubmit, state } = useTextCategorySubmit();
  const {
    control,
    register,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (state.success) {
      router.push("/text-categories");
    }
  }, [router, state.success]);

  const categoryOptions = buildTextCategorySelectOptions(categories);

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          Text Category
        </h2>
        <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 md:grid-cols-2">
          <FormSelectField
            control={control}
            id="parentUuid"
            name="parentUuid"
            label="Parent Category"
            options={categoryOptions}
            emptyValue=""
            disabled={isPending}
            errorMessage={errors.parentUuid?.message}
          />

          <div>
            <FormLabel htmlFor="name" required>
              Name
            </FormLabel>
            <Input id="name" {...register("name")} disabled={isPending} />
            <FormFieldError message={errors.name?.message} />
          </div>

          <div>
            <FormLabel htmlFor="sequenceNumber">Sequence Number</FormLabel>
            <Input
              id="sequenceNumber"
              type="number"
              min={0}
              {...register("sequenceNumber")}
              disabled={isPending}
            />
            <FormFieldError message={errors.sequenceNumber?.message} />
          </div>

          <div className="md:col-span-2">
            <FormLabel htmlFor="description">Description</FormLabel>
            <textarea
              id="description"
              {...register("description")}
              rows={5}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
              disabled={isPending}
            />
            <FormFieldError message={errors.description?.message} />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
              <input
                type="checkbox"
                className="size-4 rounded border-border accent-primary"
                {...register("isActive")}
                disabled={isPending}
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>
        </div>
      </section>

      <FormError>{state.error}</FormError>

      <FormActions
        isPending={isPending}
        onCancel={() => router.push("/text-categories")}
        submitLabel="Create Text Category"
      />
    </form>
  );
};
