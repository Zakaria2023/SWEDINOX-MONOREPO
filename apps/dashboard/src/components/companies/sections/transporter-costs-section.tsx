"use client";

import { CompanyTransporterCostInput } from "@/app/(dashboard)/companies/actions";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DatePicker } from "@/components/shadcn/date-picker";
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
import { transporterPriceUnits } from "@/lib/enums";
import { TRANSPORTER_PRICE_UNIT_LABELS } from "@/lib/labels";
import { Plus, X } from "lucide-react";

type Props = {
  transporterCosts: CompanyTransporterCostInput[];
  addTransporterCost: () => void;
  updateTransporterCost: (
    index: number,
    patch: Partial<CompanyTransporterCostInput>,
  ) => void;
  removeTransporterCost: (index: number) => void;
  isPending: boolean;
};

const priceUnitOptions = transporterPriceUnits.map((unit) => ({
  value: unit,
  label: TRANSPORTER_PRICE_UNIT_LABELS[unit],
}));

export const TransporterCostsSection = ({
  transporterCosts,
  addTransporterCost,
  updateTransporterCost,
  removeTransporterCost,
  isPending,
}: Props) => (
  <section className="space-y-4">
    <div className="flex items-center justify-between border-b pb-2">
      <h2 className="text-lg font-semibold text-foreground">
        Transporter costs
      </h2>
      <button
        type="button"
        onClick={addTransporterCost}
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        disabled={isPending}
      >
        <Plus className="size-4" />
        New
      </button>
    </div>

    {transporterCosts.length > 0 && (
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">From date</TableHead>
              <TableHead className="w-36">Until date</TableHead>
              <TableHead className="w-20 text-center">Now valid</TableHead>
              <TableHead className="w-24">From KM</TableHead>
              <TableHead className="w-24">Until KM</TableHead>
              <TableHead className="w-24">From KG</TableHead>
              <TableHead className="w-24">Until KG</TableHead>
              <TableHead className="w-24">Price</TableHead>
              <TableHead className="w-36">Price unit</TableHead>
              <TableHead className="w-28">Min. amount</TableHead>
              <TableHead className="w-28">Max. amount</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transporterCosts.map((cost, index) => (
              <TableRow key={index}>
                <TableCell>
                  <DatePicker
                    value={cost.fromDate ?? ""}
                    onChange={(value) =>
                      updateTransporterCost(index, { fromDate: value })
                    }
                  />
                </TableCell>
                <TableCell>
                  <DatePicker
                    value={cost.untilDate ?? ""}
                    onChange={(value) =>
                      updateTransporterCost(index, { untilDate: value })
                    }
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={cost.nowValid ?? false}
                    onChange={(e) =>
                      updateTransporterCost(index, {
                        nowValid: e.target.checked,
                      })
                    }
                    disabled={isPending}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    inputMode="decimal"
                    value={cost.fromKm ?? "0.000"}
                    onChange={(e) =>
                      updateTransporterCost(index, { fromKm: e.target.value })
                    }
                    disabled={isPending}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    inputMode="decimal"
                    value={cost.untilKm ?? "0.000"}
                    onChange={(e) =>
                      updateTransporterCost(index, { untilKm: e.target.value })
                    }
                    disabled={isPending}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    inputMode="decimal"
                    value={cost.fromKg ?? "0.000"}
                    onChange={(e) =>
                      updateTransporterCost(index, { fromKg: e.target.value })
                    }
                    disabled={isPending}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    inputMode="decimal"
                    value={cost.untilKg ?? "0.000"}
                    onChange={(e) =>
                      updateTransporterCost(index, { untilKg: e.target.value })
                    }
                    disabled={isPending}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    inputMode="decimal"
                    value={cost.price ?? "0.00"}
                    onChange={(e) =>
                      updateTransporterCost(index, { price: e.target.value })
                    }
                    disabled={isPending}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    options={priceUnitOptions}
                    value={cost.priceUnit ?? "amount"}
                    onValueChange={(value) =>
                      updateTransporterCost(index, {
                        priceUnit:
                          value as CompanyTransporterCostInput["priceUnit"],
                      })
                    }
                    disabled={isPending}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    inputMode="decimal"
                    value={cost.minAmount ?? "0.00"}
                    onChange={(e) =>
                      updateTransporterCost(index, {
                        minAmount: e.target.value,
                      })
                    }
                    disabled={isPending}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    inputMode="decimal"
                    value={cost.maxAmount ?? "0.00"}
                    onChange={(e) =>
                      updateTransporterCost(index, {
                        maxAmount: e.target.value,
                      })
                    }
                    disabled={isPending}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => removeTransporterCost(index)}
                    className="text-muted-foreground hover:text-destructive"
                    disabled={isPending}
                  >
                    <X className="size-4" />
                    <span className="sr-only">Remove transporter cost</span>
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
