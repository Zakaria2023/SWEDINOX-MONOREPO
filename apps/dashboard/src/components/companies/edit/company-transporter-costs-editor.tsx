"use client";

import {
  deleteTransporterCost,
  saveTransporterCost,
} from "@/app/(dashboard)/companies/[uuid]/edit/transporter-costs/actions";
import {
  transporterCostRowToValues,
  transporterCostValuesEqual,
} from "@/app/(dashboard)/companies/[uuid]/edit/transporter-costs/mappers";
import {
  defaultTransporterCostRowValues,
  TransporterCostRowValues,
} from "@/app/(dashboard)/companies/[uuid]/edit/transporter-costs/validation";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import type { SelectTransporterCosts } from "@/db/schema/transporter-costs";
import { transporterPriceUnits } from "@/lib/enums";
import { generateUuid } from "@/lib/helpers";
import { TRANSPORTER_PRICE_UNIT_LABELS } from "@/lib/labels";
import { Plus, Save, Trash2, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

type DraftRow = {
  key: string;
  values: TransporterCostRowValues;
};

type PendingSave =
  | { kind: "update"; uuid: string }
  | { kind: "insert"; key: string };

type RowCellsProps = {
  values: TransporterCostRowValues;
  onPatch: (patch: Partial<TransporterCostRowValues>) => void;
  disabled: boolean;
};

type Props = {
  companyUuid: string;
  transporterCosts: SelectTransporterCosts[];
};

const priceUnitOptions = transporterPriceUnits.map((unit) => ({
  value: unit,
  label: TRANSPORTER_PRICE_UNIT_LABELS[unit],
}));

const TransporterCostRowCells = ({
  values,
  onPatch,
  disabled,
}: RowCellsProps) => (
  <>
    <TableCell>
      <DatePicker
        value={values.fromDate}
        onChange={(value) => onPatch({ fromDate: value })}
        disabled={disabled}
      />
    </TableCell>
    <TableCell>
      <DatePicker
        value={values.untilDate}
        onChange={(value) => onPatch({ untilDate: value })}
        disabled={disabled}
      />
    </TableCell>
    <TableCell className="text-center">
      <Checkbox
        checked={values.nowValid}
        onChange={(e) => onPatch({ nowValid: e.target.checked })}
        disabled={disabled}
      />
    </TableCell>
    <TableCell>
      <Input
        inputMode="decimal"
        value={values.fromKm}
        onChange={(e) => onPatch({ fromKm: e.target.value })}
        disabled={disabled}
        className="h-8"
      />
    </TableCell>
    <TableCell>
      <Input
        inputMode="decimal"
        value={values.untilKm}
        onChange={(e) => onPatch({ untilKm: e.target.value })}
        disabled={disabled}
        className="h-8"
      />
    </TableCell>
    <TableCell>
      <Input
        inputMode="decimal"
        value={values.fromKg}
        onChange={(e) => onPatch({ fromKg: e.target.value })}
        disabled={disabled}
        className="h-8"
      />
    </TableCell>
    <TableCell>
      <Input
        inputMode="decimal"
        value={values.untilKg}
        onChange={(e) => onPatch({ untilKg: e.target.value })}
        disabled={disabled}
        className="h-8"
      />
    </TableCell>
    <TableCell>
      <Input
        inputMode="decimal"
        value={values.price}
        onChange={(e) => onPatch({ price: e.target.value })}
        disabled={disabled}
        className="h-8"
      />
    </TableCell>
    <TableCell>
      <Select
        options={priceUnitOptions}
        value={values.priceUnit}
        onValueChange={(value) =>
          onPatch({
            priceUnit: value as TransporterCostRowValues["priceUnit"],
          })
        }
        disabled={disabled}
      />
    </TableCell>
    <TableCell>
      <Input
        inputMode="decimal"
        value={values.minAmount}
        onChange={(e) => onPatch({ minAmount: e.target.value })}
        disabled={disabled}
        className="h-8"
      />
    </TableCell>
    <TableCell>
      <Input
        inputMode="decimal"
        value={values.maxAmount}
        onChange={(e) => onPatch({ maxAmount: e.target.value })}
        disabled={disabled}
        className="h-8"
      />
    </TableCell>
  </>
);

export const CompanyTransporterCostsEditor = ({
  companyUuid,
  transporterCosts,
}: Props) => {
  const [edits, setEdits] = useState<Record<string, TransporterCostRowValues>>(
    {},
  );
  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
  const [deleteTarget, setDeleteTarget] =
    useState<SelectTransporterCosts | null>(null);
  const pendingSaveRef = useRef<PendingSave | null>(null);

  const [saveState, dispatchSave, isSaving] = useActionState(
    saveTransporterCost,
    {},
  );
  const [deleteState, dispatchDelete, isDeleting] = useActionState(
    deleteTransporterCost,
    {},
  );

  // On a successful save, drop the local override (updates) or the draft row
  // (inserts) — the revalidated server rows carry the saved values from here.
  useEffect(() => {
    if (!saveState.success) {
      return;
    }
    const pending = pendingSaveRef.current;
    pendingSaveRef.current = null;
    if (!pending) {
      return;
    }
    if (pending.kind === "update") {
      setEdits((prev) => {
        const next = { ...prev };
        delete next[pending.uuid];
        return next;
      });
    } else {
      setDraftRows((prev) => prev.filter((draft) => draft.key !== pending.key));
    }
  }, [saveState]);

  useEffect(() => {
    if (deleteState.success) {
      setDeleteTarget(null);
    }
  }, [deleteState]);

  const isBusy = isSaving || isDeleting;

  const rowValues = (row: SelectTransporterCosts): TransporterCostRowValues =>
    edits[row.uuid] ?? transporterCostRowToValues(row);

  const isRowDirty = (row: SelectTransporterCosts): boolean => {
    const edited = edits[row.uuid];
    return (
      edited !== undefined &&
      !transporterCostValuesEqual(edited, transporterCostRowToValues(row))
    );
  };

  const updateRow = (
    row: SelectTransporterCosts,
    patch: Partial<TransporterCostRowValues>,
  ) =>
    setEdits((prev) => ({
      ...prev,
      [row.uuid]: {
        ...(prev[row.uuid] ?? transporterCostRowToValues(row)),
        ...patch,
      },
    }));

  const updateDraft = (key: string, patch: Partial<TransporterCostRowValues>) =>
    setDraftRows((prev) =>
      prev.map((draft) =>
        draft.key === key
          ? { ...draft, values: { ...draft.values, ...patch } }
          : draft,
      ),
    );

  const handleAddRow = () =>
    setDraftRows((prev) => [
      ...prev,
      { key: generateUuid(), values: defaultTransporterCostRowValues() },
    ]);

  const handleSaveRow = (row: SelectTransporterCosts) => {
    const values = edits[row.uuid];
    if (!values) {
      return;
    }
    pendingSaveRef.current = { kind: "update", uuid: row.uuid };
    dispatchSave({ companyUuid, transporterCostUuid: row.uuid, values });
  };

  const handleSaveDraft = (draft: DraftRow) => {
    pendingSaveRef.current = { kind: "insert", key: draft.key };
    dispatchSave({
      companyUuid,
      transporterCostUuid: null,
      values: draft.values,
    });
  };

  const handleRemoveDraft = (key: string) =>
    setDraftRows((prev) => prev.filter((draft) => draft.key !== key));

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      dispatchDelete({ companyUuid, transporterCostUuid: deleteTarget.uuid });
    }
  };

  return (
    <div className="space-y-4">
      <FormError>{saveState.error ?? deleteState.error}</FormError>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          disabled={isBusy}
        >
          <Plus className="size-4" />
          New
        </button>
      </div>

      {transporterCosts.length === 0 && draftRows.length === 0 && (
        <p className="py-2 text-center text-sm text-muted-foreground">
          No transporter costs yet — click New to add the first row.
        </p>
      )}

      {(transporterCosts.length > 0 || draftRows.length > 0) && (
        <div className="overflow-x-auto rounded-2xl border border-border">
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
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {transporterCosts.map((row) => (
                <TableRow key={row.uuid}>
                  <TransporterCostRowCells
                    values={rowValues(row)}
                    onPatch={(patch) => updateRow(row, patch)}
                    disabled={isBusy}
                  />
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSaveRow(row)}
                        className="text-muted-foreground hover:text-primary disabled:pointer-events-none disabled:opacity-40"
                        disabled={!isRowDirty(row) || isBusy}
                      >
                        <Save className="size-4" />
                        <span className="sr-only">Save transporter cost</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        className="text-muted-foreground hover:text-destructive"
                        disabled={isBusy}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete transporter cost</span>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {draftRows.map((draft) => (
                <TableRow key={draft.key}>
                  <TransporterCostRowCells
                    values={draft.values}
                    onPatch={(patch) => updateDraft(draft.key, patch)}
                    disabled={isBusy}
                  />
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSaveDraft(draft)}
                        className="text-muted-foreground hover:text-primary disabled:pointer-events-none disabled:opacity-40"
                        disabled={isBusy}
                      >
                        <Save className="size-4" />
                        <span className="sr-only">
                          Save new transporter cost
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDraft(draft.key)}
                        className="text-muted-foreground hover:text-destructive"
                        disabled={isBusy}
                      >
                        <X className="size-4" />
                        <span className="sr-only">
                          Discard new transporter cost
                        </span>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete transporter cost"
        description="Delete this transporter cost row? This can't be undone."
        confirmLabel="Delete"
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
