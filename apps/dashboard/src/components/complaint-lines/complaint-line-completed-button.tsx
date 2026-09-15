"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setComplaintLineCompleted } from "@/app/(dashboard)/complaint-lines/actions";
import { Button } from "@/components/shadcn/button";

type Props = {
  lineUuid: string;
  completed: boolean;
};

// Tick one line of a complaint off, or reopen it.
export const ComplaintLineCompletedButton = ({ lineUuid, completed }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () =>
    startTransition(async () => {
      const result = await setComplaintLineCompleted(lineUuid, !completed);
      setError(result.error ?? null);
      router.refresh();
    });

  return (
    <div className="space-y-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={handleToggle}
      >
        {isPending
          ? "Saving..."
          : completed
            ? "Reopen line"
            : "Mark line completed"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
};
