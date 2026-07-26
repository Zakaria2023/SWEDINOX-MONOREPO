"use client";

import {
  deleteProcessing,
  saveProcessing,
} from "@/app/(dashboard)/companies/[uuid]/edit/processings/actions";
import {
  processingRowToValues,
  processingValuesEqual,
} from "@/app/(dashboard)/companies/[uuid]/edit/processings/mappers";
import {
  DEFAULT_PROCESSING_ROW,
  ProcessingRowValues,
} from "@/app/(dashboard)/companies/[uuid]/edit/processings/validation";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import type { SelectProcessings } from "@/db/schema/processings";
import { deliveryTimeUnits, processingEditings } from "@/lib/enums";
import { generateUuid } from "@/lib/helpers";
import {
  DELIVERY_TIME_UNIT_LABELS,
  PROCESSING_EDITING_LABELS,
} from "@/lib/labels";
import { Plus, Save, Trash2, X } from "lucide-react";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";

type SupplierOption = {
  value: string;
  label: string;
};

type DraftRow = {
  key: string;
  values: ProcessingRowValues;
};

type PendingSave =
  | { kind: "update"; uuid: string }
  | { kind: "insert"; key: string };

type RowCellsProps = {
  values: ProcessingRowValues;
  onPatch: (patch: Partial<ProcessingRowValues>) => void;
  supplierOptions: SupplierOption[];
  disabled: boolean;
};

type Props = {
  companyUuid: string;
  processings: SelectProcessings[];
  supplierOptions: SupplierOption[];
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

const ProcessingRowCells = ({
  values,
  onPatch,
  supplierOptions,
  disabled,
}: RowCellsProps) => (
  <>
    <TableCell>
      <Select
        options={editingOptions}
        value={values.editing}
        onValueChange={(value) =>
          onPatch({ editing: value as ProcessingRowValues["editing"] })
        }
        placeholder="Select"
        disabled={disabled}
      />
    </TableCell>
    <TableCell className="text-center">
      <Checkbox
        checked={values.preference}
        onChange={(e) => onPatch({ preference: e.target.checked })}
        disabled={disabled}
      />
    </TableCell>
    <TableCell>
      <Select
        options={[{ value: "", label: "Empty" }, ...supplierOptions]}
        value={values.supplierUuid}
        onValueChange={(value) => onPatch({ supplierUuid: value })}
        placeholder="Select"
        disabled={disabled}
      />
    </TableCell>
    <TableCell>
      <Input
        type="number"
        inputMode="numeric"
        value={values.deliveryTime}
        onChange={(e) =>
          onPatch({
            deliveryTime: e.target.value === "" ? 0 : Number(e.target.value),
          })
        }
        disabled={disabled}
        className="h-8"
      />
    </TableCell>
    <TableCell>
      <Select
        options={unitOptions}
        value={values.deliveryTimeUnit}
        onValueChange={(value) =>
          onPatch({
            deliveryTimeUnit: value as ProcessingRowValues["deliveryTimeUnit"],
          })
        }
        placeholder="Select"
        disabled={disabled}
      />
    </TableCell>
    <TableCell>
      <Input
        value={values.processorLocation}
        onChange={(e) => onPatch({ processorLocation: e.target.value })}
        placeholder="Processor location"
        disabled={disabled}
        className="h-8"
      />
    </TableCell>
  </>
);

export const CompanyProcessingsEditor = ({
  companyUuid,
  processings,
  supplierOptions,
}: Props) => {
  const [edits, setEdits] = useState<Record<string, ProcessingRowValues>>({});
  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SelectProcessings | null>(
    null,
  );
  const pendingSaveRef = useRef<PendingSave | null>(null);

  const [saveState, dispatchSave, isSaving] = useActionState(
    saveProcessing,
    {},
  );
  const [deleteState, dispatchDelete, isDeleting] = useActionState(
    deleteProcessing,
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

  const rowValues = (row: SelectProcessings): ProcessingRowValues =>
    edits[row.uuid] ?? processingRowToValues(row);

  const isRowDirty = (row: SelectProcessings): boolean => {
    const edited = edits[row.uuid];
    return (
      edited !== undefined &&
      !processingValuesEqual(edited, processingRowToValues(row))
    );
  };

  const updateRow = (
    row: SelectProcessings,
    patch: Partial<ProcessingRowValues>,
  ) =>
    setEdits((prev) => ({
      ...prev,
      [row.uuid]: {
        ...(prev[row.uuid] ?? processingRowToValues(row)),
        ...patch,
      },
    }));

  const updateDraft = (key: string, patch: Partial<ProcessingRowValues>) =>
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
      { key: generateUuid(), values: { ...DEFAULT_PROCESSING_ROW } },
    ]);

  const handleSaveRow = (row: SelectProcessings) => {
    const values = edits[row.uuid];
    if (!values) {
      return;
    }
    pendingSaveRef.current = { kind: "update", uuid: row.uuid };
    startTransition(() => {
      dispatchSave({ companyUuid, processingUuid: row.uuid, values });
    });
  };

  const handleSaveDraft = (draft: DraftRow) => {
    pendingSaveRef.current = { kind: "insert", key: draft.key };
    startTransition(() => {
      dispatchSave({ companyUuid, processingUuid: null, values: draft.values });
    });
  };

  const handleRemoveDraft = (key: string) =>
    setDraftRows((prev) => prev.filter((draft) => draft.key !== key));

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      startTransition(() => {
        dispatchDelete({ companyUuid, processingUuid: deleteTarget.uuid });
      });
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

      {processings.length === 0 && draftRows.length === 0 && (
        <p className="py-2 text-center text-sm text-muted-foreground">
          No processings yet — click New to add the first row.
        </p>
      )}

      {(processings.length > 0 || draftRows.length > 0) && (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Editing</TableHead>
                <TableHead className="w-24 text-center">Preference</TableHead>
                <TableHead className="w-56">Supplier code</TableHead>
                <TableHead className="w-28">Delivery time</TableHead>
                <TableHead className="w-40">Unit</TableHead>
                <TableHead>Processor location</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {processings.map((row) => (
                <TableRow key={row.uuid}>
                  <ProcessingRowCells
                    values={rowValues(row)}
                    onPatch={(patch) => updateRow(row, patch)}
                    supplierOptions={supplierOptions}
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
                        <span className="sr-only">Save processing</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        className="text-muted-foreground hover:text-destructive"
                        disabled={isBusy}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete processing</span>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {draftRows.map((draft) => (
                <TableRow key={draft.key}>
                  <ProcessingRowCells
                    values={draft.values}
                    onPatch={(patch) => updateDraft(draft.key, patch)}
                    supplierOptions={supplierOptions}
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
                        <span className="sr-only">Save new processing</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDraft(draft.key)}
                        className="text-muted-foreground hover:text-destructive"
                        disabled={isBusy}
                      >
                        <X className="size-4" />
                        <span className="sr-only">Discard new processing</span>
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
        title="Delete processing"
        description={`Delete ${
          deleteTarget?.editing
            ? `the ${PROCESSING_EDITING_LABELS[deleteTarget.editing]} processing row`
            : "this processing row"
        }? This can't be undone.`}
        confirmLabel="Delete"
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
