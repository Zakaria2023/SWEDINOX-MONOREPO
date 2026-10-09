"use client";

import Link from "next/link";
import { ReactNode, startTransition, useActionState, useState } from "react";
import {
  CompanyInvoiceRow,
  CompanyPurchaseLineRow,
  CompanyPurchaseRequestRow,
  CompanyRelatedRecords,
} from "@/app/(dashboard)/companies/actions";
import { deleteCompanyAddress } from "@/app/(dashboard)/companies/[uuid]/edit/addresses/actions";
import { deleteCompanyContact } from "@/app/(dashboard)/companies/[uuid]/edit/contacts/actions";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { SelectCustomerStock } from "@/db/schema/customer-stock";
import { SelectPurchaseOrders } from "@/db/schema/purchase-orders";
import {
  openPurchaseOrderStatuses,
  openPurchaseQuoteStatuses,
  openPurchaseRequestStatuses,
} from "@/lib/enums";
import {
  cn,
  daysInSystem,
  documentProfitMarginPercent,
  formatDateColumn,
  formatMoney,
  formatNumber,
  orDash,
  pluralize,
  todayDateString,
} from "@/lib/helpers";
import {
  ADDRESS_CATEGORY_LABELS,
  CONTACT_CATEGORY_LABELS,
  CONTRACT_TYPE_LABELS,
  CONTRACTABLE_ROLE_LABELS,
  CUSTOMER_STOCK_REASON_LABELS,
  INVOICE_DOCUMENT_TYPE_LABELS,
  ORDER_LINE_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PURCHASE_INVOICE_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_ORDER_TYPE_LABELS,
  PURCHASE_QUOTE_STATUS_LABELS,
  PURCHASE_REQUEST_STATUS_LABELS,
  PURCHASE_RETURN_ORDER_REASON_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";
import {
  Eye,
  FileText,
  Package,
  Pencil,
  Plus,
  Printer,
  Send,
  Trash2,
} from "lucide-react";

// Order and quote statuses that still need something done.
const CLOSED_STATUSES = new Set(["invoiced", "completed", "cancelled", "expired"]);

// A purchase order is open until all its goods are in: the reference counts
// `In progress` and leaves `Received`, `Invoiced` and `Expired` out.
const OPEN_PURCHASE_ORDER_STATUSES = new Set<string>([
  "provisional",
  ...openPurchaseOrderStatuses,
]);
const OPEN_PURCHASE_QUOTE_STATUSES = new Set<string>(openPurchaseQuoteStatuses);
const OPEN_PURCHASE_REQUEST_STATUSES = new Set<string>(
  openPurchaseRequestStatuses,
);

const NOT_BUILT = "Not built yet in this application.";

type PanelAction = {
  label: string;
  icon: ReactNode;
  /** A link for the selected row; null greys the button. */
  href?: string | null;
  onClick?: () => void;
  /** Why the button is greyed, shown on hover. */
  title?: string;
};

type PanelToolbarProps = {
  actions: PanelAction[];
};

type DocumentLinkProps = {
  href: string;
  children: ReactNode;
};

type CardProps = {
  heading: string;
  isSelected: boolean;
  onSelect: () => void;
  rows: Array<[string, string | null]>;
};

type Props = {
  records: CompanyRelatedRecords;
};

type CompanyPanelProps = {
  companyUuid: string;
};

type AddressesPanelProps = CompanyPanelProps & {
  addresses: SelectCompanyAddresses[];
};

type ContactsPanelProps = CompanyPanelProps & {
  contacts: CompanyRelatedRecords["contacts"];
};

type OrdersPanelProps = {
  orders: CompanyRelatedRecords["orders"];
};

type QuotesPanelProps = {
  quotes: CompanyRelatedRecords["quotes"];
};

type ContractsPanelProps = {
  contracts: CompanyRelatedRecords["contracts"];
};

type PurchaseRequestsPanelProps = {
  requests: CompanyPurchaseRequestRow[];
};

type PurchaseQuotesPanelProps = {
  quotes: CompanyRelatedRecords["purchaseQuotes"];
};

type PurchaseOrdersPanelProps = {
  purchaseOrders: SelectPurchaseOrders[];
};

type PurchaseLinesPanelProps = {
  lines: CompanyPurchaseLineRow[];
};

type CustomerStockPanelProps = CompanyPanelProps & {
  companyName: string;
  stock: SelectCustomerStock[];
};

type InvoicesPanelProps = {
  invoices: CompanyInvoiceRow[];
};

type CommunicationPanelProps = {
  communications: CompanyRelatedRecords["communications"];
};

const sum = (values: Array<string | number | null>) =>
  values.reduce<number>((total, value) => total + Number(value ?? 0), 0);

const DocumentLink = ({ href, children }: DocumentLinkProps) => (
  <Link href={href} className="font-medium text-primary hover:underline">
    {children}
  </Link>
);

/**
 * The bar of buttons across the top of a company panel — the reference's
 * `New · Delete · Modify…`, `New · Show`, `Show · Show order`. Pick a row or a
 * card first, then press the button; a button with nothing to act on greys.
 */
const PanelToolbar = ({ actions }: PanelToolbarProps) => (
  <div className="mb-3 flex flex-wrap items-center gap-2">
    {actions.map((action) => {
      if (action.href) {
        return (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            render={<Link href={action.href} />}
          >
            <span className="me-1.5">{action.icon}</span>
            {action.label}
          </Button>
        );
      }
      return (
        <Button
          key={action.label}
          type="button"
          variant="outline"
          size="sm"
          disabled={!action.onClick}
          onClick={action.onClick}
          title={action.title}
        >
          <span className="me-1.5">{action.icon}</span>
          {action.label}
        </Button>
      );
    })}
  </div>
);

/** One address or contact as the reference draws it: a headed card. */
const Card = ({ heading, isSelected, onSelect, rows }: CardProps) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={isSelected}
    className={cn(
      "w-64 overflow-hidden rounded-md border text-left text-sm",
      isSelected ? "border-primary ring-1 ring-primary" : "border-border",
    )}
  >
    <div
      className={cn(
        "line-clamp-1 px-2 py-1 font-medium",
        isSelected ? "bg-primary text-primary-foreground" : "bg-muted",
      )}
    >
      {heading}
    </div>
    <dl className="grid grid-cols-[auto_1fr] gap-x-2 px-2 py-1.5">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}:</dt>
          <dd className="line-clamp-1 break-all">{value ?? ""}</dd>
        </div>
      ))}
    </dl>
  </button>
);

/** `Addresses`: a card per address, headed by its sequence and types. */
export const CompanyAddressesPanel = ({
  companyUuid,
  addresses,
}: AddressesPanelProps) => {
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteState, dispatchDelete, isDeleting] = useActionState(
    deleteCompanyAddress,
    {},
  );
  const selected =
    addresses.find((address) => address.uuid === selectedUuid) ?? null;
  const editHref = `/companies/${companyUuid}/edit/addresses`;

  const handleConfirmDelete = () => {
    if (!selected) {
      return;
    }
    startTransition(() => {
      dispatchDelete({ companyUuid, addressUuid: selected.uuid });
    });
    setIsConfirmOpen(false);
    setSelectedUuid(null);
  };

  return (
    <CollapsibleSection
      title="Addresses"
      summary={`${addresses.length} ${pluralize(addresses.length, "address", "addresses")}`}
    >
      <PanelToolbar
        actions={[
          { label: "New", icon: <Plus className="size-4" />, href: editHref },
          {
            label: "Delete",
            icon: <Trash2 className="size-4" />,
            onClick: selected ? () => setIsConfirmOpen(true) : undefined,
          },
          {
            label: "Modify…",
            icon: <Pencil className="size-4" />,
            href: selected ? editHref : null,
          },
        ]}
      />
      <FormError>{deleteState.error}</FormError>
      <div className="flex flex-wrap gap-3">
        {addresses.map((address) => (
          <Card
            key={address.uuid}
            heading={`${address.sequenceNumber ?? ""}. ${address.category
              .map((category) => ADDRESS_CATEGORY_LABELS[category])
              .join(", ")}`}
            isSelected={address.uuid === selectedUuid}
            onSelect={() => setSelectedUuid(address.uuid)}
            rows={[
              ["Address", address.streetAndNo],
              [
                "City",
                [address.postalCode, address.city].filter(Boolean).join(" "),
              ],
              ["Tel", address.telephone],
              ["Fax", address.fax],
              ["E-mail", address.email],
              ["Url", address.website],
            ]}
          />
        ))}
      </div>
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Delete address"
        description="Are you sure? This can't be undone."
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </CollapsibleSection>
  );
};

/** `Contacts`: a card per person, headed by its sequence and categories. */
export const CompanyContactsPanel = ({
  companyUuid,
  contacts,
}: ContactsPanelProps) => {
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteState, dispatchDelete, isDeleting] = useActionState(
    deleteCompanyContact,
    {},
  );
  const selected =
    contacts.find((contact) => contact.uuid === selectedUuid) ?? null;
  const editHref = `/companies/${companyUuid}/edit/contacts`;

  const handleConfirmDelete = () => {
    if (!selected) {
      return;
    }
    startTransition(() => {
      dispatchDelete({ companyUuid, contactUuid: selected.uuid });
    });
    setIsConfirmOpen(false);
    setSelectedUuid(null);
  };

  return (
    <CollapsibleSection
      title="Contacts"
      summary={`${contacts.length} ${pluralize(contacts.length, "contact")}`}
    >
      <PanelToolbar
        actions={[
          { label: "New", icon: <Plus className="size-4" />, href: editHref },
          {
            label: "Delete",
            icon: <Trash2 className="size-4" />,
            onClick: selected ? () => setIsConfirmOpen(true) : undefined,
          },
          {
            label: "Modify…",
            icon: <Pencil className="size-4" />,
            href: selected ? editHref : null,
          },
        ]}
      />
      <FormError>{deleteState.error}</FormError>
      <div className="flex flex-wrap gap-3">
        {contacts.map((contact) => (
          <Card
            key={contact.uuid}
            heading={`${contact.sequenceNumber}. ${contact.categories
              .map((category) => CONTACT_CATEGORY_LABELS[category])
              .join(", ")}`}
            isSelected={contact.uuid === selectedUuid}
            onSelect={() => setSelectedUuid(contact.uuid)}
            rows={[
              [
                "Name",
                [contact.firstName, contact.lastName].filter(Boolean).join(" "),
              ],
              ["Tel.", contact.telephone],
              ["Mob.", contact.mobile],
              ["E-mail", contact.email],
              ["Fax", contact.fax],
            ]}
          />
        ))}
      </div>
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Delete contact"
        description="Are you sure? This can't be undone."
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </CollapsibleSection>
  );
};

export const CompanyQuotesPanel = ({ quotes }: QuotesPanelProps) => {
  const openQuotes = quotes.filter(
    (quote) => !CLOSED_STATUSES.has(quote.status),
  );

  return (
    <CollapsibleSection
      title="Quotes"
      summary={`${openQuotes.length} open; ${formatMoney(sum(openQuotes.map((quote) => quote.totalExclVat)))}`}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quote no</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Quote date</TableHead>
            <TableHead>Valid until</TableHead>
            <TableHead className="text-right">Amount (excl. VAT)</TableHead>
            <TableHead className="text-right">Weight (kg)</TableHead>
            <TableHead>Customer reference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.map((quote) => (
            <TableRow key={quote.uuid}>
              <TableCell>
                <DocumentLink href={`/quotes/${quote.uuid}`}>
                  {quote.id}
                </DocumentLink>
              </TableCell>
              <TableCell>{ORDER_STATUS_LABELS[quote.status]}</TableCell>
              <TableCell>{formatDateColumn(quote.quoteDate)}</TableCell>
              <TableCell>{formatDateColumn(quote.validUntil)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(quote.totalExclVat ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(Number(quote.totalWeightKg ?? 0))}
              </TableCell>
              <TableCell>{orDash(quote.customerRef)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CollapsibleSection>
  );
};

/** `Orders`: the reference's `Standaard` view, with `New · Show` above it. */
export const CompanyOrdersPanel = ({ orders }: OrdersPanelProps) => {
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const openOrders = orders.filter(
    (order) => !CLOSED_STATUSES.has(order.status),
  );
  const lastOrder = orders[0];

  return (
    <CollapsibleSection
      title="Orders"
      summary={`${openOrders.length} in progress${
        lastOrder
          ? `; the last one is from ${formatDateColumn(lastOrder.createdAt)}`
          : ""
      }`}
    >
      <PanelToolbar
        actions={[
          { label: "New", icon: <Plus className="size-4" />, href: "/orders/new" },
          {
            label: "Show",
            icon: <Eye className="size-4" />,
            href: selectedUuid ? `/orders/${selectedUuid}` : null,
          },
        ]}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order type</TableHead>
            <TableHead>Order no</TableHead>
            <TableHead>Blocked</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Order date</TableHead>
            <TableHead>Delivery date</TableHead>
            <TableHead className="text-right">Amount (excl. VAT)</TableHead>
            <TableHead className="text-right">Weight (kg)</TableHead>
            <TableHead>Customer reference</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Consignment</TableHead>
            <TableHead className="text-right">Profit%</TableHead>
            <TableHead className="text-right">Days in system</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.uuid}
              onClick={() => setSelectedUuid(order.uuid)}
              className={cn(
                "cursor-pointer",
                order.uuid === selectedUuid && "bg-muted",
              )}
            >
              <TableCell>{ORDER_TYPE_LABELS[order.orderType]}</TableCell>
              <TableCell>
                <DocumentLink href={`/orders/${order.uuid}`}>
                  {order.id}
                </DocumentLink>
              </TableCell>
              <TableCell>{order.handlingBlocked ? "Yes" : "No"}</TableCell>
              <TableCell>{ORDER_STATUS_LABELS[order.status]}</TableCell>
              <TableCell>{formatDateColumn(order.createdAt)}</TableCell>
              <TableCell>{formatDateColumn(order.deliveryDate)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(order.totalExclVat ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(Number(order.totalWeightKg ?? 0))}
              </TableCell>
              <TableCell>{orDash(order.customerRef)}</TableCell>
              <TableCell>{orDash(order.projectName)}</TableCell>
              <TableCell>{order.isConsignment ? "Yes" : "No"}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(
                  documentProfitMarginPercent(
                    Number(order.totalExclVat ?? 0),
                    Number(order.materialsProfit ?? 0),
                  ),
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {daysInSystem(order.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CollapsibleSection>
  );
};

/** `Purchase requests`: "N open purchase requests, X Kg". */
export const CompanyPurchaseRequestsPanel = ({
  requests,
}: PurchaseRequestsPanelProps) => {
  const openRequests = requests.filter(
    (request) =>
      request.status !== null &&
      OPEN_PURCHASE_REQUEST_STATUSES.has(request.status),
  );

  return (
    <CollapsibleSection
      title="Purchase requests"
      summary={`${openRequests.length} open purchase requests, ${formatNumber(sum(openRequests.map((request) => request.kg)))} Kg`}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Request no</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Delivery date</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead className="text-right">Weight (kg)</TableHead>
            <TableHead className="text-right">Days in system</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.uuid}>
              <TableCell>
                <DocumentLink href={`/purchase-requests/${request.uuid}`}>
                  {request.id}
                </DocumentLink>
              </TableCell>
              <TableCell>
                {request.status
                  ? PURCHASE_REQUEST_STATUS_LABELS[request.status]
                  : "—"}
              </TableCell>
              <TableCell>{orDash(request.reference)}</TableCell>
              <TableCell>{formatDateColumn(request.deliveryDate)}</TableCell>
              <TableCell>{formatDateColumn(request.deadline)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(request.kg)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {daysInSystem(request.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CollapsibleSection>
  );
};

/** `Purchase quotes`: the bar counts and sums only the open quotes. */
export const CompanyPurchaseQuotesPanel = ({
  quotes,
}: PurchaseQuotesPanelProps) => {
  const openQuotes = quotes.filter(
    (quote) =>
      quote.status !== null && OPEN_PURCHASE_QUOTE_STATUSES.has(quote.status),
  );

  return (
    <CollapsibleSection
      title="Purchase quotes"
      summary={`${openQuotes.length} open purchase quote(s); ${formatMoney(sum(openQuotes.map((quote) => quote.totalExclVat)))}; ${formatNumber(sum(openQuotes.map((quote) => quote.totalWeightKg)))} Kg`}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quote no</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Quote date</TableHead>
            <TableHead>Valid until</TableHead>
            <TableHead className="text-right">Amount (excl. VAT)</TableHead>
            <TableHead className="text-right">Weight (kg)</TableHead>
            <TableHead>Reference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.map((quote) => (
            <TableRow key={quote.uuid}>
              <TableCell>
                <DocumentLink href={`/purchase-quotes/${quote.uuid}`}>
                  {quote.id}
                </DocumentLink>
              </TableCell>
              <TableCell>
                {quote.status ? PURCHASE_QUOTE_STATUS_LABELS[quote.status] : "—"}
              </TableCell>
              <TableCell>{formatDateColumn(quote.quoteDate)}</TableCell>
              <TableCell>{formatDateColumn(quote.validUntil)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(quote.totalExclVat ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(Number(quote.totalWeightKg ?? 0))}
              </TableCell>
              <TableCell>{orDash(quote.reference)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CollapsibleSection>
  );
};

/**
 * `Purchase orders`: shown even when empty, the bar reading "N open purchase
 * order(s); € total; kg", with `New · Show · Confirm · Pre-notify · Show order`.
 */
export const CompanyPurchaseOrdersPanel = ({
  purchaseOrders,
}: PurchaseOrdersPanelProps) => {
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const selected =
    purchaseOrders.find((order) => order.uuid === selectedUuid) ?? null;
  const openOrders = purchaseOrders.filter(
    (order) =>
      order.status !== null && OPEN_PURCHASE_ORDER_STATUSES.has(order.status),
  );
  // Confirm and Pre-notify are done on the purchase order itself.
  const orderHref = selected ? `/purchase-orders/${selected.uuid}` : null;

  return (
    <CollapsibleSection
      title="Purchase orders"
      summary={`${openOrders.length} open purchase order(s); ${formatMoney(sum(openOrders.map((order) => order.amount)))}; ${formatNumber(sum(openOrders.map((order) => order.weightKg)))} Kg`}
    >
      <PanelToolbar
        actions={[
          {
            label: "New",
            icon: <Plus className="size-4" />,
            href: "/purchase-orders/new",
          },
          { label: "Show", icon: <Eye className="size-4" />, href: orderHref },
          {
            label: "Confirm",
            icon: <FileText className="size-4" />,
            href: orderHref,
          },
          {
            label: "Pre-notify",
            icon: <Send className="size-4" />,
            href: orderHref,
          },
          {
            label: "Show order",
            icon: <Eye className="size-4" />,
            href: selected?.forOrder
              ? `/orders-and-quotes?q=${encodeURIComponent(selected.forOrder)}`
              : null,
          },
        ]}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Order no</TableHead>
            <TableHead>Purchase type</TableHead>
            <TableHead>For order</TableHead>
            <TableHead>Order date</TableHead>
            <TableHead>Delivery date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Weight (kg)</TableHead>
            <TableHead>Copied from</TableHead>
            <TableHead>Internal ref.</TableHead>
            <TableHead>Printed</TableHead>
            <TableHead>Mailed</TableHead>
            <TableHead>Handle transport</TableHead>
            <TableHead>Pick up/Drop-off</TableHead>
            <TableHead>Purchaser</TableHead>
            <TableHead>Purchaser initials</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead className="text-right">Days in system</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchaseOrders.map((order) => (
            <TableRow
              key={order.uuid}
              onClick={() => setSelectedUuid(order.uuid)}
              className={cn(
                "cursor-pointer",
                order.uuid === selectedUuid && "bg-muted",
              )}
            >
              <TableCell>
                {order.status ? PURCHASE_ORDER_STATUS_LABELS[order.status] : "—"}
              </TableCell>
              <TableCell>
                <DocumentLink href={`/purchase-orders/${order.uuid}`}>
                  {order.id}
                </DocumentLink>
              </TableCell>
              <TableCell>
                {order.purchaseOrderType
                  ? PURCHASE_ORDER_TYPE_LABELS[order.purchaseOrderType]
                  : "—"}
              </TableCell>
              <TableCell>{orDash(order.forOrder)}</TableCell>
              <TableCell>{formatDateColumn(order.orderDate)}</TableCell>
              <TableCell>{formatDateColumn(order.deliveryDate)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(order.amount ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(Number(order.weightKg ?? 0))}
              </TableCell>
              <TableCell>{orDash(order.copiedFrom)}</TableCell>
              <TableCell>{orDash(order.internalReference)}</TableCell>
              <TableCell>{order.isPrinted ? "Yes" : "No"}</TableCell>
              <TableCell>{order.isMailed ? "Yes" : "No"}</TableCell>
              <TableCell>{order.arrangeTransport ? "Yes" : "No"}</TableCell>
              <TableCell>
                {order.pickupDropoffCdPurchases ? "Yes" : "No"}
              </TableCell>
              <TableCell>{orDash(order.inkoper)}</TableCell>
              <TableCell>{orDash(order.purchaserInitials)}</TableCell>
              <TableCell>{orDash(order.reference)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {daysInSystem(order.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CollapsibleSection>
  );
};

/** `Inkoopregels`: the supplier's purchase lines, newest first. */
export const CompanyPurchaseLinesPanel = ({ lines }: PurchaseLinesPanelProps) => {
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const selected = lines.find((line) => line.uuid === selectedUuid) ?? null;

  return (
    <CollapsibleSection
      title="Purchase lines"
      summary={`${lines.length} ${pluralize(lines.length, "purchase line")}`}
    >
      <PanelToolbar
        actions={[
          {
            label: "Show Product",
            icon: <Package className="size-4" />,
            href: selected ? `/products/${selected.productUuid}` : null,
          },
          {
            label: "Show Purchase order",
            icon: <Eye className="size-4" />,
            href: selected
              ? `/purchase-orders/${selected.purchaseOrderUuid}`
              : null,
          },
        ]}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No.</TableHead>
            <TableHead>Line</TableHead>
            <TableHead>Product code</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Receipt date</TableHead>
            <TableHead className="text-right">Qty(p)</TableHead>
            <TableHead>Purchase U.</TableHead>
            <TableHead className="text-right">Kg(pur)</TableHead>
            <TableHead className="text-right">Net purchase price</TableHead>
            <TableHead>PriceU</TableHead>
            <TableHead className="text-right">Amount(p)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow
              key={line.uuid}
              onClick={() => setSelectedUuid(line.uuid)}
              className={cn(
                "cursor-pointer",
                line.uuid === selectedUuid && "bg-muted",
              )}
            >
              <TableCell>{line.purchaseOrderId}</TableCell>
              <TableCell>{orDash(line.lineNumber)}</TableCell>
              <TableCell>{orDash(line.productCode)}</TableCell>
              <TableCell>{orDash(line.productName)}</TableCell>
              <TableCell>
                {line.status ? ORDER_LINE_STATUS_LABELS[line.status] : "—"}
              </TableCell>
              <TableCell>{formatDateColumn(line.receiptDate)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(Number(line.quantity))}
              </TableCell>
              <TableCell>
                {line.unit ? STOCK_UNIT_LABELS[line.unit] : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(Number(line.kgPurchased ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(line.netPrice ?? 0))}
              </TableCell>
              <TableCell>{orDash(line.priceUnit)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(line.amount ?? 0))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CollapsibleSection>
  );
};

/**
 * `Customer stock`: the reference's lot columns as far as this record carries
 * them, and its lot toolbar — only `New` is built here.
 */
export const CompanyCustomerStockPanel = ({
  companyUuid,
  companyName,
  stock,
}: CustomerStockPanelProps) => (
  <CollapsibleSection
    title="Customer stock"
    summary={`${stock.length} ${pluralize(stock.length, "row")}`}
  >
    <PanelToolbar
      actions={[
        {
          label: "New",
          icon: <Plus className="size-4" />,
          href: `/companies/${companyUuid}/edit/customer-stock`,
        },
        { label: "Packaging…", icon: <Package className="size-4" />, title: NOT_BUILT },
        { label: "Correction…", icon: <Pencil className="size-4" />, title: NOT_BUILT },
        { label: "Reservations…", icon: <FileText className="size-4" />, title: NOT_BUILT },
        { label: "Move…", icon: <Send className="size-4" />, title: NOT_BUILT },
        { label: "Stock label", icon: <Printer className="size-4" />, title: NOT_BUILT },
      ]}
    />
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead>Remark</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead className="text-right">Days in system</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stock.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell>{companyName}</TableCell>
            <TableCell>{orDash(row.location)}</TableCell>
            <TableCell>{orDash(row.productCode)}</TableCell>
            <TableCell>{orDash(row.productName)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(Number(row.quantity ?? 0))}
            </TableCell>
            <TableCell>{orDash(row.description)}</TableCell>
            <TableCell>
              {row.reason ? CUSTOMER_STOCK_REASON_LABELS[row.reason] : "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {daysInSystem(row.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CollapsibleSection>
);

/** `Invoices`: the reference's columns, with `Show · Show order` above. */
export const CompanyInvoicesPanel = ({ invoices }: InvoicesPanelProps) => {
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const selected =
    invoices.find((invoice) => invoice.uuid === selectedUuid) ?? null;

  return (
    <CollapsibleSection
      title="Invoices"
      summary={`${invoices.length} ${pluralize(invoices.length, "invoice")}`}
    >
      <PanelToolbar
        actions={[
          {
            label: "Show",
            icon: <Eye className="size-4" />,
            href: selected ? `/invoices/${selected.uuid}` : null,
          },
          {
            label: "Show order",
            icon: <Eye className="size-4" />,
            href: selected?.orderUuid ? `/orders/${selected.orderUuid}` : null,
          },
        ]}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice no</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Invoice date</TableHead>
            <TableHead>Expiration date</TableHead>
            <TableHead className="text-right">Amount excl.</TableHead>
            <TableHead className="text-right">Amount incl.</TableHead>
            <TableHead className="text-right">Credit restriction</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Outstanding</TableHead>
            <TableHead>Printed</TableHead>
            <TableHead>Print date</TableHead>
            <TableHead>Mailed</TableHead>
            <TableHead>E-mail date</TableHead>
            <TableHead>E-mail address</TableHead>
            <TableHead>Change date</TableHead>
            <TableHead className="text-right">Days in system</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow
              key={invoice.uuid}
              onClick={() => setSelectedUuid(invoice.uuid)}
              className={cn(
                "cursor-pointer",
                invoice.uuid === selectedUuid && "bg-muted",
              )}
            >
              <TableCell>
                <DocumentLink href={`/invoices/${invoice.uuid}`}>
                  {invoice.id}
                </DocumentLink>
              </TableCell>
              <TableCell>{orDash(invoice.orderId)}</TableCell>
              <TableCell>{formatDateColumn(invoice.invoiceDate)}</TableCell>
              <TableCell>{formatDateColumn(invoice.expirationDate)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(invoice.invoiceAmountExclVat ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(invoice.invoiceAmountInclVat ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(invoice.creditRestriction ?? 0))}
              </TableCell>
              {/* The reference reads `Sent` once the invoice went out. */}
              <TableCell>
                {invoice.cancelled
                  ? "Cancelled"
                  : invoice.printed || invoice.mailed
                    ? "Sent"
                    : "Not sent"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(invoice.outstanding ?? 0))}
              </TableCell>
              <TableCell>{invoice.printed ? "Yes" : "No"}</TableCell>
              <TableCell>{formatDateColumn(invoice.printedAt)}</TableCell>
              <TableCell>{invoice.mailed ? "Yes" : "No"}</TableCell>
              <TableCell>{formatDateColumn(invoice.mailedAt)}</TableCell>
              <TableCell>{orDash(invoice.mailedTo)}</TableCell>
              <TableCell>{formatDateColumn(invoice.updatedAt)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {daysInSystem(invoice.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CollapsibleSection>
  );
};

/**
 * `Contracts`: the bar's count leaves the surcharge contracts out, as the
 * reference's does ("0 contracts" over two `Surcharges` rows).
 */
export const CompanyContractsPanel = ({ contracts }: ContractsPanelProps) => {
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const countedContracts = contracts.filter(
    (contract) => contract.contractType !== "surcharges",
  );
  const today = todayDateString();

  return (
    <CollapsibleSection
      title="Contracts"
      summary={`${countedContracts.length} ${pluralize(countedContracts.length, "contract")}`}
    >
      <PanelToolbar
        actions={[
          {
            label: "Show Contract",
            icon: <Eye className="size-4" />,
            href: selectedUuid ? `/contracts/${selectedUuid}` : null,
          },
          { label: "Print…", icon: <Printer className="size-4" />, title: NOT_BUILT },
          { label: "Send…", icon: <Send className="size-4" />, title: NOT_BUILT },
          {
            label: "Quickly change contracts…",
            icon: <Pencil className="size-4" />,
            title: NOT_BUILT,
          },
        ]}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Contract type</TableHead>
            <TableHead>Expired</TableHead>
            <TableHead>Starting date</TableHead>
            <TableHead>End date</TableHead>
            <TableHead className="text-right">Sales (kg)</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Maximum sales (kg)</TableHead>
            <TableHead className="text-right">Website sorting</TableHead>
            <TableHead className="text-right">Days in system</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <TableRow
              key={contract.uuid}
              onClick={() => setSelectedUuid(contract.uuid)}
              className={cn(
                "cursor-pointer",
                contract.uuid === selectedUuid && "bg-muted",
              )}
            >
              <TableCell>
                {contract.role ? CONTRACTABLE_ROLE_LABELS[contract.role] : "—"}
              </TableCell>
              <TableCell>
                <DocumentLink href={`/contracts/${contract.uuid}`}>
                  {contract.code}
                </DocumentLink>
              </TableCell>
              <TableCell>{contract.description}</TableCell>
              <TableCell>
                {contract.contractType
                  ? CONTRACT_TYPE_LABELS[contract.contractType]
                  : "—"}
              </TableCell>
              <TableCell>
                {contract.endDate !== null && contract.endDate < today
                  ? "Yes"
                  : "No"}
              </TableCell>
              <TableCell>{formatDateColumn(contract.startingDate)}</TableCell>
              <TableCell>{formatDateColumn(contract.endDate)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(contract.salesKg ?? 0)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(contract.revenue ?? 0)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(contract.maxWeightKg ?? 0)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {orDash(contract.websiteSorting)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {daysInSystem(contract.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CollapsibleSection>
  );
};

/** `Communication`: what went out to this company, newest first. */
export const CompanyCommunicationPanel = ({
  communications,
}: CommunicationPanelProps) => (
  <CollapsibleSection
    title="Communication"
    summary={`${communications.length} ${pluralize(communications.length, "message")}`}
  >
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sent</TableHead>
          <TableHead>Document</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Channel</TableHead>
          <TableHead>Recipient</TableHead>
          <TableHead className="text-right">Delivered</TableHead>
          <TableHead className="text-right">Failed</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {communications.map((message) => (
          <TableRow key={message.uuid}>
            <TableCell>{formatDateColumn(message.sentAt)}</TableCell>
            <TableCell>{orDash(message.documentLabel)}</TableCell>
            <TableCell>{orDash(message.subject)}</TableCell>
            <TableCell>{message.channel}</TableCell>
            <TableCell>{orDash(message.recipient)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {message.deliveredCount}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {message.failedCount}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CollapsibleSection>
);

/**
 * The remaining document panels under a company — `Purchase invoices`,
 * `Purchase returns`. Each closed bar
 * states what is inside, so the relationship reads without opening any.
 */
export const CompanyRelatedPanels = ({ records }: Props) => (
  <div className="space-y-3">
    <CollapsibleSection
      title="Purchase invoices"
      summary={`${records.purchaseInvoices.length} ${pluralize(records.purchaseInvoices.length, "purchase invoice")}; ${formatMoney(sum(records.purchaseInvoices.map((invoice) => invoice.outstanding)))} outstanding`}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Supplier invoice no</TableHead>
            <TableHead>Invoice date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Invoice total</TableHead>
            <TableHead className="text-right">Outstanding</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.purchaseInvoices.map((invoice) => (
            <TableRow key={invoice.uuid}>
              <TableCell>
                <DocumentLink href={`/purchase-invoices/${invoice.uuid}`}>
                  {invoice.id}
                </DocumentLink>
              </TableCell>
              <TableCell>
                {invoice.documentType
                  ? INVOICE_DOCUMENT_TYPE_LABELS[invoice.documentType]
                  : "—"}
              </TableCell>
              <TableCell>{orDash(invoice.invoiceNumberSupplier)}</TableCell>
              <TableCell>{formatDateColumn(invoice.invoiceDate)}</TableCell>
              <TableCell>
                {invoice.status
                  ? PURCHASE_INVOICE_STATUS_LABELS[invoice.status]
                  : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(invoice.invoiceTotal ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(invoice.outstanding ?? 0))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CollapsibleSection>

    <CollapsibleSection
      title="Purchase returns"
      summary={`${records.purchaseReturns.length} ${pluralize(records.purchaseReturns.length, "purchase return order")}; ${formatMoney(sum(records.purchaseReturns.map((row) => row.totalExclVat)))}; ${formatNumber(sum(records.purchaseReturns.map((row) => row.totalWeightKg)))} kg`}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Return no</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Return date</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="text-right">Amount (excl. VAT)</TableHead>
            <TableHead className="text-right">Weight (kg)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.purchaseReturns.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>
                <DocumentLink href={`/purchase-return-orders/${row.uuid}`}>
                  {row.id}
                </DocumentLink>
              </TableCell>
              <TableCell>
                {row.status ? PURCHASE_ORDER_STATUS_LABELS[row.status] : "—"}
              </TableCell>
              <TableCell>{formatDateColumn(row.returnDate)}</TableCell>
              <TableCell>
                {row.returnReason
                  ? PURCHASE_RETURN_ORDER_REASON_LABELS[row.returnReason]
                  : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(row.totalExclVat ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(Number(row.totalWeightKg ?? 0))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CollapsibleSection>
  </div>
);
