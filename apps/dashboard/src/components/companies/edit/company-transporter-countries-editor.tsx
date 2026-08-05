"use client";

import {
  deleteTransporterCountry,
  saveTransporterCountry,
} from "@/app/(dashboard)/companies/[uuid]/edit/transporter-countries/actions";
import {
  transporterCountryRowToValues,
  transporterCountryValuesEqual,
} from "@/app/(dashboard)/companies/[uuid]/edit/transporter-countries/mappers";
import {
  DEFAULT_TRANSPORTER_COUNTRY_ROW,
  TransporterCountryRowValues,
} from "@/app/(dashboard)/companies/[uuid]/edit/transporter-countries/validation";
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
import { SelectTransporterCountries } from "@/db/schema/transporter-countries";
import { deliveryTerms, transporterCountries } from "@/lib/enums";
import { generateUuid } from "@/lib/helpers";
import { DELIVERY_TERM_LABELS, TRANSPORTER_COUNTRY_LABELS } from "@/lib/labels";
import { Plus, Save, Trash2, X } from "lucide-react";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";

type DraftRow = {
  key: string;
  values: TransporterCountryRowValues;
};

type PendingSave =
  | { kind: "update"; uuid: string }
  | { kind: "insert"; key: string };

type RowCellsProps = {
  values: TransporterCountryRowValues;
  onPatch: (patch: Partial<TransporterCountryRowValues>) => void;
  disabled: boolean;
};

type Props = {
  companyUuid: string;
  transporterCountries: SelectTransporterCountries[];
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

const TransporterCountryRowCells = ({
  values,
  onPatch,
  disabled,
}: RowCellsProps) => (
  <>
    <TableCell>
      <Select
        options={countryOptions}
        value={values.country}
        onValueChange={(value) =>
          onPatch({
            country: value as TransporterCountryRowValues["country"],
          })
        }
        placeholder="Select"
        disabled={disabled}
      />
    </TableCell>
    <TableCell>
      <Select
        options={deliveryTermOptions}
        value={values.deliveryTerms}
        onValueChange={(value) =>
          onPatch({
            deliveryTerms:
              value as TransporterCountryRowValues["deliveryTerms"],
          })
        }
        placeholder="Select"
        disabled={disabled}
      />
    </TableCell>
    <TableCell>
      <Input
        inputMode="decimal"
        value={values.maxKg}
        onChange={(e) => onPatch({ maxKg: e.target.value })}
        disabled={disabled}
        className="h-8"
      />
    </TableCell>
    <TableCell>
      <Input
        inputMode="decimal"
        value={values.surchargePercentage}
        onChange={(e) => onPatch({ surchargePercentage: e.target.value })}
        disabled={disabled}
        className="h-8"
      />
    </TableCell>
  </>
);

export const CompanyTransporterCountriesEditor = ({
  companyUuid,
  transporterCountries: rows,
}: Props) => {
  const [edits, setEdits] = useState<
    Record<string, TransporterCountryRowValues>
  >({});
  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
  const [deleteTarget, setDeleteTarget] =
    useState<SelectTransporterCountries | null>(null);
  const pendingSaveRef = useRef<PendingSave | null>(null);

  const [saveState, dispatchSave, isSaving] = useActionState(
    saveTransporterCountry,
    {},
  );
  const [deleteState, dispatchDelete, isDeleting] = useActionState(
    deleteTransporterCountry,
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

  const rowValues = (
    row: SelectTransporterCountries,
  ): TransporterCountryRowValues =>
    edits[row.uuid] ?? transporterCountryRowToValues(row);

  const isRowDirty = (row: SelectTransporterCountries): boolean => {
    const edited = edits[row.uuid];
    return (
      edited !== undefined &&
      !transporterCountryValuesEqual(edited, transporterCountryRowToValues(row))
    );
  };

  const updateRow = (
    row: SelectTransporterCountries,
    patch: Partial<TransporterCountryRowValues>,
  ) =>
    setEdits((prev) => ({
      ...prev,
      [row.uuid]: {
        ...(prev[row.uuid] ?? transporterCountryRowToValues(row)),
        ...patch,
      },
    }));

  const updateDraft = (
    key: string,
    patch: Partial<TransporterCountryRowValues>,
  ) =>
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
      { key: generateUuid(), values: { ...DEFAULT_TRANSPORTER_COUNTRY_ROW } },
    ]);

  const handleSaveRow = (row: SelectTransporterCountries) => {
    const values = edits[row.uuid];
    if (!values) {
      return;
    }
    pendingSaveRef.current = { kind: "update", uuid: row.uuid };
    startTransition(() => {
      dispatchSave({ companyUuid, transporterCountryUuid: row.uuid, values });
    });
  };

  const handleSaveDraft = (draft: DraftRow) => {
    pendingSaveRef.current = { kind: "insert", key: draft.key };
    startTransition(() => {
      dispatchSave({
        companyUuid,
        transporterCountryUuid: null,
        values: draft.values,
      });
    });
  };

  const handleRemoveDraft = (key: string) =>
    setDraftRows((prev) => prev.filter((draft) => draft.key !== key));

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      startTransition(() => {
        dispatchDelete({
          companyUuid,
          transporterCountryUuid: deleteTarget.uuid,
        });
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

      {rows.length === 0 && draftRows.length === 0 && (
        <p className="py-2 text-center text-sm text-muted-foreground">
          No transporter countries yet — click New to add the first row.
        </p>
      )}

      {(rows.length > 0 || draftRows.length > 0) && (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-56">Country</TableHead>
                <TableHead className="w-64">Del. terms</TableHead>
                <TableHead className="w-28">Max. KG</TableHead>
                <TableHead className="w-40">Surcharge percentage</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.uuid}>
                  <TransporterCountryRowCells
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
                        <span className="sr-only">
                          Save transporter country
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        className="text-muted-foreground hover:text-destructive"
                        disabled={isBusy}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">
                          Delete transporter country
                        </span>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {draftRows.map((draft) => (
                <TableRow key={draft.key}>
                  <TransporterCountryRowCells
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
                          Save new transporter country
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
                          Discard new transporter country
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
        title="Delete transporter country"
        description={`Delete ${
          deleteTarget?.country
            ? `the ${TRANSPORTER_COUNTRY_LABELS[deleteTarget.country]} row`
            : "this transporter country row"
        }? This can't be undone.`}
        confirmLabel="Delete"
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
