"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";

type Props = {
  textCategories: TextCategoryOption[];
};

const EMPTY_TEXT = {
  title: "",
  textCategoryUuid: "",
  textBlock: "",
};

export const TextsSection = ({ textCategories }: Props) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<CounterOrderFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "texts",
  });

  const categoryOptions = [
    { value: "", label: "Empty" },
    ...textCategories.map((category) => ({
      value: category.uuid,
      label: category.name,
    })),
  ];

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
        Texts
      </h2>
      <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
        {fields.map((item, index) => (
          <div
            key={item.id}
            className="space-y-3 rounded-xl border border-border bg-background p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Text {index + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove text"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <FormLabel htmlFor={`texts.${index}.title`} required>
                  Title
                </FormLabel>
                <Input
                  id={`texts.${index}.title`}
                  {...register(`texts.${index}.title`)}
                />
                <FormFieldError
                  message={errors.texts?.[index]?.title?.message}
                />
              </div>
              <FormSelectField
                control={control}
                id={`texts.${index}.textCategoryUuid`}
                name={`texts.${index}.textCategoryUuid`}
                label="Category"
                options={categoryOptions}
                emptyValue=""
              />
            </div>

            <div>
              <FormLabel htmlFor={`texts.${index}.textBlock`} required>
                Text
              </FormLabel>
              <Textarea
                id={`texts.${index}.textBlock`}
                rows={3}
                {...register(`texts.${index}.textBlock`)}
              />
              <FormFieldError
                message={errors.texts?.[index]?.textBlock?.message}
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => append(EMPTY_TEXT)}
          className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="size-4" />
          Add text
        </button>
      </div>
    </section>
  );
};
