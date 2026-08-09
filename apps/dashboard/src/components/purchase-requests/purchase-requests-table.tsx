import Link from "next/link";
import { getPurchaseRequests } from "@/app/(dashboard)/purchase-requests/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { PURCHASE_ORDER_TYPE_LABELS } from "@/lib/labels";
import { PurchaseOrderType } from "@/lib/enums";
import { TableExportButton } from "@/components/ui/table-export-button";

export const PurchaseRequestsTable = async () => {
  const purchaseRequests = await getPurchaseRequests();

  return (
    <div>
      <div className="space-y-4">
        <div className="flex justify-end">
          <TableExportButton
            tableId="purchase-requests-table"
            fileName="purchase-requests"
            sheetName="Purchase Requests"
          />
        </div>
        <Table id="purchase-requests-table">
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseRequests.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No purchase requests found.
                </TableCell>
              </TableRow>
            ) : (
              purchaseRequests.map((row) => (
                <TableRow key={row.uuid}>
                  <TableCell>
                    <Link
                      href={`/purchase-requests/${row.uuid}`}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {row.id}
                    </Link>
                  </TableCell>
                  <TableCell>{row.companyName ?? "—"}</TableCell>
                  <TableCell>
                    {[row.contactFirstName, row.contactLastName]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </TableCell>
                  <TableCell>
                    {row.purchaseOrderType
                      ? (PURCHASE_ORDER_TYPE_LABELS[
                          row.purchaseOrderType as PurchaseOrderType
                        ] ?? row.purchaseOrderType)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {row.deliveryDate
                      ? new Date(row.deliveryDate).toLocaleDateString("en-GB")
                      : row.deliveryWeek && row.deliveryYear
                        ? `W${row.deliveryWeek} ${row.deliveryYear}`
                        : "—"}
                  </TableCell>
                  <TableCell>
                    {row.deadline
                      ? new Date(row.deadline).toLocaleDateString("en-GB")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {new Date(row.createdAt).toLocaleDateString("en-GB")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
