"use client";

import { useState, useTransition } from "react";
import {
  makeOrderFinal,
  OrderActionResult,
  sendOrderConfirmation,
} from "@/app/(dashboard)/orders/actions";
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
  orderUuid: string;
  orderId: number;
  /**
   * `final` is `Make final`: the order is released and the dialog decides
   * whether the confirmation goes out with it. `send` is `Send…` on an order
   * that is already final.
   */
  mode: "final" | "send";
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * `Send order 102191` — what the reference asks when an order is made final
 * (21-9-2026): ⦿ `Don't send`, the default, against ⦿ `Immediately send the
 * following`, with e-mail, fax and Staalweb beneath it. Only e-mail is wired;
 * the other two are greyed, as nothing here sends a fax or talks to Staalweb.
 */
export const SendOrderDialog = ({
  orderUuid,
  orderId,
  mode,
  open,
  onOpenChange,
}: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [send, setSend] = useState(mode === "send");
  const [email, setEmail] = useState(true);

  const confirm = () => {
    setError(undefined);
    startTransition(async () => {
      const shouldMail = send && email;
      const result: OrderActionResult =
        mode === "final"
          ? await makeOrderFinal(orderUuid, shouldMail)
          : shouldMail
            ? await sendOrderConfirmation(orderUuid)
            : {};
      if (result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>
            {mode === "final" ? "Make final — " : ""}Send order {orderId}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {mode === "final" && (
            <p className="text-sm text-muted-foreground">
              Making the order final releases it and raises its picking and
              transport work orders.
            </p>
          )}
          <div className="space-y-2 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                checked={!send}
                onChange={() => setSend(false)}
              />
              Don&apos;t send
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                checked={send}
                onChange={() => setSend(true)}
              />
              Immediately send the following
            </label>
          </div>

          <div className="space-y-2 rounded-lg border p-3 text-sm">
            <label
              className={
                send
                  ? "flex cursor-pointer items-center gap-2"
                  : "flex items-center gap-2 text-muted-foreground"
              }
            >
              <Checkbox
                checked={email}
                disabled={!send}
                onChange={(event) => setEmail(event.target.checked)}
              />
              E-mail the order confirmation to the customer
            </label>
            <label className="flex items-center gap-2 text-muted-foreground">
              <Checkbox disabled />
              Fax
            </label>
            <label className="flex items-center gap-2 text-muted-foreground">
              <Checkbox disabled />
              Send message via StaalWeb
            </label>
          </div>

          <FormError>{error}</FormError>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={confirm} disabled={isPending}>
            {isPending ? "Working…" : "OK"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
