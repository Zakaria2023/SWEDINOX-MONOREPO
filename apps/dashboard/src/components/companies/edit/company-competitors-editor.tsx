"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import {
  CompanyCompetitorInput,
  saveCompanyCompetitors,
} from "@/app/(dashboard)/companies/[uuid]/edit/marketing/actions";
import { SelectCompanyCompetitors } from "@/db/schema/company-competitors";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { FormError } from "@/components/ui/form-error";
import { FormLabel } from "@/components/ui/form-field";

type Props = {
  companyUuid: string;
  competitors: SelectCompanyCompetitors[];
};

const EMPTY_ROW: CompanyCompetitorInput = {
  firm: "",
  revenueSharePercent: "",
  customerSatisfaction: "",
  remarks: "",
};

/**
 * Who else is selling to this customer.
 *
 * The reference shows this from a sales order, but the facts belong to the
 * relationship rather than to any one order, so they are kept and edited here
 * and the order's panel reads them through the company.
 *
 * `Customer satisfaction` is a free text box on purpose. The reference's column
 * header says nothing about a scale, and inventing one — five stars, a
 * percentage, three fixed words — would put a shape on the data that the
 * business has not chosen.
 */
export const CompanyCompetitorsEditor = ({
  companyUuid,
  competitors,
}: Props) => {
  const [rows, setRows] = useState<CompanyCompetitorInput[]>(
    competitors.length > 0
      ? competitors.map((competitor) => ({
          firm: competitor.firm,
          revenueSharePercent: competitor.revenueSharePercent ?? "",
          customerSatisfaction: competitor.customerSatisfaction ?? "",
          remarks: competitor.remarks ?? "",
        }))
      : [EMPTY_ROW],
  );
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const update = (
    index: number,
    key: keyof CompanyCompetitorInput,
    value: string,
  ) =>
    setRows((current) =>
      current.map((row, position) =>
        position === index ? { ...row, [key]: value } : row,
      ),
    );

  const save = () => {
    setSaved(false);
    startTransition(async () => {
      const result = await saveCompanyCompetitors(companyUuid, rows);
      setError(result.error);
      setSaved(!result.error);
    });
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="border-b pb-2 text-base font-semibold">Competitors</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Who else this customer buys from, and how much of their spend goes
          there. Shown on every order for this customer.
        </p>
      </div>

      {error && <FormError>{error}</FormError>}
      {saved && !error && (
        <p className="text-sm text-muted-foreground">Saved.</p>
      )}

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_120px_1fr_1fr_32px] items-start gap-3"
          >
            <div>
              {index === 0 && <FormLabel htmlFor={`firm-${index}`}>Firm</FormLabel>}
              <Input
                id={`firm-${index}`}
                value={row.firm}
                onChange={(event) => update(index, "firm", event.target.value)}
              />
            </div>
            <div>
              {index === 0 && (
                <FormLabel htmlFor={`share-${index}`}>Share %</FormLabel>
              )}
              <Input
                id={`share-${index}`}
                inputMode="decimal"
                className="text-right"
                value={row.revenueSharePercent}
                onChange={(event) =>
                  update(index, "revenueSharePercent", event.target.value)
                }
              />
            </div>
            <div>
              {index === 0 && (
                <FormLabel htmlFor={`satisfaction-${index}`}>
                  Customer satisfaction
                </FormLabel>
              )}
              <Input
                id={`satisfaction-${index}`}
                value={row.customerSatisfaction}
                onChange={(event) =>
                  update(index, "customerSatisfaction", event.target.value)
                }
              />
            </div>
            <div>
              {index === 0 && (
                <FormLabel htmlFor={`remarks-${index}`}>Remarks</FormLabel>
              )}
              <Input
                id={`remarks-${index}`}
                value={row.remarks}
                onChange={(event) =>
                  update(index, "remarks", event.target.value)
                }
              />
            </div>
            <button
              type="button"
              onClick={() =>
                setRows((current) =>
                  current.filter((_, position) => position !== index),
                )
              }
              className={
                index === 0
                  ? "mt-6 flex size-8 items-center justify-center text-muted-foreground hover:text-destructive"
                  : "flex size-8 items-center justify-center text-muted-foreground hover:text-destructive"
              }
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRows((current) => [...current, EMPTY_ROW])}
        >
          <Plus className="mr-1 size-3.5" /> Add competitor
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={isPending}>
          {isPending ? "Saving…" : "Save competitors"}
        </Button>
      </div>
    </section>
  );
};
