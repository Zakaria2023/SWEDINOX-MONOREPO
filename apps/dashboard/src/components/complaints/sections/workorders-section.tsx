"use client";

// Read-only cross-reference panels: the warehouse and transport work orders
// linked to this complaint. A complaint links them once it exists, so on the
// create form both grids are empty — matching the native screen.

type PanelProps = {
  title: string;
  columns: string[];
};

type WorkordersSectionProps = {
  /** False inside a collapsible panel that already carries the title. */
  showHeading?: boolean;
};

const WORKORDER_PANELS: PanelProps[] = [
  {
    title: "Warehouse workorders",
    columns: [
      "Item",
      "Workorder",
      "Line",
      "Workorder type",
      "Type",
      "Status",
      "Product",
      "Description",
      "Length",
      "Width",
      "Qty(p)",
      "U(p)",
      "Kg(p)",
      "Qty C.",
      "Qty(a)",
      "U(a)",
    ],
  },
  {
    title: "Transport workorders",
    columns: [
      "Item",
      "Product",
      "Description",
      "Length",
      "Width",
      "Delivery date",
      "Status",
      "Vehicle",
      "Trip",
      "Bill of lading",
      "Printed",
      "Qty(p)",
      "U(p)",
      "Kg(p)",
      "Qty(a)",
      "Signed",
    ],
  },
];

const WorkordersPanel = ({ title, columns }: PanelProps) => (
  <div className="space-y-2">
    <h3 className="text-sm font-medium">{title}</h3>
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            {columns.map((column) => (
              <th key={column} className="whitespace-nowrap px-3 py-2 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              colSpan={columns.length}
              className="px-3 py-6 text-center text-muted-foreground"
            >
              No work orders linked yet.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export const WorkordersSection = ({
  showHeading = true,
}: WorkordersSectionProps) => (
  <section className="space-y-4">
    {showHeading && <h2 className="text-base font-semibold">Workorders</h2>}
    {WORKORDER_PANELS.map((panel) => (
      <WorkordersPanel
        key={panel.title}
        title={panel.title}
        columns={panel.columns}
      />
    ))}
  </section>
);
