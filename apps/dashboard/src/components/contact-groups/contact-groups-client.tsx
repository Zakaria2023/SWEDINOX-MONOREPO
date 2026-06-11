"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { FormLabel, FormFieldError } from "@/components/ui/form-field";
import { FormError } from "@/components/ui/form-error";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  createContactGroup,
  updateContactGroup,
  deleteContactGroup,
  type ContactGroupItem,
} from "@/app/(dashboard)/contact-groups/actions";

const groupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type GroupFormValues = z.infer<typeof groupSchema>;

const DEFAULT_VALUES: GroupFormValues = {
  name: "",
  description: "",
  isActive: true,
};

type Props = { groups: ContactGroupItem[] };

export const ContactGroupsClient = ({ groups }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ContactGroupItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactGroupItem | null>(null);
  const [formError, setFormError] = useState<string | undefined>();

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { register, formState: { errors }, reset, handleSubmit } = form;

  const openCreate = () => {
    setEditTarget(null);
    reset(DEFAULT_VALUES);
    setFormError(undefined);
    setDialogOpen(true);
  };

  const openEdit = (group: ContactGroupItem) => {
    setEditTarget(group);
    reset({
      name: group.name,
      description: group.description ?? "",
      isActive: group.isActive ?? true,
    });
    setFormError(undefined);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      reset(DEFAULT_VALUES);
      setFormError(undefined);
      setEditTarget(null);
    }
    setDialogOpen(open);
  };

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = editTarget
        ? await updateContactGroup(editTarget.uuid, values)
        : await createContactGroup(values);

      if (result.success) {
        setDialogOpen(false);
        router.refresh();
      } else {
        setFormError(result.error);
      }
    });
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteContactGroup(deleteTarget.uuid);
      if (result.success) {
        setDeleteTarget(null);
        router.refresh();
      }
    });
  };

  const activeBadge = (value: boolean | null) =>
    value ? (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        Active
      </span>
    ) : (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        Inactive
      </span>
    );

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button type="button" onClick={openCreate} className="gap-2">
            <Plus className="size-4" />
            New Group
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No contact groups yet
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.id}</TableCell>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {group.description ?? "—"}
                    </TableCell>
                    <TableCell>{activeBadge(group.isActive)}</TableCell>
                    <TableCell>
                      {new Date(group.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(group)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(group)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Contact Group" : "New Contact Group"}
            </DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Update the name and description of this group."
                : "Create a new group that can be linked to contacts."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="mt-2 space-y-4 px-6 pb-6">
            <div>
              <FormLabel htmlFor="name" required>Name</FormLabel>
              <Input
                id="name"
                {...register("name")}
                aria-invalid={!!errors.name}
                placeholder="e.g. Procurement"
                disabled={isPending}
              />
              <FormFieldError message={errors.name?.message} />
            </div>

            <div>
              <FormLabel htmlFor="description">Description</FormLabel>
              <Input
                id="description"
                {...register("description")}
                placeholder="Optional description"
                disabled={isPending}
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40">
              <input
                type="checkbox"
                className="size-4 rounded border-border accent-primary"
                {...register("isActive")}
                disabled={isPending}
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>

            <FormError>{formError}</FormError>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogClose(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : editTarget ? "Save Changes" : "Create Group"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Contact Group"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will also remove it from all linked contacts.`}
        confirmLabel="Delete"
        isPending={isPending}
        onConfirm={handleDelete}
      />
    </>
  );
};
