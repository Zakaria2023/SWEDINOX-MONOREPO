"use client";

import { ReactNode, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import {
  createTextCategory,
  TextCategoryOption,
} from "@/app/(dashboard)/text-categories/actions";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";

type Props = {
  id: string;
  label?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  categories: TextCategoryOption[];
  /** Called with a category the dialog just made, so the caller can hold it. */
  onCreated: (category: TextCategoryOption) => void;
  errorMessage?: string;
  disabled?: boolean;
};

/**
 * Pick a text category, or make one on the spot.
 *
 * Categories have no screen of their own — they are only ever wanted while
 * writing a text, and sending somebody to a separate maintenance page to add
 * one, then back again to finish what they were typing, lost the text they had
 * started. So the list is a dropdown with a way to extend it.
 */
export const TextCategoryField = ({
  id,
  label = "Category",
  value,
  onChange,
  categories,
  onCreated,
  errorMessage,
  disabled,
}: Props) => {
  const [isOpen, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [parentUuid, setParentUuid] = useState("");
  const [formError, setFormError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  const options = [
    { value: "", label: "Empty" },
    ...categories.map((category) => ({
      value: category.uuid,
      label: category.name,
    })),
  ];

  const open = () => {
    setName("");
    setParentUuid("");
    setFormError(undefined);
    setOpen(true);
  };

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Give the category a name.");
      return;
    }

    startTransition(async () => {
      const result = await createTextCategory({
        name: trimmed,
        parentUuid: parentUuid || null,
        usageCategoriesJson: [],
        sequenceNumber: 0,
        isActive: true,
      });

      if (!result.success || !result.textCategoryUuid) {
        setFormError(result.error ?? "Could not create the category.");
        return;
      }

      // Handed back to the caller so every picker on the form sees it, then
      // selected here — the point of adding one was to use it.
      onCreated({
        uuid: result.textCategoryUuid,
        parentUuid: parentUuid || null,
        name: trimmed,
        sequenceNumber: 0,
        isActive: true,
        usageCategoriesJson: [],
      });
      onChange(result.textCategoryUuid);
      setOpen(false);
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <FormLabel htmlFor={id}>{label}</FormLabel>
        <button
          type="button"
          onClick={open}
          disabled={disabled}
          className="text-primary inline-flex items-center gap-1 text-xs hover:underline disabled:opacity-50"
        >
          <Plus className="size-3" />
          New
        </button>
      </div>
      <Select
        id={id}
        value={value}
        options={options}
        onValueChange={onChange}
        disabled={disabled}
      />
      <FormFieldError message={errorMessage} />

      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New text category</DialogTitle>
            <DialogDescription>
              It is available immediately, on this text and the next.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <div>
              <FormLabel htmlFor={`${id}-new-name`} required>
                Name
              </FormLabel>
              <Input
                id={`${id}-new-name`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isPending}
              />
            </div>
            <div>
              <FormLabel htmlFor={`${id}-new-parent`}>Parent</FormLabel>
              <Select
                id={`${id}-new-parent`}
                value={parentUuid}
                placeholder="No parent"
                options={options}
                onValueChange={setParentUuid}
                disabled={isPending}
              />
            </div>
            <FormError>{formError}</FormError>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={create} disabled={isPending}>
              {isPending ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
