import Link from "next/link";
import { ReturnOrderDetail } from "@/app/(dashboard)/return-orders/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatDateColumn,
  formatMoney,
  formatNumber,
  orDash,
  pluralize,
} from "@/lib/helpers";
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_SOLUTION_LABELS,
  COMPLAINT_STATUS_LABELS,
} from "@/lib/labels";

type Props = {
  returnOrder: ReturnOrderDetail;
};

/**
 * The complaints raised about the goods on a saved return. A return and a
 * complaint are two records of the same event — the customer sending
 * something back and saying why.
 */
export const ComplaintsSection = ({ returnOrder }: Props) => (
  <CollapsibleSection
    title="Complaints"
    summary={`${returnOrder.complaints.length} ${pluralize(returnOrder.complaints.length, "complaint line")}`}
  >
    <div className="p-3">
      {returnOrder.complaints.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No complaint has been raised about the goods on this return.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Complaint</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Solution</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returnOrder.complaints.map((line) => (
                <TableRow key={line.uuid}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/complaints/${line.complaintUuid}`}
                      className="text-primary hover:underline"
                    >
                      {orDash(line.complaintId)}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDateColumn(line.reportDate)}</TableCell>
                  <TableCell>
                    <StatusBadge
                      value={line.status}
                      label={
                        line.status ? COMPLAINT_STATUS_LABELS[line.status] : null
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {line.category
                      ? COMPLAINT_CATEGORY_LABELS[line.category]
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {line.solution
                      ? COMPLAINT_SOLUTION_LABELS[line.solution]
                      : "—"}
                  </TableCell>
                  <TableCell>{orDash(line.description)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(line.qty ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(line.amount ?? 0))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  </CollapsibleSection>
);
