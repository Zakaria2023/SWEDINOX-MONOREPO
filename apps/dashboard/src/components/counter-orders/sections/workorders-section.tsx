"use client";

// Read-only cross-reference panels: the warehouse and production work orders
// linked to this counter order. A counter order links them once it exists, so
// on the create form both grids are empty — matching the native screen.

type PanelProps = {
  title: string;
  columns: string[];
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
    title: "Production workorders",
    columns: [
      "Item",
      "Workorder",
      "Line",
      "Workorder type",
      "Option",
      "Status",
      "Product",
      "Description",
      "Length",
      "Width",
      "Qty(p)",
      "U(p)",
      "Kg(p)",
      "Qty(a)",
      "U(a)",
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

export const WorkordersSection = () => (
  <section className="space-y-4">
    <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
      Workorders
    </h2>
    {WORKORDER_PANELS.map((panel) => (
      <WorkordersPanel
        key={panel.title}
        title={panel.title}
        columns={panel.columns}
      />
    ))}
  </section>
);
