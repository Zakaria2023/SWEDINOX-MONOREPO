"use client";

import { CompanyFormValues } from "@/app/(dashboard)/companies/validation";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { useFormContext } from "react-hook-form";

type Props = {
  isPending: boolean;
};

export const SearchCodesSection = ({ isPending }: Props) => {
  const { register } = useFormContext<CompanyFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
        Search Codes
      </h2>
      <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-3">
        <div>
          <FormLabel htmlFor="searchCode1">Search Code</FormLabel>
          <Input
            id="searchCode1"
            {...register("searchCode1")}
            disabled={isPending}
          />
        </div>
        <div>
          <FormLabel htmlFor="searchCode2">Search Code</FormLabel>
          <Input
            id="searchCode2"
            {...register("searchCode2")}
            disabled={isPending}
          />
        </div>
        <div>
          <FormLabel htmlFor="searchCode3">Search Code</FormLabel>
          <Input
            id="searchCode3"
            {...register("searchCode3")}
            disabled={isPending}
          />
        </div>
      </div>
    </section>
  );
};
