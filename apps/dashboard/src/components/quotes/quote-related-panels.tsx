"use client";

import { useFormContext } from "react-hook-form";
import { QuoteDetail } from "@/app/(dashboard)/quotes/actions";
import { QuoteFormValues } from "@/app/(dashboard)/quotes/validation";
import { Input } from "@/components/shadcn/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { FormLabel } from "@/components/ui/form-field";
import {
  formatDateColumn,
  formatMoney,
  orDash,
  pluralize,
} from "@/lib/helpers";

type OptionsPanelProps = {
  quote: QuoteDetail | null;
  selectedLine: number | null;
  readOnly: boolean;
};

type CustomerPanelsProps = {
  quote: QuoteDetail;
};

type EmptyRowProps = {
  columns: number;
  text: string;
};

const EmptyRow = ({ columns, text }: EmptyRowProps) => (
  <TableRow>
    <TableCell colSpan={columns} className="text-muted-foreground">
      {text}
    </TableCell>
  </TableRow>
);

/**
 * `Options`: the processing quoted on the lines. The selected line's options
 * are typed here, and the options priced onto a saved quote are listed below.
 */
export const QuoteOptionsPanel = ({
  quote,
  selectedLine,
  readOnly,
}: OptionsPanelProps) => {
  const { register } = useFormContext<QuoteFormValues>();
  const options = quote?.options ?? [];

  return (
    <CollapsibleSection
      title="Options"
      summary={pluralize(options.length, "option")}
    >
      <div className="space-y-3 p-3">
        {selectedLine === null ? (
          <p className="text-sm text-muted-foreground">
            Select a line to type its options.
          </p>
        ) : (
          <div className="max-w-md">
            <FormLabel htmlFor="lineOptions">
              Options on line {(selectedLine + 1) * 10}
            </FormLabel>
            <Input
              key={selectedLine}
              id="lineOptions"
              disabled={readOnly}
              {...register(`items.${selectedLine}.options`)}
            />
          </div>
        )}
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Option</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.length === 0 ? (
                <EmptyRow columns={6} text="No options priced on these lines." />
              ) : (
                options.map((option) => (
                  <TableRow key={option.uuid}>
                    <TableCell className="font-medium">
                      {orDash(option.optionCode)}
                    </TableCell>
                    <TableCell>{orDash(option.optionName)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {option.quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(option.amount ?? 0))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(option.cost ?? 0))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(option.profit ?? 0))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </CollapsibleSection>
  );
};

/**
 * The customer-scoped context the reference shows beside a quote: the
 * contract it is priced against, the customer's complaints, open follow-ups
 * and competitors, and the purchase lines (not linked to a quote here).
 */
export const QuoteCustomerPanels = ({ quote }: CustomerPanelsProps) => (
  <>
    <CollapsibleSection
      title="Contracts"
      summary={quote.contractCode ?? "No contract linked"}
    >
      <p className="p-3 text-sm text-muted-foreground">
        {quote.contractCode
          ? `Priced against contract ${quote.contractCode}.`
          : "This quote is not priced against a contract."}
      </p>
    </CollapsibleSection>

    <CollapsibleSection
      title="Complaints"
      summary={
        quote.complaints.length === 0
          ? "No complaints"
          : pluralize(quote.complaints.length, "complaint")
      }
    >
      <div className="p-3">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quote.complaints.length === 0 ? (
                <EmptyRow
                  columns={3}
                  text="No complaints recorded for this customer."
                />
              ) : (
                quote.complaints.map((complaint) => (
                  <TableRow key={complaint.uuid}>
                    <TableCell>{formatDateColumn(complaint.createdAt)}</TableCell>
                    <TableCell>{orDash(complaint.description)}</TableCell>
                    <TableCell>{orDash(complaint.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </CollapsibleSection>

    <CollapsibleSection
      title="Follow-up"
      summary={
        quote.followUps.length === 0
          ? "No open follow-ups"
          : pluralize(quote.followUps.length, "open follow-up")
      }
    >
      <div className="p-3">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>By</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Text</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quote.followUps.length === 0 ? (
                <EmptyRow
                  columns={4}
                  text="No open follow-ups for this customer."
                />
              ) : (
                quote.followUps.map((followUp) => (
                  <TableRow key={followUp.uuid}>
                    <TableCell>{orDash(followUp.date)}</TableCell>
                    <TableCell>{orDash(followUp.by)}</TableCell>
                    <TableCell>{orDash(followUp.contactPerson)}</TableCell>
                    <TableCell>{orDash(followUp.text)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </CollapsibleSection>

    <CollapsibleSection
      title="Competitors"
      summary={quote.competitors ? "Recorded" : "None recorded"}
    >
      <p className="p-3 text-sm whitespace-pre-wrap text-muted-foreground">
        {quote.competitors ?? "No competitors recorded for this customer."}
      </p>
    </CollapsibleSection>

    <CollapsibleSection
      title="Purchase lines"
      summary="Not linked to purchasing yet"
    >
      <p className="p-3 text-sm text-muted-foreground">
        Purchase lines are not linked to a quote in this system — a purchase
        order references its supplier and products, not the quote that
        prompted it.
      </p>
    </CollapsibleSection>
  </>
);
