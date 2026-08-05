"use client";

import { WarehouseActionResult } from "@/app/(dashboard)/warehouses/actions";
import {
  createWarehouseSchema,
  WarehouseFormValues,
} from "@/app/(dashboard)/warehouses/validation";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ReactNode, useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";

type Props = {
  warehouseUuid: string;
  defaultValues: WarehouseFormValues;
  /** Writes only the columns this section owns. */
  save: (
    warehouseUuid: string,
    values: WarehouseFormValues,
  ) => Promise<WarehouseActionResult>;
  submitLabel?: string;
  children: ReactNode;
};

/** The shell every warehouse section edits inside. */
export const WarehouseSectionForm = ({
  warehouseUuid,
  defaultValues,
  save,
  submitLabel = "Save Changes",
  children,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<WarehouseActionResult>({});

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(createWarehouseSchema()),
    defaultValues,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setState(await save(warehouseUuid, values));
    });
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        {state.error && <FormError>{state.error}</FormError>}

        {children}

        <FormActions
          submitLabel={submitLabel}
          isPending={isPending}
          onCancel={() => router.push(`/warehouses/${warehouseUuid}/edit`)}
        />
      </form>
    </FormProvider>
  );
};
