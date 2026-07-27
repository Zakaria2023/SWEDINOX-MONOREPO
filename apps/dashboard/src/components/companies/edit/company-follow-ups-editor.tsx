"use client";

import {
  deleteCompanyFollowUp,
  saveCompanyFollowUp,
} from "@/app/(dashboard)/companies/[uuid]/edit/follow-ups/actions";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
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
import { SelectFollowUps } from "@/db/schema/follow-ups";
import { generateUuid, todayDateString } from "@/lib/helpers";
import { Plus, Save, X } from "lucide-react";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";

type FollowUpEditValues = {
  contactPerson: string;
  text: string;
  completed: boolean;
};

type FollowUpDraft = FollowUpEditValues & {
  key: string;
  date: string | null;
  by: string | null;
};

type DeleteTarget = {
  key: string;
  uuid: string | null;
};

type Props = {
  companyUuid: string;
  currentUserName: string | null;
  followUps: SelectFollowUps[];
};

export const CompanyFollowUpsEditor = ({
  companyUuid,
  currentUserName,
  followUps,
}: Props) => {
  const [drafts, setDrafts] = useState<FollowUpDraft[]>([]);
  const [edits, setEdits] = useState<Record<string, FollowUpEditValues>>({});
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const lastSavedKeyRef = useRef<string | null>(null);

  const [saveState, dispatchSave, isSaving] = useActionState(
    saveCompanyFollowUp,
    {},
  );
  const [deleteState, dispatchDelete, isDeleting] = useActionState(
    deleteCompanyFollowUp,
    {},
  );

  // After a successful save the revalidated server rows carry the new values,
  // so the saved draft (or the saved row's local edits) can be dropped.
  useEffect(() => {
    if (!saveState.success) {
      return;
    }
    const savedKey = lastSavedKeyRef.current;
    if (!savedKey) {
      return;
    }
    lastSavedKeyRef.current = null;
    setDrafts((prev) => prev.filter((draft) => draft.key !== savedKey));
    setEdits((prev) => {
      const next = { ...prev };
      delete next[savedKey];
      return next;
    });
  }, [saveState]);

  useEffect(() => {
    if (deleteState.success) {
      setDeleteTarget(null);
    }
  }, [deleteState]);

  const isBusy = isSaving || isDeleting;

  const getRowValues = (row: SelectFollowUps): FollowUpEditValues =>
    edits[row.uuid] ?? {
      contactPerson: row.contactPerson ?? "",
      text: row.text ?? "",
      completed: row.completed ?? false,
    };

  const isRowDirty = (row: SelectFollowUps): boolean => {
    const patch = edits[row.uuid];
    if (!patch) {
      return false;
    }
    return (
      patch.contactPerson !== (row.contactPerson ?? "") ||
      patch.text !== (row.text ?? "") ||
      patch.completed !== (row.completed ?? false)
    );
  };

  const updateRowEdit = (
    row: SelectFollowUps,
    patch: Partial<FollowUpEditValues>,
  ) =>
    setEdits((prev) => ({
      ...prev,
      [row.uuid]: { ...(prev[row.uuid] ?? getRowValues(row)), ...patch },
    }));

  const updateDraft = (key: string, patch: Partial<FollowUpEditValues>) =>
    setDrafts((prev) =>
      prev.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)),
    );

  // "New" appends an unsaved draft row with the date and "by" auto-filled —
  // the same defaults the legacy addFollowUp handler applied.
  const handleAddRow = () =>
    setDrafts((prev) => [
      ...prev,
      {
        key: generateUuid(),
        date: todayDateString(),
        by: currentUserName,
        contactPerson: "",
        text: "",
        completed: false,
      },
    ]);

  const handleSaveRow = (row: SelectFollowUps) => {
    lastSavedKeyRef.current = row.uuid;
    startTransition(() => {
      dispatchSave({
        companyUuid,
        followUpUuid: row.uuid,
        values: getRowValues(row),
      });
    });
  };

  const handleSaveDraft = (draft: FollowUpDraft) => {
    lastSavedKeyRef.current = draft.key;
    startTransition(() => {
      dispatchSave({
        companyUuid,
        followUpUuid: null,
        values: {
          date: draft.date ?? undefined,
          by: draft.by ?? undefined,
          contactPerson: draft.contactPerson,
          text: draft.text,
          completed: draft.completed,
        },
      });
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) {
      return;
    }
    if (deleteTarget.uuid) {
      const followUpUuid = deleteTarget.uuid;
      startTransition(() => {
        dispatchDelete({ companyUuid, followUpUuid });
      });
      return;
    }
    setDrafts((prev) => prev.filter((draft) => draft.key !== deleteTarget.key));
    setDeleteTarget(null);
  };

  const hasRows = followUps.length > 0 || drafts.length > 0;

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

      {hasRows ? (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Date</TableHead>
                <TableHead className="w-40">By</TableHead>
                <TableHead>Contact person</TableHead>
                <TableHead>Text</TableHead>
                <TableHead className="w-24 text-center">Completed</TableHead>
                <TableHead className="w-28 text-right">
                  Days in system
                </TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {followUps.map((row) => {
                const values = getRowValues(row);
                return (
                  <TableRow key={row.uuid}>
                    <TableCell className="text-muted-foreground">
                      {row.date ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.by ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={values.contactPerson}
                        onChange={(e) =>
                          updateRowEdit(row, { contactPerson: e.target.value })
                        }
                        placeholder="Contact person"
                        disabled={isBusy}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={values.text}
                        onChange={(e) =>
                          updateRowEdit(row, { text: e.target.value })
                        }
                        placeholder="Text"
                        disabled={isBusy}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={values.completed}
                        onChange={(e) =>
                          updateRowEdit(row, { completed: e.target.checked })
                        }
                        disabled={isBusy}
                      />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      0
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleSaveRow(row)}
                          className="text-muted-foreground hover:text-primary disabled:opacity-50"
                          disabled={isBusy || !isRowDirty(row)}
                        >
                          <Save className="size-4" />
                          <span className="sr-only">Save follow-up</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({ key: row.uuid, uuid: row.uuid })
                          }
                          className="text-muted-foreground hover:text-destructive"
                          disabled={isBusy}
                        >
                          <X className="size-4" />
                          <span className="sr-only">Remove follow-up</span>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {drafts.map((draft) => (
                <TableRow key={draft.key}>
                  <TableCell className="text-muted-foreground">
                    {draft.date ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {draft.by ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={draft.contactPerson}
                      onChange={(e) =>
                        updateDraft(draft.key, {
                          contactPerson: e.target.value,
                        })
                      }
                      placeholder="Contact person"
                      disabled={isBusy}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={draft.text}
                      onChange={(e) =>
                        updateDraft(draft.key, { text: e.target.value })
                      }
                      placeholder="Text"
                      disabled={isBusy}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={draft.completed}
                      onChange={(e) =>
                        updateDraft(draft.key, { completed: e.target.checked })
                      }
                      disabled={isBusy}
                    />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    0
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleSaveDraft(draft)}
                        className="text-muted-foreground hover:text-primary disabled:opacity-50"
                        disabled={isBusy}
                      >
                        <Save className="size-4" />
                        <span className="sr-only">Save follow-up</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({ key: draft.key, uuid: null })
                        }
                        className="text-muted-foreground hover:text-destructive"
                        disabled={isBusy}
                      >
                        <X className="size-4" />
                        <span className="sr-only">Remove follow-up</span>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="rounded-2xl border border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
          No follow-ups yet — add the first one with New.
        </p>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete follow-up"
        description="Delete this follow-up? This can't be undone."
        confirmLabel="Delete"
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
