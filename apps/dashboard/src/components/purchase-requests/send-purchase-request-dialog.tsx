"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Printer } from "lucide-react";
import Link from "next/link";
import {
  PurchaseRequestDetail,
  sendPurchaseRequest,
} from "@/app/(dashboard)/purchase-requests/actions";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { FormError } from "@/components/ui/form-error";

type Props = {
  request: PurchaseRequestDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * `Send Purchase request 800010` — what the reference asks the moment a
 * request is made final (12-10-2026): ⦿ `Don't send` / ⦿ `Immediately send
 * the following`, then `E-mail to <address> (<contact>)` ticked, `Fax to` and
 * `Send message via StaalWeb` greyed, then `Open with mail program`, `OK` and
 * `Cancel`. The purchase return's dialog, field for field.
 *
 * 🔴 Nothing goes out until `OK` is pressed with sending chosen.
 */
export const SendPurchaseRequestDialog = ({
  request,
  open,
  onOpenChange,
}: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [mode, setMode] = useState<"none" | "send">("send");
  const [email, setEmail] = useState(true);

  const contactName = [request.contactFirstName, request.contactLastName]
    .filter(Boolean)
    .join(" ");
  const address = request.contactEmail;
  const fax = request.contactFax;
  const subject = `Purchase request ${request.id}`;
  const previewHref = `/purchase-requests/${request.uuid}/print`;

  const confirm = () => {
    if (mode === "none" || !address || !email) {
      onOpenChange(false);
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await sendPurchaseRequest(request.uuid);
      if (result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Purchase request {request.id}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="space-y-2 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                checked={mode === "none"}
                onChange={() => setMode("none")}
              />
              Don&apos;t send
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                checked={mode === "send"}
                onChange={() => setMode("send")}
              />
              Immediately send the following
            </label>
          </div>

          <div className="space-y-2 rounded-lg border p-3 text-sm">
            <label
              className={
                address && mode === "send"
                  ? "flex cursor-pointer items-center gap-2"
                  : "flex items-center gap-2 text-muted-foreground"
              }
            >
              <Checkbox
                checked={!!address && email}
                disabled={!address || mode !== "send"}
                onChange={(event) => setEmail(event.target.checked)}
              />
              E-mail to {address ?? "—"}
              {contactName ? ` (${contactName})` : ""}
            </label>
            {/* Greyed as on the reference: no fax is sent from here, and
                StaalWeb is not connected. */}
            <label className="flex items-center gap-2 text-muted-foreground">
              <Checkbox disabled />
              Fax to {fax ?? "—"}
            </label>
            <label className="flex items-center gap-2 text-muted-foreground">
              <Checkbox disabled />
              Send message via StaalWeb
            </label>
          </div>

          <p className="text-xs text-muted-foreground">
            The document opened in a new tab when the request was made final;{" "}
            <Link
              href={previewHref}
              target="_blank"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Printer className="size-3" /> open it again
            </Link>
            .
          </p>

          <FormError>{error}</FormError>
        </DialogBody>
        <DialogFooter className="justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={!address}
            nativeButton={false}
            render={
              <a
                href={`mailto:${address ?? ""}?subject=${encodeURIComponent(subject)}`}
              />
            }
          >
            <ExternalLink className="size-4" /> Open with mail program
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={confirm} disabled={isPending}>
              {isPending ? "Sending…" : "OK"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
