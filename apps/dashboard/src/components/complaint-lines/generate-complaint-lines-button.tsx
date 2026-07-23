"use client";

import { generateComplaintLines } from "@/app/(dashboard)/complaint-lines/actions";
import { Button } from "@/components/shadcn/button";
import { pluralize } from "@/lib/helpers";
import { ListChecks } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export const GenerateComplaintLinesButton = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onClick = () =>
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await generateComplaintLines();
      if (result.error) {
        setError(result.error);
        return;
      }
      const created = result.createdLines ?? 0;
      setMessage(`Created ${created} complaint ${pluralize(created, "line")}.`);
      router.refresh();
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" onClick={onClick} disabled={isPending}>
        <ListChecks className="mr-1.5 size-4" />
        {isPending ? "Generating…" : "Generate from complaints"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
      {message && (
        <span className="text-xs text-muted-foreground">{message}</span>
      )}
    </div>
  );
};
