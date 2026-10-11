"use client";

import Link from "next/link";
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
import { PurchaseRequestDetail } from "@/app/(dashboard)/purchase-requests/actions";
import { Button } from "@/components/shadcn/button";

const SAVE_FIRST = "Save the purchase request first";
const NOT_BUILT = "Not built yet";

/** What the screen needs to know about a saved request. */
export type PurchaseRequestHeader = Pick<
  PurchaseRequestDetail,
  "uuid" | "id" | "status" | "createdAt" | "companyUuid"
>;

type Props = {
  /** The saved request; null on a new one. */
  existing: PurchaseRequestHeader | null;
  isPending: boolean;
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
 * are awake. `Make final` saves the request, the way the reference's does on a
 * blank one. On a saved request `Purchase quote` and `Purchase order` lead to
 * the two ways its own page answers it — asking suppliers, or ordering
 * outright — and `Show company` opens the supplier.
 */
export const PurchaseRequestToolbar = ({ existing, isPending }: Props) => {
  const requestHref = existing ? `/purchase-requests/${existing.uuid}` : null;
  const companyHref = existing?.companyUuid
    ? `/companies/${existing.companyUuid}`
    : null;

  return (
    <div className="flex flex-wrap gap-2 border-b pb-4">
      {existing ? (
        <GreyedButton label="Make final" title={NOT_BUILT} icon={BadgeCheck} />
      ) : (
        <Button type="submit" disabled={isPending}>
          <BadgeCheck className="me-1.5 size-4" />
          Make final
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
      {requestHref ? (
        <>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`${requestHref}#ask-suppliers`} />}
          >
            <FileQuestion className="me-1.5 size-4" />
            Purchase quote
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`${requestHref}#order-outright`} />}
          >
            <ShoppingCart className="me-1.5 size-4" />
            Purchase order
          </Button>
        </>
      ) : (
        <>
          <GreyedButton
            label="Purchase quote"
            title={SAVE_FIRST}
            icon={FileQuestion}
          />
          <GreyedButton
            label="Purchase order"
            title={SAVE_FIRST}
            icon={ShoppingCart}
          />
        </>
      )}
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
  );
};
