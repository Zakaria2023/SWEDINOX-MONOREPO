"use client";

import { Button } from "@/components/shadcn/button";
import { COMMON_TEXT } from "@/lib/labels";

type FormActionsProps = {
  cancelLabel?: string;
  isPending?: boolean;
  onCancel: () => void;
  pendingLabel?: string;
  submitLabel: string;
};

export const FormActions = ({
  cancelLabel,
  isPending = false,
  onCancel,
  pendingLabel,
  submitLabel,
}: FormActionsProps) => {
  return (
    <div className="flex gap-3 pb-6">
      <Button type="submit" disabled={isPending}>
        {isPending ? pendingLabel ?? COMMON_TEXT.saving : submitLabel}
      </Button>
      <Button type="button" variant="outline" onClick={onCancel}>
        {cancelLabel ?? COMMON_TEXT.cancel}
      </Button>
    </div>
  );
};
