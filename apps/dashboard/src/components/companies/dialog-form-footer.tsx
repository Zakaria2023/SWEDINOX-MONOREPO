import { Button } from "@/components/shadcn/button";
import { COMMON_TEXT } from "@/lib/labels";

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
        {COMMON_TEXT.cancel}
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
