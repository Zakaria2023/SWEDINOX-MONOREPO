"use client";

import { generateCertificates } from "@/app/(dashboard)/certificates-received/actions";
import { Button } from "@/components/shadcn/button";
import { pluralize } from "@/lib/helpers";
import { FileBadge } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export const GenerateCertificatesButton = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onClick = () =>
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await generateCertificates();
      if (result.error) {
        setError(result.error);
        return;
      }
      const created = result.createdCertificates ?? 0;
      setMessage(
        `Opened ${created} ${pluralize(created, "certificate")} to be linked.`,
      );
      router.refresh();
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" onClick={onClick} disabled={isPending}>
        <FileBadge className="mr-1.5 size-4" />
        {isPending ? "Opening…" : "Open certificates for batches"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
      {message && (
        <span className="text-xs text-muted-foreground">{message}</span>
      )}
    </div>
  );
};
