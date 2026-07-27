"use client";

import { resolveVisitReport } from "@/app/(dashboard)/visit-reports/actions";
import { Button } from "@/components/shadcn/button";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  uuid: string;
  hasTakenPlace: boolean;
};

export const ResolveVisitReportButton = ({ uuid, hasTakenPlace }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (hasTakenPlace) {
    return <span className="text-xs text-muted-foreground">Resolved</span>;
  }

  const onClick = () =>
    startTransition(async () => {
      setError(null);
      const result = await resolveVisitReport(uuid);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" size="sm" onClick={onClick} disabled={isPending}>
        <CheckCircle2 className="mr-1 size-3.5" />
        {isPending ? "Resolving…" : "Resolve"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
};
