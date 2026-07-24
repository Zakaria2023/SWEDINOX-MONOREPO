"use client";

import {
  TextDialogValues,
  USAGE_CATEGORY_FIELDS,
} from "@/app/(dashboard)/companies/validation";
import { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Select } from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";
import { DialogFormFooter } from "@/components/ui/dialog-form-footer";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { TEXT_USAGE_CATEGORY_LABELS } from "@/lib/labels";
import { AlignLeft } from "lucide-react";
import { FormEventHandler } from "react";
import { Controller, UseFormReturn } from "react-hook-form";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSave: FormEventHandler<HTMLFormElement>;
  form: UseFormReturn<TextDialogValues>;
  textCategories: TextCategoryOption[];
  handleCategorySelect: (uuid: string) => void;
};

export const TextDialog = ({
  isOpen,
  onOpenChange,
  onCancel,
  onSave,
  form,
  textCategories,
  handleCategorySelect,
}: Props) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="flex h-[85dvh] max-w-5xl flex-col gap-0 p-0">
      <DialogHeader className="shrink-0 border-b bg-background px-6 py-5">
        <DialogTitle className="flex items-center gap-2">
          <AlignLeft className="size-4" />
          Add Text
        </DialogTitle>
        <DialogDescription>
          Select a category to auto-fill the usage checkboxes, then fill in the
          title and text block.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={onSave} className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 gap-0">
          <div className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r p-6">
            <div>
              <FormLabel htmlFor="txt-category" required>
                Text Category
              </FormLabel>
              <Controller
                name="textCategoryUuid"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id="txt-category"
                    options={[
                      { value: "", label: "Select" },
                      ...textCategories.map((c) => ({
                        value: c.uuid,
                        label: c.name,
                      })),
                    ]}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleCategorySelect(value);
                    }}
                    placeholder="Select"
                  />
                )}
              />
              <FormFieldError
                message={form.formState.errors.textCategoryUuid?.message}
              />
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto border-r p-6">
            <div className="flex flex-1 flex-col">
              <FormLabel htmlFor="txt-textBlock" required>
                Text Block
              </FormLabel>
              <Textarea
                id="txt-textBlock"
                {...form.register("textBlock")}
                className="mt-1 flex-1"
                placeholder="Enter the text content..."
                style={{ minHeight: "200px" }}
              />
              <FormFieldError
                message={form.formState.errors.textBlock?.message}
              />
            </div>
          </div>

          <div className="flex w-60 shrink-0 flex-col gap-1 overflow-y-auto p-6">
            <p className="mb-2 text-sm font-medium text-gray-700">
              Usage Categories
            </p>
            {USAGE_CATEGORY_FIELDS.map(({ key, field }) => (
              <Controller
                key={field}
                name={field}
                control={form.control}
                render={({ field: f }) => (
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/40">
                    <Checkbox
                      checked={!!f.value}
                      onChange={(e) => f.onChange(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">
                      {TEXT_USAGE_CATEGORY_LABELS[key]}
                    </span>
                  </label>
                )}
              />
            ))}
          </div>
        </div>

        <DialogFormFooter onCancel={onCancel} submitLabel="Add Text" />
      </form>
    </DialogContent>
  </Dialog>
);
