"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useFormState } from "react-hook-form";
import {
  BadgeCheck,
  Building2,
  Copy,
  Mail,
  Printer,
  ReceiptText,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  Tags,
  Trash2,
} from "lucide-react";
import {
  convertQuote,
  deleteQuote,
  finalizeQuote,
  QuoteActionResult,
  QuoteDetail,
} from "@/app/(dashboard)/quotes/actions";
import { Button } from "@/components/shadcn/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";

const SAVE_FIRST = "Save the quote first";
const SAVE_CHANGES_FIRST = "Save your changes first";
const NOT_BUILT = "Not built yet";

type Props = {
  /** The saved quote; null while a new one is typed. */
  quote: QuoteDetail | null;
};

type PendingConfirm = "order" | "delete" | null;

/**
 * The reference's toolbar on a sales quote: `Finalize · Print… · Send… ·
 * Order · Show company · Show order · Copy · Options… · Prices… · Counter
 * order` (#395-397), greyed by the quote's status — a provisional quote can be
 * finalized, a released one turned into an order, an expired one only printed,
 * copied and its company opened. Actions this app does not have yet stay on
 * the bar, greyed, rather than disappear. Every button waits for the quote to
 * be saved, and Finalize and Order wait for unsaved edits to be saved too.
 */
export const QuoteToolbar = ({ quote }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [confirm, setConfirm] = useState<PendingConfirm>(null);
  // Finalize and Order act on the quote as saved, so unsaved edits wait.
  const { isDirty } = useFormState();

  const isSaved = quote !== null;
  const isProvisional = quote?.status === "provisional";
  const isReleased = quote?.status === "released";
  const convertedOrderUuid =
    quote?.items.find((item) => item.convertedToOrderUuid)
      ?.convertedToOrderUuid ?? null;
  const printHref = quote ? `/quotes/${quote.uuid}/print` : null;

  const run = (
    action: () => Promise<QuoteActionResult>,
    onSuccess?: () => void,
  ) => {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      setConfirm(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      onSuccess?.();
    });
  };

  return (
    <div className="space-y-2 border-b pb-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => {
            if (!quote || !printHref) {
              return;
            }
            run(
              () => finalizeQuote(quote.uuid),
              // The reference prints the quote it releases.
              () => window.open(printHref, "_blank"),
            );
          }}
          disabled={!isSaved || !isProvisional || isDirty || isPending}
          title={
            isSaved ? (isDirty ? SAVE_CHANGES_FIRST : undefined) : SAVE_FIRST
          }
        >
          <BadgeCheck className="me-1.5 size-4" />
          Finalize
        </Button>
        {printHref ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={printHref} target="_blank" />}
          >
            <Printer className="me-1.5 size-4" />
            Print…
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled title={SAVE_FIRST}>
            <Printer className="me-1.5 size-4" />
            Print…
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          disabled
          title={isSaved ? NOT_BUILT : SAVE_FIRST}
        >
          <Mail className="me-1.5 size-4" />
          Send…
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirm("order")}
          disabled={
            !isReleased ||
            convertedOrderUuid !== null ||
            (quote?.items.length ?? 0) === 0 ||
            isDirty ||
            isPending
          }
          title={
            !isSaved
              ? SAVE_FIRST
              : isDirty
                ? SAVE_CHANGES_FIRST
                : isReleased
                  ? undefined
                  : "Finalize the quote first"
          }
        >
          <ShoppingCart className="me-1.5 size-4" />
          Order
        </Button>
        {quote ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/companies/${quote.companyUuid}`} />}
          >
            <Building2 className="me-1.5 size-4" />
            Show company
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled title={SAVE_FIRST}>
            <Building2 className="me-1.5 size-4" />
            Show company
          </Button>
        )}
        {convertedOrderUuid ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/orders/${convertedOrderUuid}`} />}
          >
            <ReceiptText className="me-1.5 size-4" />
            Show order
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled>
            <ReceiptText className="me-1.5 size-4" />
            Show order
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          disabled
          title={isSaved ? NOT_BUILT : SAVE_FIRST}
        >
          <Copy className="me-1.5 size-4" />
          Copy
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled
          title={isSaved ? NOT_BUILT : SAVE_FIRST}
        >
          <SlidersHorizontal className="me-1.5 size-4" />
          Options…
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled
          title={isSaved ? NOT_BUILT : SAVE_FIRST}
        >
          <Tags className="me-1.5 size-4" />
          Prices…
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled
          title={isSaved ? NOT_BUILT : SAVE_FIRST}
        >
          <Store className="me-1.5 size-4" />
          Counter order
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirm("delete")}
          disabled={!isSaved || convertedOrderUuid !== null || isPending}
          title={isSaved ? undefined : SAVE_FIRST}
        >
          <Trash2 className="me-1.5 size-4 text-destructive" />
          Delete
        </Button>
      </div>
      <FormError>{error}</FormError>

      {quote && (
        <>
          <ConfirmDialog
            open={confirm === "order"}
            onOpenChange={(open) => setConfirm(open ? "order" : null)}
            onConfirm={() => run(() => convertQuote(quote.uuid))}
            isPending={isPending}
            title="Turn this quote into an order"
            description="Creates a sales order at the quoted prices, priced as of the quote date, and reserves stock for every line. The quote is then marked Converted."
            confirmLabel="Create order"
          />
          <ConfirmDialog
            open={confirm === "delete"}
            onOpenChange={(open) => setConfirm(open ? "delete" : null)}
            onConfirm={() => run(() => deleteQuote(quote.uuid))}
            isPending={isPending}
            title="Delete quote"
            description="This removes the quote and all of its lines. This cannot be undone."
            confirmLabel="Delete Quote"
          />
        </>
      )}
    </div>
  );
};
