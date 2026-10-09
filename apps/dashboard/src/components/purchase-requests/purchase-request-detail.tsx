"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  convertPurchaseRequestToQuotes,
  PurchaseRequestDetail,
} from "@/app/(dashboard)/purchase-requests/actions";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { Button } from "@/components/shadcn/button";
import { PurchaseRequestOrderForm } from "@/components/purchase-requests/purchase-request-order-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { DocumentCell } from "@/components/ui/document-cell";
import { FormError } from "@/components/ui/form-error";
import { RelatedRecordsBar } from "@/components/ui/related-records-bar";
import { PurchaseQuoteStatus, PurchaseRequestStatus } from "@/lib/enums";
import {
  formatAddressLine,
  formatMoney,
  formatNumber,
  isPurchaseRequestEditable,
  orDash,
  pluralize,
  runningMeters,
} from "@/lib/helpers";
import {
  ORDER_LINE_STATUS_LABELS,
  PURCHASE_QUOTE_STATUS_LABELS,
  PURCHASE_REQUEST_STATUS_LABELS,
} from "@/lib/labels";
import { Send } from "lucide-react";

const NOT_BUILT_ACTIONS = [
  "Make final",
  "Print…",
  "Send…",
  "Copy",
  "Options…",
];

type Props = {
  request: PurchaseRequestDetail;
  supplierOptions: CompanyOption[];
};

export const PurchaseRequestDetailView = ({
  request,
  supplierOptions,
}: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [selected, setSelected] = useState<string[]>([]);

  const alreadyAsked = new Set(request.quotes.map((quote) => quote.uuid));
  const isClosed = !isPurchaseRequestEditable(request.status);

  const toggle = (uuid: string) =>
    setSelected((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid],
    );

  const requestQuotes = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await convertPurchaseRequestToQuotes(
        request.uuid,
        selected,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setSelected([]);
    });
  };

  const deliveryAddress = formatAddressLine({
    streetAndNo: request.deliveryStreetAndNo,
    postalCode: request.deliveryPostalCode,
    city: request.deliveryCity,
  });
  const documentCount = request.documents?.length ?? 0;

  return (
    <div className="space-y-6">
      {error && <FormError>{error}</FormError>}

      {/* The reference's request toolbar: `Make final · Print… · Send… ·
          Purchase quote · Purchase order · Show company · Copy · Options…`.
          Purchase quote and Purchase order lead to the two ways this screen
          already answers a request. */}
      <div className="flex flex-wrap gap-2">
        {NOT_BUILT_ACTIONS.slice(0, 3).map((label) => (
          <span key={label} title="Not built yet">
            <Button type="button" variant="outline" size="sm" disabled>
              {label}
            </Button>
          </span>
        ))}
        <RelatedRecordsBar
          records={[
            {
              label: "Purchase quote",
              href: isClosed ? null : "#ask-suppliers",
            },
            {
              label: "Purchase order",
              href: isClosed ? null : "#order-outright",
            },
            {
              label: "Show company",
              href: request.companyUuid
                ? `/companies/${request.companyUuid}`
                : null,
            },
          ]}
        />
        {NOT_BUILT_ACTIONS.slice(3).map((label) => (
          <span key={label} title="Not built yet">
            <Button type="button" variant="outline" size="sm" disabled>
              {label}
            </Button>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Status
          </p>
          <p className="text-sm">
            {PURCHASE_REQUEST_STATUS_LABELS[
              request.status as PurchaseRequestStatus
            ] ?? request.status}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Raised against
          </p>
          <p className="text-sm">{request.companyName ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Reference
          </p>
          <p className="text-sm">{request.reference ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Deadline
          </p>
          <p className="text-sm">
            {request.deadline?.toLocaleDateString("en-GB") ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Delivery address
          </p>
          <p className="text-sm">{deliveryAddress || "—"}</p>
        </div>
      </div>

      {/* ── What is being asked for ─────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">
          Lines{" "}
          <span className="text-sm font-normal text-muted-foreground">
            {request.items.length} {pluralize(request.items.length, "line")}
          </span>
        </h2>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>For line</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Length (mm)</TableHead>
                <TableHead className="text-right">Thickness</TableHead>
                <TableHead className="text-right">Kg</TableHead>
                <TableHead className="text-right">M1</TableHead>
                <TableHead>Required by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {request.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={13}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nothing requested yet.
                  </TableCell>
                </TableRow>
              ) : (
                request.items.map((item) => (
                  <TableRow key={item.uuid}>
                    <TableCell>{item.lineNumber ?? "—"}</TableCell>
                    {/* Why this material is being bought: a customer waiting,
                        or nothing, which means it is going to stock. */}
                    <TableCell className="whitespace-nowrap">
                      {item.forOrderId ? (
                        <Link
                          href={`/orders/${item.forOrderUuid}`}
                          className="text-primary hover:underline"
                        >
                          {item.forOrderId}
                          {item.forOrderLine ? `/${item.forOrderLine}` : ""}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Stock</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        value={item.lineStatus}
                        label={
                          item.lineStatus
                            ? ORDER_LINE_STATUS_LABELS[item.lineStatus]
                            : null
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {[item.productCode, item.productName]
                        .filter(Boolean)
                        .join(" — ") ||
                        item.description ||
                        "—"}
                    </TableCell>
                    <TableCell>{orDash(item.stockCategory)}</TableCell>
                    <TableCell>{orDash(item.qualityCode)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.quantity}
                    </TableCell>
                    <TableCell>{item.unit ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(item.lengthMm)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(item.thicknessMm)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(item.kg ?? 0))}
                    </TableCell>
                    {/* Derived, never stored: for goods counted in metres the
                        quantity already is the length. */}
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(
                        runningMeters({
                          quantity: Number(item.quantity ?? 0),
                          unit: item.unit,
                          lengthMm: item.lengthMm,
                        }),
                      )}
                    </TableCell>
                    <TableCell>{item.requiredDate ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Quotes received back ────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">
          Quotes{" "}
          <span className="text-sm font-normal text-muted-foreground">
            {request.quotes.length} asked
          </span>
        </h2>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Lines</TableHead>
                <TableHead className="text-right">Total excl. VAT</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {request.quotes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No suppliers asked yet.
                  </TableCell>
                </TableRow>
              ) : (
                request.quotes.map((quote) => (
                  <TableRow key={quote.uuid}>
                    <TableCell className="font-medium">
                      {quote.supplierName ?? "—"}
                    </TableCell>
                    <TableCell>
                      {PURCHASE_QUOTE_STATUS_LABELS[
                        quote.status as PurchaseQuoteStatus
                      ] ?? quote.status}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {quote.lineCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(quote.totalExclVat ?? 0))}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/purchase-quotes/${quote.uuid}`}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Open
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {!isClosed && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={<Link href={`/purchase-requests/${request.uuid}/edit`} />}
          >
            Edit Request
          </Button>
        </div>
      )}

      {/* ── Ask more suppliers ──────────────────────────────────────────── */}
      {!isClosed && (
        <div id="ask-suppliers" className="space-y-3">
          <h2 className="border-b pb-2 text-base font-semibold">
            Ask suppliers to quote
          </h2>
          <p className="text-sm text-muted-foreground">
            Each supplier gets its own copy of the lines above with no prices on
            it. Their answers come back as quotes you can compare side by side.
          </p>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {supplierOptions.map((supplier) => (
              <label
                key={supplier.uuid}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm"
              >
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={selected.includes(supplier.uuid)}
                  onChange={() => toggle(supplier.uuid)}
                  disabled={isPending || alreadyAsked.has(supplier.uuid)}
                />
                <span>
                  {supplier.companyName ??
                    supplier.searchCode1 ??
                    supplier.uuid}
                </span>
              </label>
            ))}
          </div>

          <Button
            type="button"
            onClick={requestQuotes}
            disabled={isPending || selected.length === 0}
          >
            <Send className="mr-1.5 size-4" />
            {isPending
              ? "Creating quotes..."
              : `Request ${selected.length || ""} quote${selected.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      )}

      {/* ── Or order outright ──────────────────────────────────────────── */}
      {!isClosed && (
        <div id="order-outright">
          <PurchaseRequestOrderForm
            request={request}
            supplierOptions={supplierOptions}
          />
        </div>
      )}

      <div className="space-y-2">
        <CollapsibleSection
          title="Texts"
          summary={`${request.texts.length} ${pluralize(request.texts.length, "text")}`}
        >
          {request.texts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No texts on this purchase request.
            </p>
          ) : (
            <ul className="space-y-3">
              {request.texts.map((text) => (
                <li key={text.uuid} className="text-sm">
                  <p className="font-medium">{orDash(text.title)}</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {orDash(text.textBlock)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Documents"
          summary={`${documentCount} ${pluralize(documentCount, "Document")}`}
        >
          <DocumentCell documents={request.documents} />
        </CollapsibleSection>

        {/* What `Print…` would file here; printing is not built yet. */}
        <CollapsibleSection title="PDF Files" summary="PDF Files">
          <p className="text-sm text-muted-foreground">
            No PDF files — printing a purchase request is not built yet.
          </p>
        </CollapsibleSection>
      </div>
    </div>
  );
};
