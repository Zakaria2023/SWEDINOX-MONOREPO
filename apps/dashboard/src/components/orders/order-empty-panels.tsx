"use client";

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

/**
 * The panels a sales order shows under its lines that have nothing behind
 * them here — either because the order is not saved yet, or because the
 * reference's panel is not built. Each keeps its place, its toolbar (greyed)
 * and its grid's headers, so the screen reads in the reference's order.
 */
// What follows the selected line on the reference (order-detail.md §10): the
// shape a new order shows before it has a line to follow.
export const ORDER_LINE_EMPTY_PANELS: OrderEmptyPanel[] = [
  {
    title: "Options",
    toolbar: ["New", "Delete"],
    columns: [
      "Line",
      "Option",
      "Qty",
      "U",
      "Gross price",
      "Per",
      "Discount",
      "Net price",
      "Amount",
    ],
    empty: "Options are added to a saved order's lines.",
  },
  {
    title: "Deliveries",
    summary: "0 deliveries",
    columns: [
      "Delivery date",
      "Trip",
      "Status",
      "Vehicle",
      "Direction",
      "Bill of lading",
      "Qty(p)",
      "Qty(loaded)",
    ],
    empty: "A line is delivered once the order is made final.",
  },
  {
    title: "Stock",
    columns: [
      "Code",
      "Article",
      "Location",
      "Technical",
      "Reserved",
      "Available",
      "Quality",
      "Charge",
    ],
    empty: "Select a line to see the stock of its article.",
  },
  {
    title: "Text lines",
    columns: ["Line", "Text"],
    empty: "No text lines.",
  },
  {
    title: "Revenue + Profit",
    columns: [
      "",
      "Revenue",
      "w.r.t. APP",
      "w.r.t. FSP",
      "w.r.t. Repl. price",
      "w.r.t. LIP",
    ],
    empty: "Nothing to measure until the order has lines.",
  },
  {
    title: "Pricing",
    columns: [
      "Base price",
      "Gross price",
      "Line discount",
      "Extra discount",
      "Group discount",
      "Net price",
    ],
    empty: "Nothing to price until the order has lines.",
  },
  {
    title: "Stock other affiliates",
    columns: ["Affiliate", "Product", "Technical", "Reserved", "Available"],
    empty: "Not built: this installation holds one affiliate's stock.",
  },
  {
    title: "Previous orders",
    columns: [
      "Order / Line",
      "Creation date",
      "Status",
      "Qty",
      "Net price",
      "Amount",
      "Days in system",
    ],
    empty: "Shown for the selected line of a saved order.",
  },
  {
    title: "Previous quotes",
    columns: [
      "Quote / Line",
      "Creation date",
      "Status",
      "Qty",
      "Net price",
      "Amount",
      "Days in system",
    ],
    empty: "Shown for the selected line of a saved order.",
  },
];

// `Receipts` sits among the line's panels on the reference and reads
// `0 receipts` there: a sales order takes goods back through it. Not built —
// a return is entered as a return order here.
export const ORDER_RECEIPTS_PANEL: OrderEmptyPanel = {
  title: "Receipts",
  summary: "0 receipts",
  toolbar: ["New", "Delete"],
  columns: [
    "Status",
    "Delivery date",
    "Product",
    "Qty (p)",
    "Kg (p)",
    "Qty (a)",
    "Kg (a)",
  ],
  empty: "Not built: goods come back on a return order.",
};

// A call-off order's `Call-offs` panel (100785, 7-10-2026), before the order
// is saved.
export const ORDER_CALL_OFFS_PANEL: OrderEmptyPanel = {
  title: "Call-offs",
  toolbar: ["New", "Delete", "Change", "Print call-off", "Send…"],
  columns: [
    "Customer reference",
    "Delivery address",
    "Rush",
    "Call-off last modified by",
    "Call-off last modified",
    "IsSend",
    "Days in system",
  ],
  empty: "Call-offs are entered against a saved call-off order.",
};

// Order-level panels the reference has and this screen does not fill yet.
export const ORDER_PURCHASE_LINES_PANEL: OrderEmptyPanel = {
  title: "Purchase lines",
  columns: [
    "Purchase order",
    "Line",
    "Product",
    "Qty",
    "Delivery date",
    "Status",
    "For line",
  ],
  empty: "Not built: the purchase lines bought for this order's CD lines.",
};

export const ORDER_COMPLAINTS_PANEL: OrderEmptyPanel = {
  title: "Complaints",
  summary: "0 pending complaint(s)",
  toolbar: ["New"],
  columns: ["Complaint number", "Report date", "Category", "Status"],
  empty: "Not built: complaints are raised from the complaints screen.",
};

export const ORDER_RETURN_LINES_PANEL: OrderEmptyPanel = {
  title: "Return lines",
  columns: [
    "Return order",
    "Line",
    "Product",
    "Status",
    "Reason",
    "Return qty",
    "Amount",
  ],
  empty: "Not built: returns are listed on the return orders screen.",
};

export const ORDER_PDF_DOCUMENTS_PANEL: OrderEmptyPanel = {
  title: "PDF Documents",
  columns: ["File", "Created"],
  empty: "Not built: the order confirmation is not printed to a PDF yet.",
};

export type OrderEmptyPanel = {
  title: string;
  /** The reference's count beside the title — `0 receipts`. */
  summary?: string;
  /** The panel's toolbar, every button greyed. */
  toolbar?: string[];
  columns: string[];
  /** What the empty grid says. */
  empty: string;
};

type Props = {
  panels: OrderEmptyPanel[];
  /** Why the toolbar is greyed, on hover. */
  reason: string;
};

export const OrderEmptyPanels = ({ panels, reason }: Props) => (
  <>
    {panels.map((panel) => (
      <CollapsibleSection
        key={panel.title}
        title={panel.title}
        summary={panel.summary}
      >
        <div className="space-y-2">
          {panel.toolbar && (
            <div className="flex flex-wrap gap-2">
              {panel.toolbar.map((action) => (
                <Button
                  key={action}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled
                  title={reason}
                >
                  {action}
                </Button>
              ))}
            </div>
          )}
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {panel.columns.map((column, index) => (
                    <TableHead key={`${column}-${index}`}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={panel.columns.length}
                    className="text-muted-foreground"
                  >
                    {panel.empty}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </CollapsibleSection>
    ))}
  </>
);
