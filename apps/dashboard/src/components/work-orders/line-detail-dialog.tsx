"use client";

import { ReactNode, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Building2, Package, ReceiptText } from "lucide-react";
import { buttonVariants } from "@/components/shadcn/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { FormError } from "@/components/ui/form-error";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn, formatDateColumn } from "@/lib/helpers";
import { ORDER_STATUS_LABELS, STOCK_UNIT_LABELS } from "@/lib/labels";
import type { LineDetail } from "@/lib/server/work-order-line-detail";

const TABS = ["stock", "order", "options", "texts"] as const;

type Tab = (typeof TABS)[number];

/**
 * The little a line has to be able to say about itself for the panel's header
 * and its three jump buttons. Warehouse and production lines both satisfy it,
 * which is what lets one panel serve both.
 */
export type DetailLine = {
  uuid: string;
  lineNumber: number | null;
  productCode: string | null;
  productName: string | null;
  charge: string | null;
  companyUuid: string | null;
  productUuid: string | null;
};

type Props = {
  line: DetailLine | null;
  /** The Server Action that reads the panel for this kind of work order. */
  load: (lineUuid: string) => Promise<LineDetail | null>;
  onOpenChange: (open: boolean) => void;
};

type FieldProps = {
  label: string;
  children: ReactNode;
};

const TAB_LABELS: Record<Tab, string> = {
  stock: "Stock",
  order: "Order",
  options: "Options",
  texts: "Texts",
};

const orDash = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === "" ? "—" : value;

const dimensions = (
  length: number | null,
  width: number | null,
  thickness: string | null,
) => {
  const parts = [length, width, thickness].filter(
    (part) => part !== null && part !== undefined,
  );
  return parts.length ? parts.join(" × ") : "—";
};

const Field = ({ label, children }: FieldProps) => (
  <div className="space-y-1">
    <p className="text-muted-foreground text-xs uppercase">{label}</p>
    <div className="text-sm">{children}</div>
  </div>
);

export const LineDetailDialog = ({ line, load, onOpenChange }: Props) => {
  const [tab, setTab] = useState<Tab>("stock");
  const [detail, setDetail] = useState<LineDetail | null>(null);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!line) {
      return;
    }
    setTab("stock");
    setDetail(null);
    setLoadError(undefined);
    startTransition(async () => {
      try {
        setDetail(await load(line.uuid));
      } catch {
        setLoadError("Could not load the details for this line.");
      }
    });
  }, [line, load]);

  return (
    <Dialog open={line !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            Line {orDash(line?.lineNumber)} — {orDash(line?.productCode)}
          </DialogTitle>
          <DialogDescription>
            {orDash(line?.productName)}
            {line?.charge ? ` · charge ${line.charge}` : ""}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* The three jumps the old system put down the side of the panel.
              One is only offered when there is something to open. */}
          <div className="flex flex-wrap gap-2">
            {line?.companyUuid ? (
              <Link
                href={`/companies/${line.companyUuid}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                <Building2 className="size-4" />
                Company
              </Link>
            ) : null}
            {detail?.order ? (
              <Link
                href={`/orders/${detail.order.orderUuid}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                <ReceiptText className="size-4" />
                Order
              </Link>
            ) : null}
            {line?.productUuid ? (
              <Link
                href={`/products/${line.productUuid}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                <Package className="size-4" />
                Product
              </Link>
            ) : null}
          </div>

          <div className="flex gap-1 border-b">
            {TABS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setTab(name)}
                className={cn(
                  "border-b-2 px-3 py-2 text-sm",
                  tab === name
                    ? "border-primary font-medium"
                    : "text-muted-foreground border-transparent",
                )}
              >
                {TAB_LABELS[name]}
              </button>
            ))}
          </div>

          <FormError>{loadError}</FormError>

          {isPending && (
            <p className="text-muted-foreground text-sm">Loading…</p>
          )}

          {!isPending && tab === "stock" && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Dimensions</TableHead>
                    <TableHead className="text-right">Avail. Stk.</TableHead>
                    <TableHead className="text-right">Techn. Stk.</TableHead>
                    <TableHead className="text-right">Reser. Stk.</TableHead>
                    <TableHead>Charge</TableHead>
                    <TableHead>Quality</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!detail?.stock.length ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        No stock of this product.
                      </TableCell>
                    </TableRow>
                  ) : (
                    detail.stock.map((row) => (
                      <TableRow key={row.uuid}>
                        <TableCell>{orDash(row.locationName)}</TableCell>
                        <TableCell>
                          {orDash(row.productName)}
                          {row.remark ? (
                            <span className="text-destructive ml-2 text-xs font-medium">
                              {row.remark}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {dimensions(
                            row.lengthMm,
                            row.widthMm,
                            row.thicknessMm,
                          )}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right tabular-nums",
                            row.available < 0 && "text-destructive",
                          )}
                        >
                          {row.available.toFixed(3)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.technical.toFixed(3)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.reserved.toFixed(3)}
                        </TableCell>
                        <TableCell>
                          {orDash(row.charge)}
                          {row.internalCharge ? (
                            <span className="text-muted-foreground">
                              {` / ${row.internalCharge}`}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>{orDash(row.quality)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {!isPending && tab === "order" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {!detail?.order ? (
                <p className="text-muted-foreground text-sm">
                  This line serves no order — an internal job has no customer.
                </p>
              ) : (
                <>
                  <Field label="Sales order">
                    <Link
                      href={`/orders/${detail.order.orderUuid}`}
                      className="text-primary hover:underline"
                    >
                      {detail.order.orderNumber}{" "}
                      {orDash(detail.order.companyName)}
                    </Link>
                  </Field>
                  <Field label="Customer ref.">
                    {orDash(detail.order.customerRef)}
                  </Field>
                  <Field label="Status">
                    <StatusBadge
                      value={detail.order.status}
                      label={ORDER_STATUS_LABELS[detail.order.status]}
                    />
                  </Field>
                  <Field label="Seller">{orDash(detail.order.seller)}</Field>
                  <Field label="Delivery address">
                    {orDash(detail.order.deliveryAddress)}
                  </Field>
                  <Field label="Contact person">
                    {orDash(detail.order.contactName)}
                  </Field>
                  <Field label="Delivery date">
                    {detail.order.deliveryDate
                      ? formatDateColumn(detail.order.deliveryDate)
                      : "—"}
                  </Field>
                  <Field label="Telephone">
                    {orDash(detail.order.telephone)}
                  </Field>
                </>
              )}
            </div>
          )}

          {!isPending && tab === "options" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Seq. no.</TableHead>
                  <TableHead>Option</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="w-20">U</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!detail?.options.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No finishing on this line.
                    </TableCell>
                  </TableRow>
                ) : (
                  detail.options.map((row) => (
                    <TableRow key={row.uuid}>
                      <TableCell className="tabular-nums">
                        {row.sequenceNumber}
                      </TableCell>
                      <TableCell>
                        {orDash(row.name)}
                        {row.code ? (
                          <span className="text-muted-foreground">
                            {` (${row.code})`}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {orDash(row.quantity)}
                      </TableCell>
                      <TableCell>
                        {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {!isPending && tab === "texts" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-64">Categories</TableHead>
                  <TableHead>Text</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!detail?.texts.length ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center">
                      Nothing noted against this order or customer.
                    </TableCell>
                  </TableRow>
                ) : (
                  detail.texts.map((row) => (
                    <TableRow key={row.uuid}>
                      <TableCell>{orDash(row.categoryName)}</TableCell>
                      <TableCell className="whitespace-pre-wrap">
                        {row.title ? (
                          <span className="font-medium">{`${row.title}: `}</span>
                        ) : null}
                        {row.textBlock}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
