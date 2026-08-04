"use client";

import { MachineActionResult } from "@/app/(dashboard)/machines/actions";
import {
  createMachineSchema,
  MachineFormValues,
} from "@/app/(dashboard)/machines/validation";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ReactNode, useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";

type Props = {
  machineUuid: string;
  defaultValues: MachineFormValues;
  /** Writes only the columns this section owns. */
  save: (
    machineUuid: string,
    values: MachineFormValues,
  ) => Promise<MachineActionResult>;
  children: ReactNode;
};

/**
 * The shell every machine section edits inside.
 *
 * The form carries the machine's whole value set even though the section shows
 * a slice of it, because the machine's rules span sections — a maximum length
 * is only wrong next to its minimum, and a capacity figure is only incomplete
 * without its unit. Saving still writes just this section's columns, so two
 * people editing different sections can't overwrite each other.
 */
export const MachineSectionForm = ({
  machineUuid,
  defaultValues,
  save,
  children,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<MachineActionResult>({});

  const form = useForm<MachineFormValues>({
    resolver: zodResolver(createMachineSchema()),
    defaultValues,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setState(await save(machineUuid, values));
    });
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        {state.error && <FormError>{state.error}</FormError>}

        {children}

        <FormActions
          submitLabel="Save Changes"
          isPending={isPending}
          onCancel={() => router.push(`/machines/${machineUuid}/edit`)}
        />
      </form>
    </FormProvider>
  );
};
