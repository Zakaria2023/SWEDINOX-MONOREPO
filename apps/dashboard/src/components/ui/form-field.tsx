import type { ReactNode } from "react";

type FormLabelProps = {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
};

type FormFieldErrorProps = {
  message?: string;
};

export const FormLabel = ({
  children,
  htmlFor,
  required,
}: FormLabelProps) => (
  <label
    htmlFor={htmlFor}
    className="mb-1 block text-sm font-medium text-gray-700"
  >
    {children}
    {required && <span className="ml-1 text-red-500">*</span>}
  </label>
);

export const FormFieldError = ({ message }: FormFieldErrorProps) =>
  message ? <p className="mt-1 text-sm text-red-600">{message}</p> : null;
