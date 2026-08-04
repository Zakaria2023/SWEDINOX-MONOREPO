"use client";

import { ProductGroupActionResult } from "@/app/(dashboard)/product-groups/actions";
import {
  ProductGroupFormValues,
  productGroupSchema,
} from "@/app/(dashboard)/product-groups/validation";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ReactNode, useState, useTransition } from "react";
import { FormProvider, Resolver, useForm } from "react-hook-form";

type Props = {
  productGroupUuid: string;
  defaultValues: ProductGroupFormValues;
  /** Writes only the columns this section owns. */
  save: (
    productGroupUuid: string,
    values: ProductGroupFormValues,
  ) => Promise<ProductGroupActionResult>;
  submitLabel?: string;
  children: ReactNode;
};

/**
 * The shell every product group section edits inside.
 *
 * The form carries the group's whole value set even though the section shows a
 * slice of it, so the section components can stay exactly as the create form
 * uses them. Saving still writes just this section's columns, which is what
 * lets two people edit stock policy and sales terms at the same time.
 */
export const ProductGroupSectionForm = ({
  productGroupUuid,
  defaultValues,
  save,
  submitLabel = "Save Changes",
  children,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ProductGroupActionResult>({});

  const form = useForm<ProductGroupFormValues>({
    resolver: zodResolver(productGroupSchema) as Resolver<ProductGroupFormValues>,
    defaultValues,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setState(await save(productGroupUuid, values));
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
          onCancel={() =>
            router.push(`/product-groups/${productGroupUuid}/edit`)
          }
        />
      </form>
    </FormProvider>
  );
};
