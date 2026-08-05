"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { PackageCheck } from "lucide-react";
import {
  ComplaintDetail,
  convertComplaintToReturnOrder,
  deleteComplaint,
} from "@/app/(dashboard)/complaints/actions";
import { Button } from "@/components/shadcn/button";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DetailField } from "@/components/ui/detail-field";
import { FormError } from "@/components/ui/form-error";
import {
  complaintSolutionReturnsGoods,
  formatDateColumn,
  formatMoney,
  formatNumber,
  fullName,
  orDash,
  pluralize,
} from "@/lib/helpers";
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_CAUSE_LABELS,
  COMPLAINT_REPORT_LABELS,
  COMPLAINT_SOLUTION_LABELS,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_TYPE_LABELS,
} from "@/lib/labels";

type Props = {
  complaint: ComplaintDetail;
};

export const ComplaintDetailView = ({ complaint }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteComplaint(complaint.uuid);
      if (result.error) {
        setError(result.error);
      }
      setIsConfirmOpen(false);
    });
  };

  const returnsGoods = complaintSolutionReturnsGoods(complaint.solution);
  const hasReturn = complaint.returnOrders.length > 0;

  const handleRaiseReturn = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await convertComplaintToReturnOrder(complaint.uuid);
      if (result.error) {
        setError(result.error);
      }
    });
  };

  const totalCosts =
    Number(complaint.costsCustomer ?? 0) +
    Number(complaint.internalCosts ?? 0) +
    Number(complaint.extraCosts ?? 0) +
    Number(complaint.toBeReclaimed ?? 0);

  return (
    <div className="space-y-6">
      {error && <FormError>{error}</FormError>}

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Complaint</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Company" value={complaint.companyName} />
          <DetailField
            label="Contact"
            value={fullName(
              complaint.contactFirstName,
              complaint.contactLastName,
            )}
          />
          <DetailField
            label="Type"
            value={
              complaint.complaintType
                ? COMPLAINT_TYPE_LABELS[complaint.complaintType]
                : null
            }
          />
          <DetailField
            label="Report"
            value={
              complaint.report
                ? COMPLAINT_REPORT_LABELS[complaint.report]
                : null
            }
          />
          <DetailField
            label="Report date"
            value={formatDateColumn(complaint.reportDate)}
          />
          <DetailField
            label="Category"
            value={
              complaint.category
                ? COMPLAINT_CATEGORY_LABELS[complaint.category]
                : null
            }
          />
          <DetailField
            label="Status"
            value={
              complaint.status
                ? COMPLAINT_STATUS_LABELS[complaint.status]
                : null
            }
          />
          <DetailField
            label="Deadline"
            value={formatDateColumn(complaint.deadline)}
          />
        </div>

        <DetailField label="Description" value={complaint.description} />
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Product</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Product
            </p>
            {complaint.productUuid ? (
              <Link
                href={`/products/${complaint.productUuid}`}
                className="text-sm text-primary hover:underline"
              >
                {[complaint.productCode, complaint.productName]
                  .filter(Boolean)
                  .join(" — ") || complaint.productUuid}
              </Link>
            ) : (
              <p className="text-sm">—</p>
            )}
          </div>
          <DetailField
            label="Qty"
            value={formatNumber(Number(complaint.qty ?? 0))}
          />
          <DetailField
            label="Amount"
            value={formatMoney(Number(complaint.amount ?? 0))}
          />
          <DetailField
            label="Weight (kg)"
            value={formatNumber(Number(complaint.weight ?? 0))}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Handling</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <DetailField
            label="Responsible"
            value={complaint.responsibleUserId}
          />
          <DetailField
            label="Cause"
            value={
              complaint.cause ? COMPLAINT_CAUSE_LABELS[complaint.cause] : null
            }
          />
          <DetailField
            label="Solution"
            value={
              complaint.solution
                ? COMPLAINT_SOLUTION_LABELS[complaint.solution]
                : null
            }
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DetailField
            label="Explanation of cause"
            value={complaint.explanationOfCause}
          />
          <DetailField
            label="Explanation of solution"
            value={complaint.explanationOfSolution}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Costs</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <DetailField
            label="Costs customer"
            value={formatMoney(Number(complaint.costsCustomer ?? 0))}
          />
          <DetailField
            label="Internal costs"
            value={formatMoney(Number(complaint.internalCosts ?? 0))}
          />
          <DetailField
            label="Extra costs"
            value={formatMoney(Number(complaint.extraCosts ?? 0))}
          />
          <DetailField
            label="To be reclaimed"
            value={formatMoney(Number(complaint.toBeReclaimed ?? 0))}
          />
          <DetailField label="Total costs" value={formatMoney(totalCosts)} />
        </div>
      </section>

      {/* Where a complaint turns into goods actually coming back. Offered only
          when the agreed solution is one that brings them back — a price
          correction settles on paper and has nothing to receive. */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
        <Button
          type="button"
          onClick={handleRaiseReturn}
          disabled={isPending || !returnsGoods || hasReturn}
        >
          <PackageCheck className="size-4" />
          {hasReturn ? "Return order raised" : "Raise return order"}
        </Button>

        <p className="text-sm text-muted-foreground">
          {hasReturn ? (
            <>
              Raised as{" "}
              {complaint.returnOrders.map((returnOrder, index) => (
                <span key={returnOrder.uuid}>
                  {index > 0 && ", "}
                  <Link
                    href={`/return-orders/${returnOrder.uuid}`}
                    className="text-primary hover:underline"
                  >
                    return order #{returnOrder.id}
                  </Link>
                </span>
              ))}
              . Receiving it books the goods back into stock; crediting it hands
              the money back.
            </>
          ) : returnsGoods ? (
            "Creates a return order for these lines, priced at what the customer was invoiced."
          ) : (
            "This complaint's solution doesn't bring the goods back, so there is nothing to return."
          )}
        </p>
      </div>

      <div className="space-y-2">
        {/* The order link the schema has always carried — this is the first
            screen that surfaces which order line a complaint is about. */}
        <CollapsibleSection
          title="Complaint lines"
          summary={pluralize(complaint.items.length, "line")}
          defaultOpen={complaint.items.length > 0}
        >
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">Line</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Weight (kg)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaint.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No lines on this complaint.
                    </TableCell>
                  </TableRow>
                ) : (
                  complaint.items.map((item) => (
                    <TableRow key={item.uuid}>
                      <TableCell className="text-right tabular-nums">
                        {orDash(item.lineNumber)}
                      </TableCell>
                      <TableCell>
                        {item.orderUuid ? (
                          <Link
                            href={`/orders/${item.orderUuid}`}
                            className="text-primary hover:underline"
                          >
                            #{orDash(item.orderId)}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {item.productUuid ? (
                          <Link
                            href={`/products/${item.productUuid}`}
                            className="text-primary hover:underline"
                          >
                            {[item.productCode, item.productName]
                              .filter(Boolean)
                              .join(" — ") || item.productUuid}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{orDash(item.description)}</TableCell>
                      <TableCell>
                        <StatusBadge
                          value={item.status}
                          label={
                            item.status
                              ? COMPLAINT_STATUS_LABELS[item.status]
                              : null
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(item.qty ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(item.amount ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(item.weightKg ?? 0))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Status history"
          summary={pluralize(complaint.statusHistory?.length ?? 0, "change")}
        >
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Status date</TableHead>
                  <TableHead>Assigned by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!complaint.statusHistory ||
                complaint.statusHistory.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No status changes recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  complaint.statusHistory.map((entry, index) => (
                    <TableRow key={`${entry.statusDate}-${index}`}>
                      <TableCell className="font-medium">
                        <StatusBadge
                          value={entry.status}
                          label={
                            entry.status
                              ? COMPLAINT_STATUS_LABELS[entry.status]
                              : null
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {formatDateColumn(entry.statusDate)}
                      </TableCell>
                      <TableCell>{orDash(entry.assignedByName)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Documents"
          summary={pluralize(complaint.documents?.length ?? 0, "document")}
        >
          {!complaint.documents || complaint.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents attached.
            </p>
          ) : (
            <ul className="space-y-2">
              {complaint.documents.map((document) => (
                <li key={document.id}>
                  <Link
                    href={`/api/documents/${document.id}/download`}
                    className="text-sm text-primary hover:underline"
                  >
                    {document.fileName}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CollapsibleSection>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          render={<Link href={`/complaints/${complaint.uuid}/edit`} />}
        >
          Edit Complaint
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setIsConfirmOpen(true)}
          disabled={isPending}
        >
          Delete Complaint
        </Button>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleDelete}
        isPending={isPending}
        title="Delete complaint"
        description="This removes the complaint and all of its lines. This cannot be undone."
        confirmLabel="Delete Complaint"
      />
    </div>
  );
};
