import { PropsWithChildren } from "react";

export const FormError = ({ children }: PropsWithChildren) => {
  if (children) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
        <p className="text-sm text-red-600">{children}</p>
      </div>
    );
  }
};
