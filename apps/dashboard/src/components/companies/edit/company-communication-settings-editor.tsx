"use client";

import {
  deleteCompanyCommunicationSetting,
  saveCompanyCommunicationSetting,
} from "@/app/(dashboard)/companies/[uuid]/edit/communication-settings/actions";
import { communicationSettingRowToDialogValues } from "@/app/(dashboard)/companies/[uuid]/edit/communication-settings/mappers";
import {
  commSettingSchema,
  CommunicationSettingFormValues,
  DEFAULT_COMM_SETTING,
} from "@/app/(dashboard)/companies/validation";
import { CommunicationSettingDialog } from "@/components/companies/dialogs/communication-setting-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import { SelectCommunicationSettings } from "@/db/schema/communication-settings";
import {
  communicationSettingDocumentTypes,
  communicationSettingShapes,
  communicationSettingTypes,
} from "@/lib/enums";
import {
  COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS,
  COMMUNICATION_SETTING_SHAPE_LABELS,
  COMMUNICATION_SETTING_TYPE_LABELS,
} from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquare, Pencil, Plus, Trash2 } from "lucide-react";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type Props = {
  companyUuid: string;
  settings: SelectCommunicationSettings[];
};

const documentTypeOptions = [
  { value: "", label: "Select" },
  ...communicationSettingDocumentTypes.map((documentType) => ({
    value: documentType,
    label: COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS[documentType],
  })),
];

const communicationTypeOptions = [
  { value: "", label: "Select" },
  ...communicationSettingTypes.map((communicationType) => ({
    value: communicationType,
    label: COMMUNICATION_SETTING_TYPE_LABELS[communicationType],
  })),
];

const shapeOptions = [
  { value: "", label: "Empty" },
  ...communicationSettingShapes.map((shape) => ({
    value: shape,
    label: COMMUNICATION_SETTING_SHAPE_LABELS[shape],
  })),
];

export const CompanyCommunicationSettingsEditor = ({
  companyUuid,
  settings,
}: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedCommType, setSelectedCommType] = useState("");
  const [deleteTarget, setDeleteTarget] =
    useState<SelectCommunicationSettings | null>(null);

  const [saveState, dispatchSave, isSaving] = useActionState(
    saveCompanyCommunicationSetting,
    {},
  );
  const [deleteState, dispatchDelete, isDeleting] = useActionState(
    deleteCompanyCommunicationSetting,
    {},
  );

  const commSettingForm = useForm<CommunicationSettingFormValues>({
    resolver: zodResolver(commSettingSchema),
    defaultValues: DEFAULT_COMM_SETTING,
  });

  useEffect(() => {
    if (saveState.success) {
      setIsDialogOpen(false);
      setEditingId(null);
      setSelectedCommType("");
      commSettingForm.reset(DEFAULT_COMM_SETTING);
    }
  }, [saveState, commSettingForm]);

  useEffect(() => {
    if (deleteState.success) {
      setDeleteTarget(null);
    }
  }, [deleteState]);

  const handleOpenAdd = () => {
    commSettingForm.reset(DEFAULT_COMM_SETTING);
    setSelectedCommType("");
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (setting: SelectCommunicationSettings) => {
    commSettingForm.reset(communicationSettingRowToDialogValues(setting));
    setSelectedCommType(setting.communicationType);
    setEditingId(setting.id);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      commSettingForm.reset(DEFAULT_COMM_SETTING);
      setSelectedCommType("");
      setEditingId(null);
    }
    setIsDialogOpen(open);
  };

  const handleCancel = () => {
    handleDialogOpenChange(false);
  };

  const handleSave = commSettingForm.handleSubmit((values) => {
    startTransition(() => {
      dispatchSave({ companyUuid, settingId: editingId, values });
    });
  });

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      startTransition(() => {
        dispatchDelete({ companyUuid, settingId: deleteTarget.id });
      });
    }
  };

  return (
    <div className="space-y-4">
      <FormError>{saveState.error ?? deleteState.error}</FormError>

      <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
        {settings.length === 0 && (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No communication settings yet — add the first one below.
          </p>
        )}
        {settings.map((setting) => (
          <div
            key={setting.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
              <span className="line-clamp-1 text-foreground">
                {[
                  COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS[
                    setting.documentType
                  ],
                  COMMUNICATION_SETTING_TYPE_LABELS[setting.communicationType],
                ].join(" - ")}
              </span>
              {setting.shape && (
                <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                  {COMMUNICATION_SETTING_SHAPE_LABELS[setting.shape]}
                </span>
              )}
              {(setting.email || setting.fax) && (
                <span className="line-clamp-1 text-muted-foreground">
                  {setting.email ?? setting.fax}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => handleOpenEdit(setting)}
                className="rounded p-1 text-muted-foreground hover:text-primary"
                disabled={isSaving || isDeleting}
              >
                <Pencil className="size-4" />
                <span className="sr-only">Edit communication setting</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(setting)}
                className="rounded p-1 text-muted-foreground hover:text-destructive"
                disabled={isSaving || isDeleting}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Delete communication setting</span>
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          disabled={isSaving || isDeleting}
        >
          <Plus className="size-4" />
          Add Communication Setting
        </button>
      </div>

      <CommunicationSettingDialog
        isOpen={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onCancel={handleCancel}
        onSave={handleSave}
        form={commSettingForm}
        selectedCommType={selectedCommType}
        setSelectedCommType={setSelectedCommType}
        documentTypeOptions={documentTypeOptions}
        communicationTypeOptions={communicationTypeOptions}
        shapeOptions={shapeOptions}
        submitLabel={editingId !== null ? "Save Changes" : "Add Setting"}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete communication setting"
        description={`Delete ${
          deleteTarget
            ? [
                COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS[
                  deleteTarget.documentType
                ],
                COMMUNICATION_SETTING_TYPE_LABELS[
                  deleteTarget.communicationType
                ],
              ].join(" - ")
            : "this communication setting"
        }? This can't be undone.`}
        confirmLabel="Delete"
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
