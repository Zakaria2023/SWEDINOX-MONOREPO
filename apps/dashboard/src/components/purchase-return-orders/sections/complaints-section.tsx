import Link from "next/link";
import { PurchaseReturnOrderDetail } from "@/app/(dashboard)/purchase-return-orders/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { formatDateColumn, orDash } from "@/lib/helpers";
import { COMPLAINT_STATUS_LABELS } from "@/lib/labels";

type Props = {
  returnOrder: PurchaseReturnOrderDetail;
};

/** The complaint a saved return was raised under — `Par. return` opens one. */
export const ComplaintsSection = ({ returnOrder }: Props) => (
  <CollapsibleSection
    title="Complaints"
    summary={
      returnOrder.complaintUuid
        ? `Complaint ${returnOrder.complaintId ?? returnOrder.complaintRef ?? ""}`
        : "No complaint"
    }
  >
    <div className="p-3">
      {returnOrder.complaintUuid ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Complaint</TableHead>
              <TableHead>Report date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                <Link
                  href={`/complaints/${returnOrder.complaintUuid}`}
                  className="underline-offset-2 hover:underline"
                >
                  {returnOrder.complaintId ?? returnOrder.complaintRef}
                </Link>
              </TableCell>
              <TableCell>
                {formatDateColumn(returnOrder.complaintReportDate)}
              </TableCell>
              <TableCell>
                {returnOrder.complaintStatus
                  ? COMPLAINT_STATUS_LABELS[returnOrder.complaintStatus]
                  : "—"}
              </TableCell>
              <TableCell className="whitespace-pre-wrap">
                {orDash(returnOrder.complaintDescription)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">
          No complaint is linked to this purchase return order.
        </p>
      )}
    </div>
  </CollapsibleSection>
);
