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
 * One of the panels the reference stacks under a purchase order's lines, as it
 * appears on an order that has not been saved: a toolbar whose actions are
 * greyed, the grid's headers, and nothing in it.
 */
export type NewOrderPanel = {
  title: string;
  /** The reference's count beside the title — `0 receipts`. */
  summary?: string;
  /** The toolbar's buttons, every one disabled until the order exists. */
  toolbar?: string[];
  columns?: string[];
  /** What the empty grid says. */
  empty: string;
};

type Props = {
  panels: NewOrderPanel[];
};

/**
 * Captured on 9-10-2026 off a blank `Purchase order` (404355): everything from
 * `Options` down to `PDF Files`, in that order. `Logistics` sits between
 * `Complaints` and `Texts`, which is why the list is in two halves — the form
 * renders its own Logistics block there.
 */
// The reference's `Workorders` block — three grids, empty on a new order.
export const WORK_ORDER_PANELS: NewOrderPanel[] = [
  {
    title: "Warehouse workorders",
    columns: [
      "Number",
      "Planned",
      "Type",
      "Warehouse",
      "Status",
      "Lines",
      "Qty planned",
      "Qty actual",
      "Kg planned",
      "Kg actual",
      "Created",
    ],
    empty: "None — raised once the order is saved and released.",
  },
  {
    title: "Production workorders",
    columns: ["Number", "Machine", "Option", "Planned date", "Status"],
    empty: "None — raised once the order is saved and released.",
  },
  {
    title: "Transport workorders",
    columns: ["Trip", "Date", "Vehicle", "Status", "Bill of lading"],
    empty: "None — raised once the order is saved and released.",
  },
];

export const NEW_ORDER_PANELS_BEFORE_LOGISTICS: NewOrderPanel[] = [
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
      "Reference factor",
      "Net price",
      "Amount",
    ],
    empty: "Options are added to a saved order's lines.",
  },
  {
    title: "Receipts",
    summary: "0 receipts",
    toolbar: [
      "New",
      "Delete",
      "Split",
      "Batch registration",
      "Charge aanpassen…",
    ],
    columns: [
      "Status",
      "Delivery date",
      "Delivery date (actual)",
      "Bill of lading",
      "Product",
      "Length",
      "Width",
      "Thickness",
      "Kg (p)",
      "Qty (p)",
      "U (p)",
      "Kg (a)",
      "Qty (a)",
      "U (a)",
      "Transfer address",
      "Transfer qty",
      "Pre-announced delivery",
    ],
    empty: "A receipt is raised for each line when the order is saved.",
  },
  {
    title: "Pricing",
    columns: [
      "Line",
      "Product",
      "Gross price",
      "Group discount",
      "Line discount",
      "Net price",
      "Per",
      "Amount",
    ],
    empty: "Nothing to price until the order has lines.",
  },
  { title: "Text lines", columns: ["Line", "Text"], empty: "No text lines." },
  {
    title: "Stock",
    columns: [
      "Product",
      "Purchase order",
      "Original",
      "Remaining",
      "Reserved",
      "Available",
      "Status",
      "Created",
    ],
    empty: "No stock has been received on this order.",
  },
  {
    title: "Stock other affiliates",
    columns: ["Affiliate", "Product", "Technical", "Reserved", "Available"],
    empty: "No stock at other affiliates.",
  },
  {
    title: "Previous orders",
    columns: ["Order", "Order date", "Status", "Amount", "Weight"],
    empty: "Shown once a supplier is chosen and the order is saved.",
  },
  {
    title: "Product Receipt Documents",
    toolbar: ["New", "Delete"],
    columns: [
      "Kind",
      "Producer",
      "Certificate type",
      "Code",
      "Document",
      "Order line",
      "Receipt line",
    ],
    empty: "Documents are attached to a saved order.",
  },
  {
    title: "Contracts",
    summary: "0 company contract(s), 0 order contract(s)",
    columns: ["Code", "Description", "Type", "Role", "Start", "End"],
    empty: "No contracts.",
  },
  {
    title: "Invoice lines",
    columns: [
      "Invoice",
      "Line",
      "Product code",
      "Description",
      "Qty",
      "Weight",
      "Amount",
    ],
    empty: "Nothing has been invoiced.",
  },
  {
    title: "Complaints",
    summary: "0 pending complaint(s)",
    columns: [
      "Complaint number",
      "Report date",
      "Category",
      "Status",
      "Description",
    ],
    empty: "No complaints.",
  },
];

export const NEW_ORDER_PANELS_AFTER_LOGISTICS: NewOrderPanel[] = [
  {
    title: "Texts",
    toolbar: ["New", "Delete"],
    columns: ["Title", "Text", "Category", "Created by"],
    empty: "No texts.",
  },
  {
    title: "Return lines",
    columns: [
      "Return order",
      "Line",
      "Product",
      "Status",
      "Reason",
      "Return date",
      "Return qty",
      "Unit",
      "Amount",
    ],
    empty: "Nothing has been returned.",
  },
  {
    title: "Surcharges",
    toolbar: ["New", "Delete"],
    columns: [
      "Order",
      "Description",
      "Surcharge",
      "Unit",
      "From",
      "Until",
      "Tier unit",
      "Amount",
      "Profit",
      "Third party",
      "Company",
    ],
    empty: "No surcharges.",
  },
  {
    title: "Documents",
    summary: "0 Documents",
    toolbar: ["New"],
    columns: ["Name", "Type", "Uploaded"],
    empty: "Documents are attached to a saved order.",
  },
  {
    title: "Communication",
    columns: ["Document", "Type", "Shape", "Email", "Fax"],
    empty: "Nothing has been sent.",
  },
  {
    title: "PDF Files",
    summary: "PDF Files",
    columns: ["File", "Created"],
    empty: "No PDF files.",
  },
];

export const PurchaseOrderNewPanels = ({ panels }: Props) => (
  <>
    {panels.map((panel) => (
      <CollapsibleSection
        key={panel.title}
        title={panel.title}
        summary={panel.summary}
      >
        <div className="space-y-2 p-3">
          {panel.toolbar && (
            <div className="flex flex-wrap gap-2">
              {panel.toolbar.map((action) => (
                <Button
                  key={action}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled
                  title="Save the order first"
                >
                  {action}
                </Button>
              ))}
            </div>
          )}
          {panel.columns ? (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {panel.columns.map((column) => (
                      <TableHead key={column}>{column}</TableHead>
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
          ) : (
            <p className="text-sm text-muted-foreground">{panel.empty}</p>
          )}
        </div>
      </CollapsibleSection>
    ))}
  </>
);

/** The panels named, in the order given — for a screen that has its own
 *  grids for some of them and the empty shape for the rest. */
export const panelsNamed = (titles: string[]): NewOrderPanel[] =>
  titles.flatMap((title) => {
    const panel = [
      ...NEW_ORDER_PANELS_BEFORE_LOGISTICS,
      ...NEW_ORDER_PANELS_AFTER_LOGISTICS,
    ].find((candidate) => candidate.title === title);
    return panel ? [panel] : [];
  });
