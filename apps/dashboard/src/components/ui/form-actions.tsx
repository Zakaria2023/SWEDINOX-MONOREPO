import { Button } from "@/components/shadcn/button";

type FormActionsProps = {
  cancelLabel?: string;
  isPending?: boolean;
  onCancel: () => void;
  pendingLabel?: string;
  submitLabel: string;
};

export const FormActions = ({
  cancelLabel = "Cancel",
  isPending = false,
  onCancel,
  pendingLabel = "Saving...",
  submitLabel,
}: FormActionsProps) => (
  <div className="flex gap-3 pb-6">
    <Button type="submit" disabled={isPending}>
      {isPending ? pendingLabel : submitLabel}
    </Button>
    <Button type="button" variant="outline" onClick={onCancel}>
      {cancelLabel}
    </Button>
  </div>
);
