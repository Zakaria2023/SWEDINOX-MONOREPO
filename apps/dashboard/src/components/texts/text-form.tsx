"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import { useTextSubmit } from "@/app/(dashboard)/texts/use-text-submit";
import { Input } from "@/components/shadcn/input";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { buildTextCategorySelectOptions } from "@/components/text-categories/text-category-tree";
import { formatTextUsageCategoryLabel } from "@/components/texts/text-usage-category-label";
import { cn } from "@/lib/helpers";
import { textUsageCategories, type TextUsageCategory } from "@/lib/enums";

type TextFormProps = {
  categories: TextCategoryOption[];
};

export const TextForm = ({ categories }: TextFormProps) => {
  const router = useRouter();
  const { form, isPending, onSubmit, state } = useTextSubmit();
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (state.success) {
      router.push("/texts");
    }
  }, [router, state.success]);

  const selectedUsageCategories = watch("usageCategoriesJson") ?? [];
  const categoryOptions = buildTextCategorySelectOptions(categories);

  const toggleUsageCategory = (category: TextUsageCategory) => {
    setValue(
      "usageCategoriesJson",
      selectedUsageCategories.includes(category)
        ? selectedUsageCategories.filter((item) => item !== category)
        : [...selectedUsageCategories, category],
      { shouldValidate: true },
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          Text
        </h2>
        <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 md:grid-cols-2">
          <FormSelectField
            control={control}
            id="textCategoryUuid"
            name="textCategoryUuid"
            label="Text Category"
            options={categoryOptions}
            emptyValue=""
            disabled={isPending}
            errorMessage={errors.textCategoryUuid?.message}
          />

          <div>
            <FormLabel htmlFor="title" required>
              Title
            </FormLabel>
            <Input id="title" {...register("title")} disabled={isPending} />
            <FormFieldError message={errors.title?.message} />
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
            <FormLabel htmlFor="textBlock" required>
              Text Block
            </FormLabel>
            <textarea
              id="textBlock"
              {...register("textBlock")}
              rows={10}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
              disabled={isPending}
            />
            <FormFieldError message={errors.textBlock?.message} />
          </div>

          <div className="md:col-span-2">
            <FormLabel>Usage Categories</FormLabel>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {textUsageCategories.map((category) => {
                const isSelected = selectedUsageCategories.includes(category);

                return (
                  <label
                    key={category}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-colors",
                      isPending
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer hover:bg-muted/40",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="size-4 rounded border-border accent-primary"
                      checked={isSelected}
                      onChange={() => toggleUsageCategory(category)}
                      disabled={isPending}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {formatTextUsageCategoryLabel(category)}
                    </span>
                  </label>
                );
              })}
            </div>
            <FormFieldError message={errors.usageCategoriesJson?.message} />
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
        onCancel={() => router.push("/texts")}
        submitLabel="Create Text"
      />
    </form>
  );
};
