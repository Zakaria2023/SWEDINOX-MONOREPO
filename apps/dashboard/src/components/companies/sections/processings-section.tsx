"use client";

import { CompanyProcessingInput } from "@/app/(dashboard)/companies/actions";
import { Checkbox } from "@/components/shadcn/checkbox";
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
import { deliveryTimeUnits, processingEditings } from "@/lib/enums";
import {
  DELIVERY_TIME_UNIT_LABELS,
  PROCESSING_EDITING_LABELS,
} from "@/lib/labels";
import { Plus, X } from "lucide-react";

type SupplierOption = {
  value: string;
  label: string;
};

type Props = {
  processings: CompanyProcessingInput[];
  addProcessing: () => void;
  updateProcessing: (
    index: number,
    patch: Partial<CompanyProcessingInput>,
  ) => void;
  removeProcessing: (index: number) => void;
  supplierOptions: SupplierOption[];
  isPending: boolean;
};

const editingOptions = [
  { value: "", label: "Empty" },
  ...processingEditings.map((editing) => ({
    value: editing,
    label: PROCESSING_EDITING_LABELS[editing],
  })),
];

const unitOptions = [
  { value: "", label: "Empty" },
  ...deliveryTimeUnits.map((unit) => ({
    value: unit,
    label: DELIVERY_TIME_UNIT_LABELS[unit],
  })),
];

export const ProcessingsSection = ({
  processings,
  addProcessing,
  updateProcessing,
  removeProcessing,
  supplierOptions,
  isPending,
}: Props) => (
  <section className="space-y-4">
    <div className="flex items-center justify-between border-b pb-2">
      <h2 className="text-lg font-semibold text-foreground">Processing</h2>
      <button
        type="button"
        onClick={addProcessing}
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        disabled={isPending}
      >
        <Plus className="size-4" />
        New
      </button>
    </div>

    {processings.length > 0 && (
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48">Editing</TableHead>
              <TableHead className="w-24 text-center">Preference</TableHead>
              <TableHead className="w-56">Supplier code</TableHead>
              <TableHead className="w-28">Delivery time</TableHead>
              <TableHead className="w-40">Unit</TableHead>
              <TableHead>Processor location</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {processings.map((processing, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Select
                    options={editingOptions}
                    value={processing.editing ?? ""}
                    onValueChange={(value) =>
                      updateProcessing(index, {
                        editing: (value ||
                          undefined) as CompanyProcessingInput["editing"],
                      })
                    }
                    placeholder="Select"
                    disabled={isPending}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={processing.preference ?? false}
                    onChange={(e) =>
                      updateProcessing(index, { preference: e.target.checked })
                    }
                    disabled={isPending}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    options={supplierOptions}
                    value={processing.supplierUuid ?? ""}
                    onValueChange={(value) =>
                      updateProcessing(index, {
                        supplierUuid: value || undefined,
                      })
                    }
                    placeholder="Select"
                    disabled={isPending}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={processing.deliveryTime ?? 0}
                    onChange={(e) =>
                      updateProcessing(index, {
                        deliveryTime:
                          e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    disabled={isPending}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    options={unitOptions}
                    value={processing.deliveryTimeUnit ?? ""}
                    onValueChange={(value) =>
                      updateProcessing(index, {
                        deliveryTimeUnit: (value ||
                          undefined) as CompanyProcessingInput["deliveryTimeUnit"],
                      })
                    }
                    placeholder="Select"
                    disabled={isPending}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={processing.processorLocation ?? ""}
                    onChange={(e) =>
                      updateProcessing(index, {
                        processorLocation: e.target.value,
                      })
                    }
                    placeholder="Processor location"
                    disabled={isPending}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => removeProcessing(index)}
                    className="text-muted-foreground hover:text-destructive"
                    disabled={isPending}
                  >
                    <X className="size-4" />
                    <span className="sr-only">Remove processing</span>
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
