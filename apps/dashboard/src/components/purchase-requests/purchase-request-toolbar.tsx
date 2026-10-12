"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  BadgeCheck,
  Building2,
  ClipboardList,
  Copy,
  FileQuestion,
  LucideIcon,
  Mail,
  Printer,
  Settings2,
  ShoppingCart,
  Warehouse,
} from "lucide-react";
import {
  makePurchaseRequestFinal,
  PurchaseRequestDetail,
} from "@/app/(dashboard)/purchase-requests/actions";
import { Button } from "@/components/shadcn/button";
import { FormError } from "@/components/ui/form-error";
import { isPurchaseRequestEditable } from "@/lib/helpers";

const SAVE_FIRST = "Save the purchase request first";
const SAVE_CHANGES_FIRST = "Save your changes first";
const NOT_BUILT = "Not built yet";

type Props = {
  /** The saved request; null on a new one. */
  existing: PurchaseRequestDetail | null;
  isPending: boolean;
  /** Unsaved edits on the screen, which `Make final` would not see. */
  isDirty: boolean;
  onPurchaseQuote: () => void;
  onPurchaseOrder: () => void;
};

type GreyedButtonProps = {
  label: string;
  title: string;
  icon: LucideIcon;
};

const GreyedButton = ({ label, title, icon: Icon }: GreyedButtonProps) => (
  <Button type="button" variant="outline" disabled title={title}>
    <Icon className="me-1.5 size-4" />
    {label}
  </Button>
);

/**
 * The reference's toolbar on a purchase request: `Make final · Print… · Send…
 * · Purchase quote · Purchase order · Show company · Copy · Options… · Order
 * lines · Stock on location` (blank request, 11-10-2026).
 *
 * On a new request only `Make final`, `Order lines` and `Stock on location`
 * are awake, and `Make final` saves the request, the way the reference's does
 * on a blank one. On a saved draft `Make final` takes it out of draft and is
 * then gone from the toolbar, as on a return. `Purchase quote` asks suppliers
 * and `Purchase order` orders outright, each in its own window, until the
 * request is awarded or cancelled.
 */
export const PurchaseRequestToolbar = ({
  existing,
  isPending,
  isDirty,
  onPurchaseQuote,
  onPurchaseOrder,
}: Props) => {
  const [isFinalising, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const companyHref = existing?.companyUuid
    ? `/companies/${existing.companyUuid}`
    : null;
  const isDraft = existing?.status === "draft";
  const canAnswer =
    existing !== null &&
    !isDraft &&
    isPurchaseRequestEditable(existing.status);
  const closedTitle = isDraft
    ? "Make the request final first"
    : existing?.status === "cancelled"
      ? "This request is cancelled"
      : "This request has already been awarded";

  const makeFinal = () => {
    if (!existing) {
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await makePurchaseRequestFinal(existing.uuid);
      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-2 border-b pb-4">
      <div className="flex flex-wrap gap-2">
        {!existing && (
          <Button type="submit" disabled={isPending}>
            <BadgeCheck className="me-1.5 size-4" />
            Make final
          </Button>
        )}
        {isDraft && (
          <Button
            type="button"
            onClick={makeFinal}
            disabled={isPending || isFinalising || isDirty}
            title={isDirty ? SAVE_CHANGES_FIRST : undefined}
          >
            <BadgeCheck className="me-1.5 size-4" />
            {isFinalising ? "Making final…" : "Make final"}
          </Button>
        )}
        <GreyedButton
          label="Print…"
          title={existing ? NOT_BUILT : SAVE_FIRST}
          icon={Printer}
        />
        <GreyedButton
          label="Send…"
          title={existing ? NOT_BUILT : SAVE_FIRST}
          icon={Mail}
        />
        <Button
          type="button"
          variant="outline"
          onClick={onPurchaseQuote}
          disabled={!canAnswer || isPending}
          title={existing ? (canAnswer ? undefined : closedTitle) : SAVE_FIRST}
        >
          <FileQuestion className="me-1.5 size-4" />
          Purchase quote
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onPurchaseOrder}
          disabled={!canAnswer || isPending}
          title={existing ? (canAnswer ? undefined : closedTitle) : SAVE_FIRST}
        >
          <ShoppingCart className="me-1.5 size-4" />
          Purchase order
        </Button>
        {companyHref ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={companyHref} />}
          >
            <Building2 className="me-1.5 size-4" />
            Show company
          </Button>
        ) : (
          <GreyedButton
            label="Show company"
            title={existing ? "No supplier on this request" : SAVE_FIRST}
            icon={Building2}
          />
        )}
        <GreyedButton
          label="Copy"
          title={existing ? NOT_BUILT : SAVE_FIRST}
          icon={Copy}
        />
        <GreyedButton
          label="Options…"
          title={existing ? NOT_BUILT : SAVE_FIRST}
          icon={Settings2}
        />
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/purchase-lines" />}
        >
          <ClipboardList className="me-1.5 size-4" />
          Order lines
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/stock-on-location" />}
        >
          <Warehouse className="me-1.5 size-4" />
          Stock on location
        </Button>
      </div>
      <FormError>{error}</FormError>
    </div>
  );
};
