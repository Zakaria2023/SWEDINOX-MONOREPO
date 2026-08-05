"use client";

import {
  deleteCompanyText,
  saveCompanyText,
} from "@/app/(dashboard)/companies/[uuid]/edit/texts/actions";
import { textRowToDialogValues } from "@/app/(dashboard)/companies/[uuid]/edit/texts/mappers";
import {
  DEFAULT_TEXT,
  textDialogSchema,
  TextDialogValues,
  USAGE_CATEGORY_FIELDS,
} from "@/app/(dashboard)/companies/validation";
import { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import { TextDialog } from "@/components/companies/dialogs/text-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import { SelectTexts } from "@/db/schema/texts";
import { TEXT_USAGE_CATEGORY_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlignLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { RowAction } from "@/components/ui/row-action";

type Props = {
  companyUuid: string;
  texts: SelectTexts[];
  textCategories: TextCategoryOption[];
};

export const CompanyTextsEditor = ({
  companyUuid,
  texts,
  textCategories,
}: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SelectTexts | null>(null);

  const [saveState, dispatchSave, isSaving] = useActionState(
    saveCompanyText,
    {},
  );
  const [deleteState, dispatchDelete, isDeleting] = useActionState(
    deleteCompanyText,
    {},
  );

  const textForm = useForm<TextDialogValues>({
    resolver: zodResolver(textDialogSchema),
    defaultValues: DEFAULT_TEXT,
  });

  useEffect(() => {
    if (saveState.success) {
      setIsDialogOpen(false);
      setEditingUuid(null);
      textForm.reset(DEFAULT_TEXT);
    }
  }, [saveState, textForm]);

  useEffect(() => {
    if (deleteState.success) {
      setDeleteTarget(null);
    }
  }, [deleteState]);

  const handleOpenAdd = () => {
    textForm.reset(DEFAULT_TEXT);
    setEditingUuid(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (text: SelectTexts) => {
    textForm.reset(textRowToDialogValues(text));
    setEditingUuid(text.uuid);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      textForm.reset(DEFAULT_TEXT);
      setEditingUuid(null);
    }
    setIsDialogOpen(open);
  };

  const handleCancel = () => {
    handleDialogOpenChange(false);
  };

  // Picking a category pre-ticks the usage checkboxes it declares — same
  // behavior as the legacy handleCategorySelect.
  const handleCategorySelect = (uuid: string) => {
    textForm.setValue("textCategoryUuid", uuid);
    const category = textCategories.find((c) => c.uuid === uuid);
    if (category) {
      const enabled = new Set(category.usageCategoriesJson ?? []);
      USAGE_CATEGORY_FIELDS.forEach(({ key, field }) => {
        textForm.setValue(field, enabled.has(key));
      });
    }
  };

  const handleSave = textForm.handleSubmit((values) => {
    startTransition(() => {
      dispatchSave({ companyUuid, textUuid: editingUuid, values });
    });
  });

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      startTransition(() => {
        dispatchDelete({ companyUuid, textUuid: deleteTarget.uuid });
      });
    }
  };

  return (
    <div className="space-y-4">
      <FormError>{saveState.error ?? deleteState.error}</FormError>

      <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
        {texts.length === 0 && (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No texts yet — add the first one below.
          </p>
        )}
        {texts.map((text) => {
          const category = textCategories.find(
            (c) => c.uuid === text.textCategoryUuid,
          );
          return (
            <div
              key={text.uuid}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <AlignLeft className="size-4 shrink-0 text-muted-foreground" />
                <span className="line-clamp-1 font-medium text-foreground">
                  {text.title}
                </span>
                {category && (
                  <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    {category.name}
                  </span>
                )}
                {USAGE_CATEGORY_FIELDS.filter(({ field }) => text[field])
                  .slice(0, 3)
                  .map(({ key }) => (
                    <span
                      key={key}
                      className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                    >
                      {TEXT_USAGE_CATEGORY_LABELS[key]}
                    </span>
                  ))}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <RowAction
                  onClick={() => handleOpenEdit(text)}
                  label="Edit text"
                  tone="edit"
                  disabled={isSaving || isDeleting}
                >
                  <Pencil className="size-4" />
                </RowAction>
                <RowAction
                  onClick={() => setDeleteTarget(text)}
                  label="Delete text"
                  tone="danger"
                  disabled={isSaving || isDeleting}
                >
                  <Trash2 className="size-4" />
                </RowAction>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          disabled={isSaving || isDeleting}
        >
          <Plus className="size-4" />
          Add Text
        </button>
      </div>

      <TextDialog
        isOpen={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onCancel={handleCancel}
        onSave={handleSave}
        form={textForm}
        textCategories={textCategories}
        handleCategorySelect={handleCategorySelect}
        submitLabel={editingUuid ? "Save Changes" : "Add Text"}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete text"
        description={`Delete ${
          deleteTarget?.title || "this text"
        }? This can't be undone.`}
        confirmLabel="Delete"
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
