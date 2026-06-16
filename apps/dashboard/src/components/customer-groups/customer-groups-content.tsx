"use client";

import { createCustomerGroup } from "@/app/(dashboard)/customer-groups/actions";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { SelectCustomerGroups } from "@/db";
import { COMMON_TEXT } from "@/lib/labels";
import { VALIDATION_MESSAGES } from "@/lib/validation-messages";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, VALIDATION_MESSAGES.nameRequired),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = { name: "" };

type Props = { groups: SelectCustomerGroups[] };

export const CustomerGroupsContent = ({ groups }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  const openCreate = () => {
    reset(DEFAULT_VALUES);
    setFormError(undefined);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      reset(DEFAULT_VALUES);
      setFormError(undefined);
    }
    setDialogOpen(open);
  };

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await createCustomerGroup(values);

      if (result.success) {
        setDialogOpen(false);
        router.refresh();
        return;
      }

      setFormError(result.error);
    });
  });

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button type="button" onClick={openCreate} className="gap-2">
            <Plus className="size-4" />
            New Customer Group
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No customer groups yet
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>
                      {new Date(group.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Customer Group</DialogTitle>
            <DialogDescription>
              Create a new group to assign to customers.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="mt-2 space-y-4 px-6 pb-6">
            <div>
              <FormLabel htmlFor="name" required>
                Name
              </FormLabel>
              <Input
                id="name"
                {...register("name")}
                aria-invalid={!!errors.name}
                placeholder="e.g. Premium"
                disabled={isPending}
              />
              <FormFieldError message={errors.name?.message} />
            </div>

            <FormError>{formError}</FormError>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogClose(false)}
                disabled={isPending}
              >
                {COMMON_TEXT.cancel}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? COMMON_TEXT.saving : "Create Group"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
