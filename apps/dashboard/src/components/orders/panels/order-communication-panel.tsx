import {
  OrderCommunicationRow,
  OrderCompetitorRow,
} from "@/app/(dashboard)/orders/[uuid]/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { formatDateColumn, pluralize } from "@/lib/helpers";
import { COMMUNICATION_CHANNEL_LABELS } from "@/lib/labels";

type CommunicationProps = {
  rows: OrderCommunicationRow[];
};

type CompetitorProps = {
  rows: OrderCompetitorRow[];
};

/**
 * `Communication` — every attempt to send this order to the customer.
 *
 * It exists to answer one question: *did the confirmation reach them?* Until
 * this table there was no answer anywhere — a failed send wrote to the server
 * console and returned — so failures are the rows that matter most and are
 * shown in full, with the reason, rather than quietly filtered out.
 */
export const OrderCommunicationPanel = ({ rows }: CommunicationProps) => (
  <CollapsibleSection
    title="Communication"
    summary={
      rows.length === 0
        ? "Never sent"
        : `${rows.length} ${pluralize(rows.length, "send")}${
            rows.some((row) => row.failedCount > 0) ? " — some failed" : ""
          }`
    }
  >
    {rows.length === 0 ? (
      <p className="text-sm text-muted-foreground">
        This order has not been sent to the customer.
      </p>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sent</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead className="text-right">Delivered</TableHead>
            <TableHead className="text-right">Refused</TableHead>
            <TableHead>Why it failed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>{formatDateColumn(row.sentAt)}</TableCell>
              <TableCell>
                {COMMUNICATION_CHANNEL_LABELS[row.channel]}
              </TableCell>
              <TableCell>{row.recipient ?? "—"}</TableCell>
              <TableCell>{row.subject ?? "—"}</TableCell>
              <TableCell className="text-right tabular-nums">
                {row.deliveredCount}
              </TableCell>
              <TableCell
                className={
                  row.failedCount > 0
                    ? "text-right tabular-nums text-destructive"
                    : "text-right tabular-nums"
                }
              >
                {row.failedCount}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.failureReason ?? ""}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </CollapsibleSection>
);

/**
 * `Competitors` — who else is selling to this customer.
 *
 * Read through the order's company rather than stored against the order: a
 * rival's share of a customer's spend is a fact about the relationship, so a
 * copy per order could disagree with itself across that customer's orders.
 */
export const OrderCompetitorsPanel = ({ rows }: CompetitorProps) => (
  <CollapsibleSection
    title="Competitors"
    summary={
      rows.length === 0
        ? "None recorded"
        : `${rows.length} ${pluralize(rows.length, "firm")}`
    }
  >
    {rows.length === 0 ? (
      <p className="text-sm text-muted-foreground">
        Nobody else is recorded as selling to this customer.
      </p>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Firm</TableHead>
            <TableHead className="text-right">Revenue share</TableHead>
            <TableHead>Customer satisfaction</TableHead>
            <TableHead>Remarks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>{row.firm}</TableCell>
              <TableCell className="text-right tabular-nums">
                {row.revenueSharePercent
                  ? `${Number(row.revenueSharePercent).toFixed(2)} %`
                  : "—"}
              </TableCell>
              <TableCell>{row.customerSatisfaction ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {row.remarks ?? ""}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </CollapsibleSection>
);
