"use client";

import {
  deleteCompanyProject,
  saveCompanyProject,
} from "@/app/(dashboard)/companies/[uuid]/edit/projects/actions";
import { projectRowToDialogValues } from "@/app/(dashboard)/companies/[uuid]/edit/projects/mappers";
import {
  DEFAULT_PROJECT_VALUES,
  projectDialogSchema,
  ProjectDialogValues,
} from "@/app/(dashboard)/companies/[uuid]/edit/projects/validation";
import type { ContractForProjectOption } from "@/app/(dashboard)/contracts/actions";
import { ProjectDialog } from "@/components/companies/dialogs/project-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import type { SelectCustomerProjects } from "@/db/schema/customer-projects";
import { zodResolver } from "@hookform/resolvers/zod";
import { FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type Props = {
  companyUuid: string;
  projects: SelectCustomerProjects[];
  projectContracts: ContractForProjectOption[];
};

export const CompanyProjectsEditor = ({
  companyUuid,
  projects,
  projectContracts,
}: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<SelectCustomerProjects | null>(null);

  const [saveState, dispatchSave, isSaving] = useActionState(
    saveCompanyProject,
    {},
  );
  const [deleteState, dispatchDelete, isDeleting] = useActionState(
    deleteCompanyProject,
    {},
  );

  const projectForm = useForm<ProjectDialogValues>({
    resolver: zodResolver(projectDialogSchema),
    defaultValues: DEFAULT_PROJECT_VALUES,
  });

  useEffect(() => {
    if (saveState.success) {
      setIsDialogOpen(false);
      setEditingUuid(null);
      projectForm.reset(DEFAULT_PROJECT_VALUES);
    }
  }, [saveState, projectForm]);

  useEffect(() => {
    if (deleteState.success) {
      setDeleteTarget(null);
    }
  }, [deleteState]);

  const handleOpenAdd = () => {
    projectForm.reset(DEFAULT_PROJECT_VALUES);
    setEditingUuid(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (project: SelectCustomerProjects) => {
    projectForm.reset(projectRowToDialogValues(project));
    setEditingUuid(project.uuid);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      projectForm.reset(DEFAULT_PROJECT_VALUES);
      setEditingUuid(null);
    }
    setIsDialogOpen(open);
  };

  const handleCancel = () => {
    handleDialogOpenChange(false);
  };

  const handleSave = projectForm.handleSubmit((values) => {
    startTransition(() => {
      dispatchSave({ companyUuid, projectUuid: editingUuid, values });
    });
  });

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      startTransition(() => {
        dispatchDelete({ companyUuid, projectUuid: deleteTarget.uuid });
      });
    }
  };

  return (
    <div className="space-y-4">
      <FormError>{saveState.error ?? deleteState.error}</FormError>

      <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
        {projects.length === 0 && (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No projects yet — add the first one below.
          </p>
        )}
        {projects.map((project) => {
          const contract = projectContracts.find(
            (c) => c.uuid === project.contractUuid,
          );
          return (
            <div
              key={project.uuid}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                <span className="line-clamp-1 text-gray-800">
                  {project.projectName || "Project"}
                </span>
                {project.startingDate && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {project.startingDate}
                    {project.endDate ? ` → ${project.endDate}` : ""}
                  </span>
                )}
                {project.contractUuid && (
                  <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    {contract?.code ?? "Contract"}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(project)}
                  className="rounded p-1 text-muted-foreground hover:text-primary"
                  disabled={isSaving || isDeleting}
                >
                  <Pencil className="size-4" />
                  <span className="sr-only">Edit project</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(project)}
                  className="rounded p-1 text-muted-foreground hover:text-destructive"
                  disabled={isSaving || isDeleting}
                >
                  <Trash2 className="size-4" />
                  <span className="sr-only">Delete project</span>
                </button>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          disabled={isSaving || isDeleting}
        >
          <Plus className="size-4" />
          Add Project
        </button>
      </div>

      <ProjectDialog
        isOpen={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onCancel={handleCancel}
        onSave={handleSave}
        form={projectForm}
        projectContracts={projectContracts}
        submitLabel={editingUuid ? "Save Changes" : "Add Project"}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete project"
        description={`Delete ${
          deleteTarget?.projectName || "this project"
        }? This can't be undone.`}
        confirmLabel="Delete"
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
