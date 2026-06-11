"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/shadcn/button";

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
  const { t } = useTranslation();

  return (
    <div className="flex gap-3 pb-6">
      <Button type="submit" disabled={isPending}>
        {isPending ? pendingLabel ?? t("form-actions.pending") : submitLabel}
      </Button>
      <Button type="button" variant="outline" onClick={onCancel}>
        {cancelLabel ?? t("form-actions.cancel")}
      </Button>
    </div>
  );
};
