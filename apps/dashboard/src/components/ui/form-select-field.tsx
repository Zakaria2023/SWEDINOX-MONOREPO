"use client";

import { ReactNode } from "react";
import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";
import { Select, SelectOption } from "@/components/shadcn/select";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";

type FormSelectFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues, unknown, TFieldValues>;
  disabled?: boolean;
  emptyValue?: string;
  errorMessage?: string;
  id: string;
  invalid?: boolean;
  label: ReactNode;
  name: FieldPath<TFieldValues>;
  onValueChange?: (
    value: string,
    fieldOnChange: (value: string) => void,
  ) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
};

export const FormSelectField = <TFieldValues extends FieldValues>({
  control,
  disabled,
  emptyValue,
  errorMessage,
  id,
  invalid,
  label,
  name,
  onValueChange,
  options,
  placeholder,
  required,
}: FormSelectFieldProps<TFieldValues>) => (
  <div>
    <FormLabel htmlFor={id} required={required}>
      {label}
    </FormLabel>
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select
          id={id}
          name={field.name}
          value={
            field.value === undefined ||
            field.value === null ||
            field.value === ""
              ? emptyValue
              : String(field.value)
          }
          options={options}
          placeholder={placeholder}
          invalid={invalid}
          disabled={disabled}
          onValueChange={(value) => {
            const nextValue =
              emptyValue !== undefined && value === emptyValue ? "" : value;

            if (onValueChange) {
              onValueChange(nextValue, field.onChange);
              return;
            }

            field.onChange(nextValue);
          }}
        />
      )}
    />
    <FormFieldError message={errorMessage} />
  </div>
);
