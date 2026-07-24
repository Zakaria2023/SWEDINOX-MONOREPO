import { Button } from "@/components/shadcn/button";

type Props = {
  onCancel: () => void;
  submitLabel: string;
  onSubmit?: () => void;
};

export const DialogFormFooter = ({
  onCancel,
  submitLabel,
  onSubmit,
}: Props) => (
  <div className="shrink-0 border-t bg-background px-6 py-4">
    <div className="flex justify-end gap-3">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      {onSubmit ? (
        <Button type="button" onClick={onSubmit}>
          {submitLabel}
        </Button>
      ) : (
        <Button type="submit">{submitLabel}</Button>
      )}
    </div>
  </div>
);
