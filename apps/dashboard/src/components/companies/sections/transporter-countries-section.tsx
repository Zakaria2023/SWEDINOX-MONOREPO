"use client";

import { CompanyTransporterCountryInput } from "@/app/(dashboard)/companies/actions";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { deliveryTerms, transporterCountries } from "@/lib/enums";
import { DELIVERY_TERM_LABELS, TRANSPORTER_COUNTRY_LABELS } from "@/lib/labels";
import { Plus, X } from "lucide-react";

type Props = {
  transporterCountries: CompanyTransporterCountryInput[];
  addTransporterCountry: () => void;
  updateTransporterCountry: (
    index: number,
    patch: Partial<CompanyTransporterCountryInput>,
  ) => void;
  removeTransporterCountry: (index: number) => void;
  isPending: boolean;
};

const countryOptions = [
  { value: "", label: "Empty" },
  ...transporterCountries.map((country) => ({
    value: country,
    label: `${country} — ${TRANSPORTER_COUNTRY_LABELS[country]}`,
  })),
];

const deliveryTermOptions = [
  { value: "", label: "Empty" },
  ...deliveryTerms.map((term) => ({
    value: term,
    label: DELIVERY_TERM_LABELS[term],
  })),
];

export const TransporterCountriesSection = ({
  transporterCountries: rows,
  addTransporterCountry,
  updateTransporterCountry,
  removeTransporterCountry,
  isPending,
}: Props) => (
  <section className="space-y-4">
    <div className="flex items-center justify-between border-b pb-2">
      <h2 className="text-lg font-semibold text-gray-800">
        Transporter countries
      </h2>
      <button
        type="button"
        onClick={addTransporterCountry}
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        disabled={isPending}
      >
        <Plus className="size-4" />
        New
      </button>
    </div>

    {rows.length > 0 && (
      <div className="overflow-x-auto rounded-2xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-56">Country</TableHead>
              <TableHead className="w-64">Del. terms</TableHead>
              <TableHead className="w-28">Max. KG</TableHead>
              <TableHead className="w-40">Surcharge percentage</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Select
                    options={countryOptions}
                    value={row.country ?? ""}
                    onValueChange={(value) =>
                      updateTransporterCountry(index, {
                        country: (value ||
                          undefined) as CompanyTransporterCountryInput["country"],
                      })
                    }
                    placeholder="Select"
                    disabled={isPending}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    options={deliveryTermOptions}
                    value={row.deliveryTerms ?? ""}
                    onValueChange={(value) =>
                      updateTransporterCountry(index, {
                        deliveryTerms: (value ||
                          undefined) as CompanyTransporterCountryInput["deliveryTerms"],
                      })
                    }
                    placeholder="Select"
                    disabled={isPending}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    inputMode="decimal"
                    value={row.maxKg ?? "0.000"}
                    onChange={(e) =>
                      updateTransporterCountry(index, { maxKg: e.target.value })
                    }
                    disabled={isPending}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    inputMode="decimal"
                    value={row.surchargePercentage ?? "0.00"}
                    onChange={(e) =>
                      updateTransporterCountry(index, {
                        surchargePercentage: e.target.value,
                      })
                    }
                    disabled={isPending}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => removeTransporterCountry(index)}
                    className="text-muted-foreground hover:text-destructive"
                    disabled={isPending}
                  >
                    <X className="size-4" />
                    <span className="sr-only">Remove transporter country</span>
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )}
  </section>
);
