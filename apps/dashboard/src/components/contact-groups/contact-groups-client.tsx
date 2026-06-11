"use client";

import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  createContactGroup,
  deleteContactGroup,
  updateContactGroup,
  type ContactGroupItem,
} from "@/app/(dashboard)/contact-groups/actions";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";

const createGroupSchema = (nameRequiredMessage: string) =>
  z.object({
    name: z.string().min(1, nameRequiredMessage),
    description: z.string().optional(),
    contractSubgroupUuid: z.string().optional(),
    sequenceWithinSubgroup: z.number().int().min(0),
    quicklyChangeSequenceNumber: z.string().optional(),
    isActive: z.boolean(),
  });

type GroupFormValues = z.infer<ReturnType<typeof createGroupSchema>>;

const DEFAULT_VALUES: GroupFormValues = {
  name: "",
  description: "",
  contractSubgroupUuid: "",
  sequenceWithinSubgroup: 0,
  quicklyChangeSequenceNumber: "",
  isActive: true,
};

type Props = { groups: ContactGroupItem[] };

export const ContactGroupsClient = ({ groups }: Props) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ContactGroupItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactGroupItem | null>(null);
  const [formError, setFormError] = useState<string | undefined>();

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(createGroupSchema(t("validation.name-required"))),
    defaultValues: DEFAULT_VALUES,
  });

  const { register, control, formState: { errors }, reset, handleSubmit } = form;
  const subgroupOptions = [
    { value: "", label: t("common.empty-option") },
    ...groups
      .filter((group) => group.uuid !== editTarget?.uuid)
      .map((group) => ({ value: group.uuid, label: group.name })),
  ];

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
      contractSubgroupUuid: group.contractSubgroupUuid ?? "",
      sequenceWithinSubgroup: group.sequenceWithinSubgroup ?? 0,
      quicklyChangeSequenceNumber: group.quicklyChangeSequenceNumber ?? "",
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
        ? await updateContactGroup(editTarget.uuid, {
            ...values,
            contractSubgroupUuid: values.contractSubgroupUuid || undefined,
            quicklyChangeSequenceNumber:
              values.quicklyChangeSequenceNumber || undefined,
          })
        : await createContactGroup({
            ...values,
            contractSubgroupUuid: values.contractSubgroupUuid || undefined,
            quicklyChangeSequenceNumber:
              values.quicklyChangeSequenceNumber || undefined,
          });

      if (result.success) {
        setDialogOpen(false);
        router.refresh();
        return;
      }

      setFormError(result.error);
    });
  });

  const handleDelete = () => {
    if (!deleteTarget) {
      return;
    }

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
        {t("contact-groups-client.status.active")}
      </span>
    ) : (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        {t("contact-groups-client.status.inactive")}
      </span>
    );

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button type="button" onClick={openCreate} className="gap-2">
            <Plus className="size-4" />
            {t("contact-groups-client.new-group")}
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("contact-groups-client.columns.id")}</TableHead>
                <TableHead>{t("contact-groups-client.columns.name")}</TableHead>
                <TableHead>{t("contact-groups-client.columns.subgroup")}</TableHead>
                <TableHead>{t("contact-groups-client.columns.status")}</TableHead>
                <TableHead>{t("contact-groups-client.columns.created-at")}</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {t("contact-groups-client.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.id}</TableCell>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {group.subgroupName ?? t("common.not-available")}
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
                          title={t("contact-groups-client.actions.edit")}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(group)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title={t("contact-groups-client.actions.delete")}
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

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget
                ? t("contact-groups-client.dialog.edit-title")
                : t("contact-groups-client.dialog.create-title")}
            </DialogTitle>
            <DialogDescription>
              {editTarget
                ? t("contact-groups-client.dialog.edit-description")
                : t("contact-groups-client.dialog.create-description")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="mt-2 space-y-4 px-6 pb-6">
            <div>
              <FormLabel htmlFor="name" required>
                {t("contact-groups-client.fields.name")}
              </FormLabel>
              <Input
                id="name"
                {...register("name")}
                aria-invalid={!!errors.name}
                placeholder={t("contact-groups-client.placeholders.name")}
                disabled={isPending}
              />
              <FormFieldError message={errors.name?.message} />
            </div>

            <div>
              <FormLabel htmlFor="contractSubgroupUuid">
                {t("contact-groups-client.fields.contract-subgroup")}
              </FormLabel>
              <Controller
                name="contractSubgroupUuid"
                control={control}
                render={({ field }) => (
                  <Select
                    id="contractSubgroupUuid"
                    options={subgroupOptions}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder={t("common.empty-option")}
                    disabled={isPending}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FormLabel htmlFor="sequenceWithinSubgroup">
                  {t("contact-groups-client.fields.sequence-within-subgroup")}
                </FormLabel>
                <Input
                  id="sequenceWithinSubgroup"
                  type="number"
                  min={0}
                  {...register("sequenceWithinSubgroup", { valueAsNumber: true })}
                  disabled={isPending}
                />
              </div>
              <div>
                <FormLabel htmlFor="quicklyChangeSequenceNumber">
                  {t("contact-groups-client.fields.quickly-change-sequence-number")}
                </FormLabel>
                <Input
                  id="quicklyChangeSequenceNumber"
                  {...register("quicklyChangeSequenceNumber")}
                  disabled={isPending}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40">
              <input
                type="checkbox"
                className="size-4 rounded border-border accent-primary"
                {...register("isActive")}
                disabled={isPending}
              />
              <span className="text-sm font-medium text-gray-700">
                {t("contact-groups-client.fields.is-active")}
              </span>
            </label>

            <FormError>{formError}</FormError>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogClose(false)}
                disabled={isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? t("common.saving")
                  : editTarget
                    ? t("contact-groups-client.save-changes")
                    : t("contact-groups-client.create-group")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title={t("contact-groups-client.delete-dialog.title")}
        description={t("contact-groups-client.delete-dialog.description", {
          name: deleteTarget?.name ?? "",
        })}
        confirmLabel={t("common.delete")}
        isPending={isPending}
        onConfirm={handleDelete}
      />
    </>
  );
};
