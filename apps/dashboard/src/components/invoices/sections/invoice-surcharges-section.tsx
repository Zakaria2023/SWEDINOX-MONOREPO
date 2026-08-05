"use client";

import { InvoiceSurchargeInput } from "@/app/(dashboard)/invoices/actions";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { INVOICE_SURCHARGE_DESCRIPTION_LABELS } from "@/lib/labels";
import { Pencil, Plus, X } from "lucide-react";

type InvoiceSurchargesSectionProps = {
  isPending: boolean;
  surcharges: InvoiceSurchargeInput[];
  surchargeError: string | null;
  onOpenDialog: () => void;
  onEditSurcharge: (index: number) => void;
  onRemoveSurcharge: (index: number) => void;
};

export const InvoiceSurchargesSection = ({
  isPending,
  surcharges,
  surchargeError,
  onOpenDialog,
  onEditSurcharge,
  onRemoveSurcharge,
}: InvoiceSurchargesSectionProps) => {
  const na = "—";

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          Surcharges{" "}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {surcharges.length}{" "}
            {surcharges.length === 1 ? "surcharge" : "surcharges"}
          </span>
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenDialog}
          disabled={isPending}
        >
          <Plus className="mr-1.5 size-4" />
          Add Surcharge
        </Button>
      </div>

      {surcharges.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Order</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Surcharge</TableHead>
                <TableHead className="w-24">Unit</TableHead>
                <TableHead className="text-right">Surcharge %</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {surcharges.map((s, index) => (
                <TableRow key={index}>
                  <TableCell>{s.order}</TableCell>
                  <TableCell>
                    {s.description
                      ? INVOICE_SURCHARGE_DESCRIPTION_LABELS[s.description]
                      : na}
                  </TableCell>
                  <TableCell className="text-right">{s.surcharge}</TableCell>
                  <TableCell>{s.unit ?? na}</TableCell>
                  <TableCell className="text-right">
                    {s.surchargePercentage}
                  </TableCell>
                  <TableCell className="text-right">{s.amount}</TableCell>
                  <TableCell className="text-right">{s.profit}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditSurcharge(index)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveSurcharge(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {surchargeError && (
        <p className="text-sm font-medium text-destructive">{surchargeError}</p>
      )}
    </section>
  );
};
