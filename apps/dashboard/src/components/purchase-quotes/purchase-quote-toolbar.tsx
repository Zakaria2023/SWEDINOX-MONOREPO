"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Building2,
  ClipboardList,
  Files,
  LucideIcon,
  PackageOpen,
  Printer,
  Settings2,
  ShoppingCart,
  Truck,
  Warehouse,
} from "lucide-react";
import {
  convertPurchaseQuoteToOrder,
  PurchaseQuoteDetail,
} from "@/app/(dashboard)/purchase-quotes/actions";
import { Button } from "@/components/shadcn/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import { isPurchaseQuoteEditable } from "@/lib/helpers";

const SAVE_FIRST = "Save the purchase quote first";
const NOT_BUILT = "Not built yet";

type Props = {
  /** The saved quote; null on a new one. */
  existing: PurchaseQuoteDetail | null;
  /** True while the form itself is saving. */
  isSaving: boolean;
};

type GreyedButtonProps = {
  label: string;
  title: string;
  icon: LucideIcon;
};

type LinkButtonProps = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const GreyedButton = ({ label, title, icon: Icon }: GreyedButtonProps) => (
  <Button type="button" variant="outline" disabled title={title}>
    <Icon className="me-1.5 size-4" />
    {label}
  </Button>
);

const LinkButton = ({ label, href, icon: Icon }: LinkButtonProps) => (
  <Button variant="outline" nativeButton={false} render={<Link href={href} />}>
    <Icon className="me-1.5 size-4" />
    {label}
  </Button>
);

/**
 * The reference's toolbar on a purchase quote: `Print… · Purchase order ·
 * Show company · Show order · Options… | Order lines · Orders and Quotes ·
 * Stock on location | Afhalen · Hego Prod - Lossen` (quote 900000).
 *
 * `Purchase order` converts the whole quote, after the reference's own
 * confirmation, and opens the provisional order it raised. It greys once the
 * quote is decided — expired, lost or already awarded — as it was greyed on
 * the expired 900000.
 */
export const PurchaseQuoteToolbar = ({ existing, isSaving }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [isConvertOpen, setIsConvertOpen] = useState(false);

  const isOpen = existing !== null && isPurchaseQuoteEditable(existing.status);
  const hasLines = (existing?.items.length ?? 0) > 0;
  const convertTitle = !existing
    ? SAVE_FIRST
    : !isOpen
      ? "This quote has already been decided"
      : !hasLines
        ? "This quote has no lines to order"
        : undefined;

  const convert = () => {
    if (!existing) {
      return;
    }
    setError(undefined);
    startTransition(async () => {
      // On success the action opens the new order itself.
      const result = await convertPurchaseQuoteToOrder(existing.uuid);
      setIsConvertOpen(false);
      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-2 border-b pb-4">
      <div className="flex flex-wrap items-center gap-2">
        <GreyedButton
          label="Print…"
          title={existing ? NOT_BUILT : SAVE_FIRST}
          icon={Printer}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsConvertOpen(true)}
          disabled={convertTitle !== undefined || isPending || isSaving}
          title={convertTitle}
        >
          <ShoppingCart className="me-1.5 size-4" />
          Purchase order
        </Button>
        {existing?.companyUuid ? (
          <LinkButton
            label="Show company"
            href={`/companies/${existing.companyUuid}`}
            icon={Building2}
          />
        ) : (
          <GreyedButton
            label="Show company"
            title={existing ? "No supplier on this quote" : SAVE_FIRST}
            icon={Building2}
          />
        )}
        {existing?.orderUuid ? (
          <LinkButton
            label="Show order"
            href={`/purchase-orders/${existing.orderUuid}`}
            icon={ShoppingCart}
          />
        ) : (
          <GreyedButton
            label="Show order"
            title={
              existing ? "This quote has not been converted" : SAVE_FIRST
            }
            icon={ShoppingCart}
          />
        )}
        <GreyedButton
          label="Options…"
          title={existing ? NOT_BUILT : SAVE_FIRST}
          icon={Settings2}
        />

        <span className="mx-1 h-6 border-l" />
        <LinkButton
          label="Order lines"
          href="/purchase-lines"
          icon={ClipboardList}
        />
        <LinkButton
          label="Orders and Quotes"
          href="/purchase-orders-and-quotes"
          icon={Files}
        />
        <LinkButton
          label="Stock on location"
          href="/stock-on-location"
          icon={Warehouse}
        />

        {/* `Afhalen` (collect) and `Hego Prod - Lossen` (unload): warehouse
            actions the reference puts on a purchase document. */}
        <span className="mx-1 h-6 border-l" />
        <GreyedButton label="Collect" title={NOT_BUILT} icon={Truck} />
        <GreyedButton label="Unload" title={NOT_BUILT} icon={PackageOpen} />
      </div>

      <FormError>{error}</FormError>

      <ConfirmDialog
        open={isConvertOpen}
        onOpenChange={setIsConvertOpen}
        onConfirm={convert}
        isPending={isPending}
        title="Purchase order"
        description="This converts the entire purchase quote into a purchase order. Choose Cancel if this is not the intention."
        confirmLabel="OK"
      />
    </div>
  );
};
