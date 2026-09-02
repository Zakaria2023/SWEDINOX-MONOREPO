"use client";

import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { TextCategoryField } from "@/components/text-categories/text-category-field";

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

  // A category added from any row is held here, so the rest of the rows on
  // this form can use it too without a round trip.
  const [added, setAdded] = useState<TextCategoryOption[]>([]);
  const categories = [...textCategories, ...added];

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
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
              <Controller
                control={control}
                name={`texts.${index}.textCategoryUuid`}
                render={({ field }) => (
                  <TextCategoryField
                    id={`texts.${index}.textCategoryUuid`}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    categories={categories}
                    onCreated={(category) =>
                      setAdded((prev) => [...prev, category])
                    }
                  />
                )}
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
